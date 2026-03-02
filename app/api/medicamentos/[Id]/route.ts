
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';
import { TipoMedicamento, StatusMedicamento, FrequenciaTipo, Prisma } from '@prisma/client';
import { logAction } from "@/app/_lib/logger";

const getIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

async function getSessionInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Não autorizado");
  }
  return { session, userId: session.user.id };
}

const medicamentoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').optional(),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().url().optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoMedicamento).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(StatusMedicamento).optional(),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional().nullable(),
  condicaoSaudeId: z.string().optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  let userId: string | undefined;
  const Id = getIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!Id) return NextResponse.json({ error: "ID do Medicamento não encontrado" }, { status: 400 });

    const medicamento = await db.medicamento.findUnique({ where: { id: Id, userId }, include: { profissional: true, condicaoSaude: true, consulta: true } });
    if (!medicamento) return NextResponse.json({ error: "Medicamento não encontrado ou não autorizado" }, { status: 404 });

    const decryptedMedicamento = {
      ...medicamento,
      nome: safeDecrypt(medicamento.nome),
      principioAtivo: safeDecrypt(medicamento.principioAtivo || ""),
      posologia: safeDecrypt(medicamento.posologia || ""),
      forma: safeDecrypt(medicamento.forma || ""),
      condicaoSaude: medicamento.condicaoSaude ? { ...medicamento.condicaoSaude, nome: safeDecrypt(medicamento.condicaoSaude.nome) } : null,
      profissional: medicamento.profissional ? { ...medicamento.profissional, nome: safeDecrypt(medicamento.profissional.nome) } : null,
      consulta: medicamento.consulta ? { ...medicamento.consulta, motivo: safeDecrypt(medicamento.consulta.motivo) } : null,
    };

    return NextResponse.json(decryptedMedicamento);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    if (errorMessage !== "Não autorizado") {
      await logAction({ userId, action: "get_medicamento_error", level: "error", message: `Erro ao buscar medicamento '${Id}'`, details: errorMessage, component: "medicamentos-api" });
    }
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}

export async function PATCH(request: Request) {
  let userId: string | undefined;
  const Id = getIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!Id) return NextResponse.json({ error: "ID do Medicamento não encontrado" }, { status: 400 });

    const existingMedicamento = await db.medicamento.findUnique({ where: { id: Id, userId } });
    if (!existingMedicamento) return NextResponse.json({ error: "Medicamento não encontrado ou não autorizado" }, { status: 404 });

    const json = await request.json();
    const body = medicamentoUpdateSchema.parse(json);
    const { nome, principioAtivo, posologia, forma, ...restOfBody } = body;

    const dataToUpdate: Prisma.MedicamentoUpdateInput = {
        ...restOfBody,
        ...(nome && { nome: encryptString(nome) }),
        ...(principioAtivo && { principioAtivo: encryptString(principioAtivo) }),
        ...(posologia && { posologia: encryptString(posologia) }),
        ...(forma && { forma: encryptString(forma) }),
    };

    const updatedMedicamento = await db.medicamento.update({ where: { id: Id }, data: dataToUpdate });

    await logAction({ userId, action: "update_medicamento", level: "info", message: `Medicamento '${Id}' atualizado com sucesso`, component: "medicamentos-api" });

    return NextResponse.json(updatedMedicamento);

  } catch (error: unknown) {
    const errorMessage = error instanceof z.ZodError ? JSON.stringify(error.issues) : error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "update_medicamento_error", level: "error", message: `Erro ao atualizar medicamento '${Id}'`, details: errorMessage, component: "medicamentos-api" });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados de entrada inválidos", details: error.issues }, { status: 422 });
    }
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}

export async function DELETE(request: Request) {
  let userId: string | undefined;
  const Id = getIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!Id) return NextResponse.json({ error: "ID do Medicamento não encontrado" }, { status: 400 });

    const existingMedicamento = await db.medicamento.findUnique({ where: { id: Id, userId } });
    if (!existingMedicamento) return NextResponse.json({ error: "Medicamento não encontrado ou não autorizado" }, { status: 404 });

    await db.medicamento.delete({ where: { id: Id, userId } });

    await logAction({ userId, action: "delete_medicamento", level: "info", message: `Medicamento '${Id}' deletado com sucesso`, component: "medicamentos-api" });

    return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "delete_medicamento_error", level: "error", message: `Erro ao deletar medicamento '${Id}'`, details: errorMessage, component: "medicamentos-api" });
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}
