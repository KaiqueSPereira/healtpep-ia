
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { safeDecrypt, encryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { logAction } from "@/app/_lib/logger";

const getProfissionalIdFromUrl = (url: string) => {
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

const profissionalPatchSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório.").optional(),
  especialidade: z.string().min(1, "A especialidade é obrigatória.").optional(),
  NumClasse: z.string().min(1, "O número de classe é obrigatório.").optional(),
}).strict().partial();

export async function GET(request: Request) {
  let userId: string | undefined;
  const profissionalId = getProfissionalIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!profissionalId) {
      return NextResponse.json({ error: "ID do Profissional não encontrado" }, { status: 400 });
    }

    const profissional = await db.profissional.findUnique({ where: { id: profissionalId }, include: { unidades: true, condicoesSaude: true, consultas: { include: { usuario: true, unidade: true } }, exames: { include: { usuario: true, unidades: true }, orderBy: { dataExame: 'desc' }, take: 5 } } });
    if (!profissional) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    const decryptedData = {
      ...profissional,
      nome: safeDecrypt(profissional.nome),
      especialidade: profissional.especialidade ? safeDecrypt(profissional.especialidade) : profissional.especialidade,
      exames: profissional.exames.map(exame => ({ ...exame, tipo: exame.tipo ? safeDecrypt(exame.tipo) : exame.tipo, usuario: (exame.usuario && exame.usuario.name) ? { ...exame.usuario, name: safeDecrypt(exame.usuario.name) } : exame.usuario }))
    };

    return NextResponse.json(decryptedData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    if (errorMessage !== "Não autorizado") {
        await logAction({ userId, action: "get_profissional_error", level: "error", message: `Erro ao buscar profissional '${profissionalId}'`, details: errorMessage, component: "profissionais-api" });
    }
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}

export async function PATCH(request: Request) {
  let userId: string | undefined;
  const profissionalId = getProfissionalIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!profissionalId) {
      return NextResponse.json({ error: "ID do Profissional não encontrado" }, { status: 400 });
    }

    const body = await request.json();
    const parsedData = profissionalPatchSchema.parse(body);
    const updateData: Prisma.ProfissionalUpdateInput = {};

    if (parsedData.nome) updateData.nome = encryptString(parsedData.nome);
    if (parsedData.especialidade) updateData.especialidade = encryptString(parsedData.especialidade);
    if (parsedData.NumClasse) updateData.NumClasse = parsedData.NumClasse;

    const profissionalAtualizado = await db.profissional.update({ where: { id: profissionalId }, data: updateData, include: { unidades: true } });

    await logAction({ userId, action: "update_profissional", level: "info", message: `Profissional '${profissionalId}' atualizado com sucesso`, component: "profissionais-api" });

    return NextResponse.json(profissionalAtualizado);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "update_profissional_error", level: "error", message: `Erro ao atualizar profissional '${profissionalId}'`, details: errorMessage, component: "profissionais-api" });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos para atualização", details: error.errors }, { status: 400 });
    } else if (errorMessage.includes("Record to update not found")) {
      return NextResponse.json({ error: "Profissional não encontrado para atualização" }, { status: 404 });
    } else if (errorMessage === "Não autorizado") {
        return new NextResponse("Não autorizado", { status: 401 });
    }
    return NextResponse.json({ error: "Falha ao atualizar o cadastro do profissional" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let userId: string | undefined;
  const profissionalId = getProfissionalIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!profissionalId) {
      return NextResponse.json({ error: "ID do Profissional não encontrado" }, { status: 400 });
    }

    await db.profissional.delete({ where: { id: profissionalId } });

    await logAction({ userId, action: "delete_profissional", level: "info", message: `Profissional '${profissionalId}' deletado com sucesso`, component: "profissionais-api" });

    return NextResponse.json({ message: "Profissional deletado com sucesso" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ userId, action: "delete_profissional_error", level: "error", message: `Erro ao deletar profissional '${profissionalId}'`, details: errorMessage, component: "profissionais-api" });

    if (errorMessage.includes("Record to delete not found")) {
      return NextResponse.json({ error: "Profissional não encontrado para exclusão" }, { status: 404 });
    } else if (errorMessage.includes("Foreign key constraint failed")) {
      return NextResponse.json({ error: "Não é possível excluir o profissional devido a dados vinculados. Remova os dados vinculados primeiro." }, { status: 409 });
    } else if (errorMessage === "Não autorizado") {
        return new NextResponse("Não autorizado", { status: 401 });
    }

    return NextResponse.json({ error: "Erro interno ao deletar profissional" }, { status: 500 });
  }
}
