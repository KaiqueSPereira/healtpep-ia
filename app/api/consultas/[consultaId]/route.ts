
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { decryptString, encryptString, safeDecrypt } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Prisma, Consultatype } from '@prisma/client';
import { logAction } from "@/app/_lib/logger";

const getConsultaIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
};

async function getSessionInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Não autorizado");
  }
  return { session, userId: session.user.id };
}

// NOTE: These types and functions could be further optimized for type safety
interface AnotacaoParaDescriptografar { id: string; anotacao: string; createdAt: Date; }
interface ExameParaDescriptografar { id: string; tipo: string; anotacao: string; dataExame: Date; profissional?: { nome: string } | null; unidades?: { nome: string } | null; }
interface HistoricoItem { id: string; tipo: Consultatype; motivo: string | null; data: Date; profissional: { nome: string } | null; unidade: { nome: string } | null; }

const consultaWithRelations = Prisma.validator<Prisma.ConsultasDefaultArgs>()({ include: { condicoes: true, profissional: true, unidade: { include: { endereco: true } }, Anotacoes: { orderBy: { createdAt: 'desc' } }, anexos: true, Exame: { include: { profissional: true, unidades: { include: { endereco: true } } }, orderBy: { dataExame: 'desc' } }, consultaOrigem: { include: { Anotacoes: { orderBy: { createdAt: 'desc' } }, anexos: true, Exame: { include: { profissional: true, unidades: { include: { endereco: true } } }, orderBy: { dataExame: 'desc' } } } }, retornos: { include: { profissional: true, unidade: { include: { endereco: true } } }, orderBy: { data: 'desc' } } } });

const decryptAnotacoes = (anotacoes: AnotacaoParaDescriptografar[] | undefined) => {
    if (!anotacoes) return [];
    return anotacoes.map(a => ({ ...a, anotacao: safeDecrypt(a.anotacao) }));
};

const decryptExames = (exames: ExameParaDescriptografar[] | undefined) => {
    if (!exames) return [];
    return exames.map(e => ({ ...e, tipo: safeDecrypt(e.tipo), anotacao: safeDecrypt(e.anotacao), dataExame: new Date(e.dataExame).toISOString() }));
};

export async function GET(request: Request) {
  let userId: string | undefined;
  const consultaId = getConsultaIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!consultaId) return NextResponse.json({ error: "ID da Consulta não encontrado" }, { status: 400 });

    const consulta = await db.consultas.findUnique({ where: { id: consultaId, userId }, ...consultaWithRelations });
    if (!consulta) return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });

    let historicoTratamento: HistoricoItem[] | null = null;
    if (consulta.condicoes && consulta.condicoes.length > 0) {
        const condicaoId = consulta.condicoes[0].id;
        const consultasDoTratamento = await db.consultas.findMany({ where: { userId, condicoes: { some: { id: condicaoId } } }, include: { profissional: true, unidade: true }, orderBy: { data: 'asc' } });
        historicoTratamento = consultasDoTratamento.map(c => ({ id: c.id, tipo: c.tipo, motivo: safeDecrypt(c.motivo), data: c.data, profissional: c.profissional ? { nome: safeDecrypt(c.profissional.nome) } : null, unidade: c.unidade ? { nome: c.unidade.nome } : null }));
    }

    const responseData = {
        ...consulta,
        motivo: safeDecrypt(consulta.motivo),
        tipodeexame: safeDecrypt(consulta.tipodeexame|| ""),
        Anotacoes: decryptAnotacoes(consulta.Anotacoes as AnotacaoParaDescriptografar[]),
        Exame: decryptExames(consulta.Exame as ExameParaDescriptografar[]),
        consultaOrigem: consulta.consultaOrigem ? { ...consulta.consultaOrigem, motivo: safeDecrypt(consulta.consultaOrigem.motivo), Anotacoes: decryptAnotacoes(consulta.consultaOrigem.Anotacoes as AnotacaoParaDescriptografar[]), Exame: decryptExames(consulta.consultaOrigem.Exame as ExameParaDescriptografar[]) } : null,
        historicoTratamento,
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    if (errorMessage !== "Não autorizado") {
        await logAction({ userId, action: "get_consulta_error", level: "error", message: `Erro ao buscar consulta '${consultaId}'`, details: errorMessage, component: "consultas-api" });
    }
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}

export async function PATCH(request: Request) {
  let userId: string | undefined;
  const consultaId = getConsultaIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!consultaId) return NextResponse.json({ error: "ID da Consulta não encontrado" }, { status: 400 });

    const body = await request.json();
    const { motivo, tipodeexame, data, profissionalId, unidadeId, consultaOrigemId, ...rest } = body;
    const dataToUpdate: Prisma.ConsultasUpdateInput = { ...rest };

    if (motivo) dataToUpdate.motivo = encryptString(motivo);
    if (tipodeexame) dataToUpdate.tipodeexame = encryptString(tipodeexame);
    if (data) dataToUpdate.data = new Date(data);

    if (profissionalId) dataToUpdate.profissional = { connect: { id: profissionalId } };
    else if (profissionalId === null) dataToUpdate.profissional = { disconnect: true };

    if (unidadeId) dataToUpdate.unidade = { connect: { id: unidadeId } };
    else if (unidadeId === null) dataToUpdate.unidade = { disconnect: true };

    if (consultaOrigemId) dataToUpdate.consultaOrigem = { connect: { id: consultaOrigemId } };
    else if (consultaOrigemId === null) dataToUpdate.consultaOrigem = { disconnect: true };

    const consultaAtualizada = await db.consultas.update({ where: { id: consultaId, userId }, data: dataToUpdate });

    await logAction({ userId, action: "update_consulta", level: "info", message: `Consulta '${consultaId}' atualizada com sucesso`, component: "consultas-api" });

    return NextResponse.json(consultaAtualizada);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "update_consulta_error", level: "error", message: `Erro ao atualizar consulta '${consultaId}'`, details: errorMessage, component: "consultas-api" });
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro ao atualizar consulta: ${errorMessage}` }, { status });
  }
}

export async function DELETE(request: Request) {
  let userId: string | undefined;
  const consultaId = getConsultaIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!consultaId) return NextResponse.json({ error: "ID da Consulta não encontrado" }, { status: 400 });

    await db.consultas.delete({ where: { id: consultaId, userId } });

    await logAction({ userId, action: "delete_consulta", level: "info", message: `Consulta '${consultaId}' deletada com sucesso`, component: "consultas-api" });

    return NextResponse.json({ message: "Consulta deletada com sucesso" }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "delete_consulta_error", level: "error", message: `Erro ao deletar consulta '${consultaId}'`, details: errorMessage, component: "consultas-api" });
    
    let status = 500;
    let message = "Erro ao deletar consulta";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        status = 409;
        message = 'Não é possível apagar. Existem consultas de retorno vinculadas a esta consulta.';
    } else if (errorMessage === "Não autorizado") {
        status = 401;
        message = "Não autorizado";
    }

    return NextResponse.json({ error: message }, { status });
  }
}
