
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { getPermissionsForUser } from '@/app/_lib/auth/permission-checker';
import { logAction } from '@/app/_lib/logger';

const prisma = new PrismaClient();

const getParamIdFromRequest = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // Expected URL format: /api/users/[id]/pressao
    return pathSegments[3];
};

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const paramId = getParamIdFromRequest(req);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dadosSaude = await prisma.dadosSaude.findUnique({
            where: { userId: paramId },
            include: {
                pressoesArteriais: {
                    orderBy: {
                        data: 'desc',
                    },
                },
            },
        });

        if (!dadosSaude) {
            return NextResponse.json([], { status: 200 });
        }

        // Garante a ordem dos campos no objeto de resposta
        const pressoesOrdenadas = dadosSaude.pressoesArteriais.map(p => ({
            id: p.id,
            sistolica: p.sistolica, // Primeiro
            diastolica: p.diastolica,
            pulso: p.pulso,
            observacoes: p.observacoes,
            data: p.data,
            dadosSaudeId: p.dadosSaudeId,
        }));

        return NextResponse.json(pressoesOrdenadas, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching pressao arterial records', error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: session.user.id,
            action: 'get_pressao_error',
            level: 'error',
            message: 'Error fetching pressao arterial records',
            details: { error: errorMessage, params: { id: paramId } },
            component: 'pressao-api'
        });
        return NextResponse.json({ error: 'Error fetching pressao arterial records' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const paramId = getParamIdFromRequest(req);
    if (!session || session.user.id !== paramId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const permissions = await getPermissionsForUser(session.user.id);
        if (await permissions.hasReachedLimit('pressao')) {
            return NextResponse.json({ error: "Você atingiu o limite de registros de pressão arterial para o seu plano." }, { status: 403 });
        }

        const { sistolica, diastolica, pulso, observacoes, data } = await req.json();

        let dadosSaude = await prisma.dadosSaude.findUnique({
            where: { userId: paramId },
        });

        if (!dadosSaude) {
            dadosSaude = await prisma.dadosSaude.create({
                data: { userId: paramId },
            });
        }

        const newPressao = await prisma.pressaoArterial.create({
            data: {
                dadosSaudeId: dadosSaude.id,
                sistolica,
                diastolica,
                pulso,
                observacoes,
                data: new Date(data),
            },
        });

        await logAction({
            userId: session.user.id,
            action: 'create_pressao',
            level: 'info',
            message: `Registro de pressão arterial '${newPressao.id}' criado`,
            component: 'pressao-api'
        });

        // Garante a ordem dos campos no objeto de resposta
        const responsePressao = {
            id: newPressao.id,
            sistolica: newPressao.sistolica, // Primeiro
            diastolica: newPressao.diastolica,
            pulso: newPressao.pulso,
            observacoes: newPressao.observacoes,
            data: newPressao.data,
            dadosSaudeId: newPressao.dadosSaudeId,
        };

        return NextResponse.json(responsePressao, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating pressao arterial record', error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: session.user.id,
            action: 'create_pressao_error',
            level: 'error',
            message: 'Error creating pressao arterial record',
            details: { error: errorMessage, params: { id: paramId } },
            component: 'pressao-api'
        });
        return NextResponse.json({ error: 'Error creating pressao arterial record' }, { status: 500 });
    }
}
