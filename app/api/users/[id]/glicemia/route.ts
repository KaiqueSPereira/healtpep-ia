
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
    // Expected URL format: /api/users/[id]/glicemia
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
                glicemiasCapilares: {
                    orderBy: {
                        data: 'desc',
                    },
                },
            },
        });

        if (!dadosSaude) {
            return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(dadosSaude.glicemiasCapilares, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching glicemia records', error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: session.user.id,
            action: 'get_glicemia_error',
            level: 'error',
            message: 'Error fetching glicemia records',
            details: { error: errorMessage, params: { id: paramId } },
            component: 'glicemia-api'
        });
        return NextResponse.json({ error: 'Error fetching glicemia records' }, { status: 500 });
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
        if (await permissions.hasReachedLimit('glicemia')) {
            return NextResponse.json({ error: "Você atingiu o limite de registros de glicemia para o seu plano." }, { status: 403 });
        }

        const { valor, tipoMedicao, observacoes, data } = await req.json();

        let dadosSaude = await prisma.dadosSaude.findUnique({
            where: { userId: paramId },
        });

        if (!dadosSaude) {
            dadosSaude = await prisma.dadosSaude.create({
                data: { userId: paramId },
            });
        }

        const newGlicemia = await prisma.glicemiaCapilar.create({
            data: {
                dadosSaudeId: dadosSaude.id,
                valor,
                tipoMedicao,
                observacoes,
                data: new Date(data),
            },
        });

        await logAction({
            userId: session.user.id,
            action: 'create_glicemia',
            level: 'info',
            message: `Registro de glicemia '${newGlicemia.id}' criado`,
            component: 'glicemia-api'
        });

        return NextResponse.json(newGlicemia, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating glicemia record', error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: session.user.id,
            action: 'create_glicemia_error',
            level: 'error',
            message: 'Error creating glicemia record',
            details: { error: errorMessage, params: { id: paramId } },
            component: 'glicemia-api'
        });
        return NextResponse.json({ error: 'Error creating glicemia record' }, { status: 500 });
    }
}
