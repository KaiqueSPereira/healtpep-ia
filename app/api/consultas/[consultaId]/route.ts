import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { safeDecrypt, encryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Consultas, Anotacoes, Exame, AnexoConsulta } from '@prisma/client';

interface ConsultaParams {
  params: { consultaId: string };
}

// Função auxiliar para obter o ID do usuário autenticado
const getUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return null;
  }
  return session.user.id;
};

// 📌 GET - Buscar uma consulta específica
export async function GET(_request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Tipar a variável para incluir a nova relação de anexos
    const consulta: (Consultas & { Anotacoes: Anotacoes[], Exame: Exame[], anexos: AnexoConsulta[] } | null) = await db.consultas.findUnique({
      where: {
        id: params.consultaId,
        usuario: {
          id: userId
        }
      },
      include: {
        profissional: true,
        unidade: true,
        usuario: true,
        Anotacoes: true,
        Exame: true,
        anexos: true, // <<< CORREÇÃO: Incluir os anexos na busca
      },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada ou você não tem permissão para acessá-la" },
        { status: 404 },
      );
    }

    // Decrypt sensitive fields e incluir os anexos na resposta
    const decryptedConsulta = {
      ...consulta,
      motivo: consulta.motivo ? safeDecrypt(consulta.motivo) : null,
      tipodeexame: consulta.tipodeexame ? safeDecrypt(consulta.tipodeexame) : null,
      Anotacoes: consulta.Anotacoes ? consulta.Anotacoes.map((anotacao: Anotacoes) => ({
        ...anotacao,
        anotacao: safeDecrypt(anotacao.anotacao),
      })) : [],

      Exame: consulta.Exame ? consulta.Exame.map((exame: Exame) => {
      return {
        ...exame,
        tipo: typeof exame.tipo === 'string' ? safeDecrypt(exame.tipo) : exame.tipo,
        anotacao: typeof exame.anotacao === 'string' ? safeDecrypt(exame.anotacao) : exame.anotacao,
        dataExame: typeof exame.dataExame === 'object' ? exame.dataExame.toISOString() : exame.dataExame,
      };
     }) : [],
     anexos: consulta.anexos || [], // <<< CORREÇÃO: Adicionar os anexos à resposta final
    };

    return NextResponse.json(decryptedConsulta);

  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { motivo, tipodeexame, ...rest } = body;

    const dataToUpdate = { ...rest };

    if (motivo !== undefined) {
      dataToUpdate.motivo = motivo ? encryptString(motivo) : null;
    }

    if (tipodeexame !== undefined) {
      dataToUpdate.tipodeexame = tipodeexame ? encryptString(tipodeexame) : null;
    }

    const consultaAtualizada = await db.consultas.update({
      where: {
        id: params.consultaId,
        usuario: { 
          id: userId
        }
      },
      data: dataToUpdate,
      include: { profissional: true, unidade: true, usuario: true },
    });

    return NextResponse.json(consultaAtualizada);

  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar consulta" },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Deletar uma consulta
export async function DELETE(_request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    await db.consultas.delete({
      where: {
        id: params.consultaId,
        usuario: { 
          id: userId
        }
      },
    });

    return NextResponse.json(
      { message: "Consulta deletada com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar consulta" },
      { status: 500 },
    );
  }
}
