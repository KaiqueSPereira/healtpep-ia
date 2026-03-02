
import { db } from "@/app/_lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { logAction } from "@/app/_lib/logger";
import { z } from "zod";

async function getSessionInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Não autorizado");
  }
  return { session, userId: session.user.id };
}

const getIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

export async function GET(request: NextRequest) {
  let userId: string | undefined;
  const id = getIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!id) {
      return NextResponse.json({ error: "O ID da unidade é obrigatório" }, { status: 400 });
    }

    const unidade = await db.unidadeDeSaude.findUnique({ 
        where: { id, userId }, 
        include: { endereco: true } 
    });

    if (!unidade) {
      return NextResponse.json({ error: "Unidade de saúde não encontrada" }, { status: 404 });
    }
    
    return NextResponse.json(unidade);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    if (errorMessage !== "Não autorizado") {
        await logAction({
            userId,
            action: "get_unidade_error",
            level: "error",
            message: `Erro ao acessar unidade de saúde '${id}'`,
            details: errorMessage,
            component: "unidadesaude-api",
        });
    }
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  let userId: string | undefined;
  const unidadeId = getIdFromUrl(request.nextUrl.pathname);

  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!unidadeId) {
      return NextResponse.json({ error: "O ID da unidade é obrigatório" }, { status: 400 });
    }
    
    const body = await request.json();
    const { action, profissionalId, nome, tipo, endereco, telefone } = body;

    const unidade = await db.unidadeDeSaude.findFirst({
        where: { id: unidadeId, userId: userId },
    });

    if (!unidade) {
        return NextResponse.json({ error: "Unidade de Saúde não encontrada ou não autorizada." }, { status: 404 });
    }

    if (action === "associate_profissional") {
        const schema = z.object({ profissionalId: z.string().uuid() });
        const validation = schema.safeParse({ profissionalId });
        if (!validation.success) {
            return NextResponse.json({ error: "ID do profissional inválido" }, { status: 400 });
        }

        const profissional = await db.profissional.findFirst({
            where: { id: profissionalId, userId: userId },
        });

        if (!profissional) {
            return NextResponse.json({ error: "Profissional não encontrado ou não autorizado." }, { status: 404 });
        }

        await db.profissional.update({
            where: { id: profissionalId },
            data: { unidades: { connect: { id: unidadeId } } },
        });
        
        await logAction({ userId, action: "associate_profissional_unidade", level: "info", message: `Profissional '${profissionalId}' associado à unidade '${unidadeId}'`, component: "unidadesaude-api" });

        const updatedProfissional = await db.profissional.findUnique({
            where: { id: profissionalId },
            include: { unidades: true }
        });

        return NextResponse.json(updatedProfissional?.unidades || [], { status: 200 });

    } else if (action === "disassociate_profissional") {
        const schema = z.object({ profissionalId: z.string().uuid() });
        const validation = schema.safeParse({ profissionalId });
        if (!validation.success) {
            return NextResponse.json({ error: "ID do profissional inválido" }, { status: 400 });
        }
        
        const associationExists = await db.profissional.findFirst({
            where: {
                id: profissionalId,
                userId: userId,
                unidades: { some: { id: unidadeId } },
            },
        });

        if (!associationExists) {
            return NextResponse.json({ error: "Associação profissional-unidade não encontrada ou não autorizada." }, { status: 404 });
        }

        await db.profissional.update({
            where: { id: profissionalId },
            data: { unidades: { disconnect: { id: unidadeId } } },
        });
        
        await logAction({ userId, action: "disassociate_profissional_unidade", level: "info", message: `Profissional '${profissionalId}' desassociado da unidade '${unidadeId}'`, component: "unidadesaude-api" });

        const updatedProfissional = await db.profissional.findUnique({
            where: { id: profissionalId },
            include: { unidades: true }
        });

        return NextResponse.json(updatedProfissional?.unidades || [], { status: 200 });

    } else {
        const unidadeAtualizada = await db.unidadeDeSaude.update({
          where: { id: unidadeId, userId },
          data: { nome, tipo, telefone, endereco: endereco ? { upsert: { update: endereco, create: { ...endereco, userId } } } : undefined },
        });

        await logAction({
            userId,
            action: "update_unidade",
            level: "info",
            message: `Unidade de saúde '${unidadeId}' atualizada com sucesso`,
            component: "unidadesaude-api",
        });
        return NextResponse.json(unidadeAtualizada);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "patch_unidade_error",
        level: "error",
        message: `Erro ao processar PATCH para unidade de saúde '${unidadeId}'`,
        details: errorMessage,
        component: "unidadesaude-api",
    });
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Falha na operação: ${errorMessage}` }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  let userId: string | undefined;
  const id = getIdFromUrl(request.url);
  try {
    const { userId: uId } = await getSessionInfo();
    userId = uId;

    if (!id) {
      return NextResponse.json({ error: "O 'id' é obrigatório para deletar" }, { status: 400 });
    }

    await db.unidadeDeSaude.delete({ where: { id, userId } });

    await logAction({
        userId,
        action: "delete_unidade",
        level: "info",
        message: `Unidade de saúde '${id}' deletada com sucesso`,
        component: "unidadesaude-api",
    });

    return NextResponse.json({ message: "Unidade deletada com sucesso!" }, {status: 200});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "delete_unidade_error",
        level: "error",
        message: `Erro ao deletar unidade de saúde '${id}'`,
        details: errorMessage,
        component: "unidadesaude-api",
    });
    const status = errorMessage === "Não autorizado" ? 401 : 500;
    return NextResponse.json({ error: `Falha ao deletar a unidade: ${errorMessage}` }, { status });
  }
}
