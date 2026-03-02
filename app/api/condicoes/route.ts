
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { decryptString, encryptString, safeDecrypt } from '@/app/_lib/crypto';
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker";
import { logAction } from '@/app/_lib/logger';
import { Prisma } from '@prisma/client';

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

export async function GET() {
    let userId: string | undefined;
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        const condicoes = await db.condicaoSaude.findMany({ where: { userId } });
        const decryptedCondicoes = condicoes.map(c => ({
            ...c,
            nome: decryptString(c.nome),
            objetivo: c.objetivo ? safeDecrypt(c.objetivo) : null,
            observacoes: c.observacoes ? safeDecrypt(c.observacoes) : null,
        }));

        return NextResponse.json(decryptedCondicoes);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        if (errorMessage !== "Não autorizado") {
            await logAction({ userId, action: "get_condicoes_error", level: "error", message: "Erro ao buscar condições de saúde", details: errorMessage, component: "condicoes-api" });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar condições: ${errorMessage}` }, { status });
    }
}

export async function POST(request: Request) {
    let userId: string | undefined;
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('tratamentos')) {
            return NextResponse.json({ error: "Você atingiu o limite de tratamentos para o seu plano." }, { status: 403 });
        }

        const body = await request.json();
        const { nome, objetivo, observacoes, profissionalId, dataInicio } = body;

        if (!nome || !dataInicio) {
            return NextResponse.json({ error: 'Nome e Data de Início são obrigatórios' }, { status: 400 });
        }

        const novaCondicao = await db.condicaoSaude.create({
            data: {
                userId,
                nome: encryptString(nome),
                objetivo: objetivo ? encryptString(objetivo) : null,
                observacoes: observacoes ? encryptString(observacoes) : null,
                profissionalId,
                dataInicio: new Date(dataInicio),
            },
        });

        await logAction({ userId, action: "create_condicao", level: "info", message: `Condição de saúde '${novaCondicao.id}' criada`, component: "condicoes-api" });
        return NextResponse.json(novaCondicao, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "create_condicao_error", level: "error", message: "Erro ao criar condição de saúde", details: errorMessage, component: "condicoes-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Não foi possível criar a condição: ${errorMessage}` }, { status });
    }
}

export async function DELETE(request: NextRequest) {
    let userId: string | undefined;
    const condicaoId = request.nextUrl.searchParams.get('id');
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!condicaoId) {
            return NextResponse.json({ error: 'O ID da condição é obrigatório.' }, { status: 400 });
        }

        await db.condicaoSaude.delete({ where: { id: condicaoId, userId } });

        await logAction({ userId, action: "delete_condicao", level: "info", message: `Condição de saúde '${condicaoId}' deletada`, component: "condicoes-api" });
        return new NextResponse(null, { status: 204 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "delete_condicao_error", level: "error", message: `Erro ao deletar condição '${condicaoId}'`, details: errorMessage, component: "condicoes-api" });
        let status = 500;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') status = 404;
        else if (errorMessage === "Não autorizado") status = 401;
        return NextResponse.json({ error: `Não foi possível deletar a condição: ${errorMessage}` }, { status });
    }
}

export async function PATCH(request: NextRequest) {
    let userId: string | undefined;
    const condicaoId = request.nextUrl.searchParams.get('id');
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!condicaoId) {
            return NextResponse.json({ error: 'O ID da condição é obrigatório.' }, { status: 400 });
        }

        const body = await request.json();
        const { nome, objetivo, observacoes, profissionalId } = body;
        const dataToUpdate: Prisma.CondicaoSaudeUpdateInput = {};

        if (nome) dataToUpdate.nome = encryptString(nome);
        if (objetivo) dataToUpdate.objetivo = encryptString(objetivo);
        if (observacoes) dataToUpdate.observacoes = encryptString(observacoes);
        if (profissionalId !== undefined) {
            dataToUpdate.profissional = profissionalId ? { connect: { id: profissionalId } } : { disconnect: true };
        }

        const updatedCondicao = await db.condicaoSaude.update({
            where: { id: condicaoId, userId },
            data: dataToUpdate,
        });

        await logAction({ userId, action: "update_condicao", level: "info", message: `Condição de saúde '${condicaoId}' atualizada`, component: "condicoes-api" });
        const decryptedCondicao = {
            ...updatedCondicao,
            nome: decryptString(updatedCondicao.nome),
            objetivo: updatedCondicao.objetivo ? safeDecrypt(updatedCondicao.objetivo) : null,
            observacoes: updatedCondicao.observacoes ? safeDecrypt(updatedCondicao.observacoes) : null
        };
        return NextResponse.json(decryptedCondicao);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "update_condicao_error", level: "error", message: `Erro ao atualizar condição '${condicaoId}'`, details: errorMessage, component: "condicoes-api" });
        let status = 500;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') status = 404;
        else if (errorMessage === "Não autorizado") status = 401;
        return NextResponse.json({ error: `Não foi possível atualizar a condição: ${errorMessage}` }, { status });
    }
}
