import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { decryptString, encryptString } from "@/app/_lib/crypto";
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

// Função auxiliar para descriptografia segura
const safeDecrypt = (value: string | null | undefined, fieldName: string, id: string) => {
  if (typeof value !== 'string' || !value) {
    return value;
  }
  try {
    return decryptString(value);
  } catch (e) {
    logAction({
        action: "decryption_fallback",
        level: "warn",
        message: `Falha ao descriptografar campo '${fieldName}' para o ID: ${id}. Usando valor original.`,
        component: "profissionais-api-get"
    });
    return value; // Retorna o valor original em caso de falha
  }
};


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

    const profissional = await db.profissional.findUnique({ where: { id: profissionalId, userId }, include: { unidades: true, condicoesSaude: true, consultas: { include: { usuario: true, unidade: true } }, exames: { include: { usuario: true, unidades: true }, orderBy: { dataExame: 'desc' }, take: 5 } } });
    if (!profissional) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Lógica de descriptografia segura aplicada
    const decryptedData = {
      ...profissional,
      nome: safeDecrypt(profissional.nome, 'nome', profissional.id),
      especialidade: safeDecrypt(profissional.especialidade, 'especialidade', profissional.id),
      // CORREÇÃO: Descriptografar o NumClasse
      NumClasse: safeDecrypt(profissional.NumClasse, 'NumClasse', profissional.id),
      exames: profissional.exames.map(exame => ({
        ...exame,
        tipo: safeDecrypt(exame.tipo, 'exame.tipo', exame.id),
        usuario: exame.usuario ? {
          ...exame.usuario,
          name: safeDecrypt(exame.usuario.name, 'exame.usuario.name', exame.usuario.id),
        } : exame.usuario,
      })),
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

    // Adicionado para garantir que o usuário só edite seus próprios profissionais
    const originalProfissional = await db.profissional.findFirst({ where: { id: profissionalId, userId } });
    if (!originalProfissional) {
        return NextResponse.json({ error: "Profissional não encontrado ou não pertence a este usuário." }, { status: 404 });
    }

    const body = await request.json();
    const parsedData = profissionalPatchSchema.parse(body);
    const updateData: Prisma.ProfissionalUpdateInput = {};

    if (parsedData.nome) updateData.nome = encryptString(parsedData.nome);
    if (parsedData.especialidade) updateData.especialidade = encryptString(parsedData.especialidade);
    // CORREÇÃO: Criptografar o NumClasse ao atualizar
    if (parsedData.NumClasse) updateData.NumClasse = encryptString(parsedData.NumClasse);

    const profissionalAtualizado = await db.profissional.update({ where: { id: profissionalId }, data: updateData, include: { unidades: true } });

    await logAction({ userId, action: "update_profissional", level: "info", message: `Profissional '${profissionalId}' atualizado com sucesso`, component: "profissionais-api" });

    // Retorna os dados atualizados e descriptografados para consistência com o GET
    const decryptedData = {
        ...profissionalAtualizado,
        nome: safeDecrypt(profissionalAtualizado.nome, 'nome', profissionalAtualizado.id),
        especialidade: safeDecrypt(profissionalAtualizado.especialidade, 'especialidade', profissionalAtualizado.id),
        NumClasse: safeDecrypt(profissionalAtualizado.NumClasse, 'NumClasse', profissionalAtualizado.id),
    };

    return NextResponse.json(decryptedData);
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

    // Adicionado para garantir que o usuário só delete seus próprios profissionais
    const profissionalToDelete = await db.profissional.findFirst({ where: { id: profissionalId, userId } });
    if (!profissionalToDelete) {
        return NextResponse.json({ error: "Profissional não encontrado ou não pertence a este usuário." }, { status: 404 });
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
