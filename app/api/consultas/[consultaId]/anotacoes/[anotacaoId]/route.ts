
import { NextResponse } from "next/server";
import { decryptString, encryptString } from "@/app/_lib/crypto";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { logAction } from "@/app/_lib/logger";

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const getIdsFromUrl = (url: string) => {
  const parts = url.split('/');
  const anotacaoId = parts[parts.length - 1];
  const consultaId = parts[parts.length - 3];
  return { consultaId, anotacaoId };
};

export async function PATCH(request: Request) {
    let userId: string | undefined;
    const { consultaId, anotacaoId } = getIdsFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!anotacaoId || !consultaId) {
            return NextResponse.json({ error: "IDs de consulta e anotação são obrigatórios." }, { status: 400 });
        }

        const anotacaoExists = await db.anotacoes.findFirst({
            where: { id: anotacaoId, consultaId: consultaId, consulta: { userId: userId } }
        });

        if (!anotacaoExists) {
            return NextResponse.json({ error: "Anotação não encontrada ou não autorizada." }, { status: 404 });
        }

        const { anotacao: newContent } = await request.json();
        if (!newContent) {
            return NextResponse.json({ error: "O conteúdo da anotação é obrigatório." }, { status: 400 });
        }

        const updatedAnotacao = await db.anotacoes.update({
            where: { id: anotacaoId },
            data: { anotacao: encryptString(newContent) },
        });

        await logAction({ userId, action: "update_anotacao", level: "info", message: `Anotação '${anotacaoId}' atualizada`, component: "consultas-anotacao-id-api" });

        return NextResponse.json({ ...updatedAnotacao, anotacao: newContent });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "update_anotacao_error", level: "error", message: `Erro ao atualizar anotação '${anotacaoId}'`, details: errorMessage, component: "consultas-anotacao-id-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao atualizar anotação: ${errorMessage}` }, { status });
    }
}

export async function DELETE(request: Request) {
    let userId: string | undefined;
    const { consultaId, anotacaoId } = getIdsFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!anotacaoId || !consultaId) {
            return NextResponse.json({ error: "IDs de consulta e anotação são obrigatórios." }, { status: 400 });
        }

        const anotacaoExists = await db.anotacoes.findFirst({
            where: { id: anotacaoId, consultaId: consultaId, consulta: { userId: userId } }
        });

        if (!anotacaoExists) {
            return NextResponse.json({ error: "Anotação não encontrada ou não autorizada para exclusão." }, { status: 404 });
        }

        await db.anotacoes.delete({ where: { id: anotacaoId } });

        await logAction({ userId, action: "delete_anotacao", level: "info", message: `Anotação '${anotacaoId}' deletada`, component: "consultas-anotacao-id-api" });

        return new NextResponse(null, { status: 204 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "delete_anotacao_error", level: "error", message: `Erro ao deletar anotação '${anotacaoId}'`, details: errorMessage, component: "consultas-anotacao-id-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao deletar anotação: ${errorMessage}` }, { status });
    }
}
