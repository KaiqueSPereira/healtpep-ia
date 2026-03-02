'use server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getToken } from 'next-auth/jwt';
import { logAction } from '@/app/_lib/logger'; 
import { z } from 'zod';
import { encryptString } from '@/app/_lib/crypto';

const componentName = 'API:/api/users/[id]/medidas/[recordId]';

// Interface para o contexto que Next.js passa para a rota.
interface RouteContext {
    params: {
        id: string;
        recordId: string;
    }
}

const updateSchema = z.object({
    data: z.string().datetime({ message: "Formato de data inválido." }).optional(),
    peso: z.string().optional(),
    imc: z.string().optional(),
    pescoco: z.string().optional(),
    torax: z.string().optional(),
    cintura: z.string().optional(),
    quadril: z.string().optional(),
    bracoE: z.string().optional(),
    bracoD: z.string().optional(),
    pernaE: z.string().optional(),
    pernaD: z.string().optional(),
    pantE: z.string().optional(),
    pantD: z.string().optional(),
});

// Rota para ATUALIZAR (PUT) um registro de medida
export async function PUT(req: NextRequest, { params }: { params: Promise<RouteContext['params']> }) {
    // **CORREÇÃO DEFINITIVA: Aguarda a Promise dos parâmetros**
    const { id: userId, recordId } = await params;
    const token = await getToken({ req });

    if (!token || token.sub !== userId) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = updateSchema.parse(body);

        const encryptedData: { [key: string]: any } = {};
        for (const key in validatedData) {
            if (Object.prototype.hasOwnProperty.call(validatedData, key)) {
                const value = (validatedData as any)[key];
                if (key === 'data') {
                    encryptedData[key] = value;
                } else if (typeof value === 'string' && value) {
                    encryptedData[key] = encryptString(value);
                } else {
                    encryptedData[key] = value;
                }
            }
        }

        const originalRecord = await prisma.acompanhamentoCorporal.findUnique({ where: { id: recordId } });

        if (!originalRecord || originalRecord.userId !== userId) {
            return NextResponse.json({ error: 'Registro não encontrado ou não autorizado.' }, { status: 404 });
        }

        const updatedRecord = await prisma.acompanhamentoCorporal.update({
            where: { id: recordId },
            data: encryptedData,
        });

        await logAction({
            level: 'info',
            component: componentName,
            action: 'UPDATE_MEASUREMENT',
            userId: userId,
            message: `Registro de medida [${recordId}] atualizado com sucesso.`,
            details: { recordId, updatedData: encryptedData },
        });

        return NextResponse.json(updatedRecord);

    } catch (error) {
        await logAction({
            level: 'error',
            component: componentName,
            action: 'UPDATE_MEASUREMENT_FAILED',
            userId: userId,
            message: `Falha ao atualizar o registro de medida [${recordId}].`,
            details: error instanceof Error ? error.stack : String(error),
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos.', details: error.errors }, { status: 400 });
        }

        return NextResponse.json({ error: 'Erro interno ao atualizar o registro.' }, { status: 500 });
    }
}

// Rota para DELETAR um registro de medida
export async function DELETE(req: NextRequest, { params }: { params: Promise<RouteContext['params']> }) {
    // **CORREÇÃO DEFINITIVA: Aguarda a Promise dos parâmetros**
    const { id: userId, recordId } = await params;
    const token = await getToken({ req });

    if (!token || token.sub !== userId) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const acompanhamento = await prisma.acompanhamentoCorporal.findUnique({ where: { id: recordId } });

        if (!acompanhamento || acompanhamento.userId !== userId) {
            return NextResponse.json({ error: 'Registro não encontrado ou não autorizado.' }, { status: 404 });
        }

        await prisma.acompanhamentoCorporal.delete({ where: { id: recordId } });

        const targetDate = acompanhamento.data;
        const startDate = new Date(targetDate); startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(targetDate); endDate.setUTCHours(23, 59, 59, 999);

        await prisma.bioimpedancia.deleteMany({ where: { userId, data: { gte: startDate, lte: endDate } } });

        await logAction({
            level: 'info',
            component: componentName,
            action: 'DELETE_MEASUREMENT',
            userId: userId,
            message: `Registro de medida [${recordId}] excluído com sucesso.`,
            details: { recordId, deletedData: acompanhamento },
        });

        return NextResponse.json({ message: 'Registro excluído com sucesso' });

    } catch (error) {
        await logAction({
            level: 'error',
            component: componentName,
            action: 'DELETE_MEASUREMENT_FAILED',
            userId: userId,
            message: `Falha ao excluir o registro de medida [${recordId}].`,
            details: error instanceof Error ? error.stack : String(error),
        });

        return NextResponse.json({ error: 'Erro interno ao excluir o registro.' }, { status: 500 });
    }
}
