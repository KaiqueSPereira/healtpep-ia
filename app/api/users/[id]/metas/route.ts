
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { getPermissionsForUser } from '@/app/_lib/auth/permission-checker';
import { logAction } from '@/app/_lib/logger';

const getParamIdFromRequest = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // Expected URL format: /api/users/[id]/metas
    return pathSegments[3];
};

export async function GET(req: NextRequest) {
    let userId: string | undefined;
    const paramId = getParamIdFromRequest(req);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new Error("Não autorizado");
        }
        userId = session.user.id;

        if (userId !== paramId) {
            throw new Error("Não autorizado");
        }

        const metas = await prisma.meta.findMany({
            where: { userId: paramId },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(metas);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        if (errorMessage !== "Não autorizado") {
            await logAction({
                userId,
                action: 'get_metas_error',
                level: 'error',
                message: 'Erro ao buscar metas',
                details: { error: errorMessage, params: { id: paramId } },
                component: 'metas-api'
            });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar metas: ${errorMessage}` }, { status });
    }
}

export async function POST(req: NextRequest) {
    let userId: string | undefined;
    const paramId = getParamIdFromRequest(req);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new Error("Não autorizado");
        }
        userId = session.user.id;

        if (userId !== paramId) {
            throw new Error("Não autorizado");
        }

        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('metas')) {
            return NextResponse.json({ error: "Você atingiu o limite de metas para o seu plano." }, { status: 403 });
        }

        const body = await req.json();
        const metasParaCriar = Array.isArray(body) ? body : [body];

        if (metasParaCriar.length === 0) {
            return NextResponse.json({ error: 'Nenhuma meta fornecida.' }, { status: 400 });
        }

        const dadosParaCriar = metasParaCriar.map(meta => {
            const { tipo, valorAlvo, valorInicial, dataInicio, dataFim, status } = meta;
            if (!tipo || !valorAlvo || !dataInicio) {
                throw new Error('Campos obrigatórios (tipo, valorAlvo, dataInicio) não foram preenchidos para uma ou mais metas.');
            }
            return {
                userId: paramId,
                tipo,
                valorAlvo,
                valorInicial,
                dataInicio: new Date(dataInicio),
                dataFim: dataFim ? new Date(dataFim) : null,
                status: status || 'ATIVA',
            };
        });

        const resultado = await prisma.meta.createMany({
            data: dadosParaCriar,
            skipDuplicates: true,
        });

        await logAction({
            userId,
            action: 'create_metas',
            level: 'info',
            message: `${resultado.count} meta(s) criada(s) com sucesso.`,
            component: 'metas-api'
        });

        return NextResponse.json({ message: `${resultado.count} meta(s) criada(s) com sucesso.` }, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
        
        if (errorMessage !== "Não autorizado") {
            await logAction({
                userId,
                action: 'create_metas_error',
                level: 'error',
                message: 'Erro ao criar meta(s)',
                details: { error: errorMessage, params: { id: paramId } },
                component: 'metas-api'
            });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Falha ao criar meta(s): ${errorMessage}` }, { status });
    }
}
