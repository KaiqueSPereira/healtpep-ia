import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

// CORREÇÃO: Adicionados `principioAtivo` e `linkBula` ao schema de validação.
const medicamentoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').optional(),
  principioAtivo: z.string().optional().nullable(), // Adicionado
  linkBula: z.string().optional().nullable(),       // Adicionado
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.enum(['USO_CONTINUO', 'TRATAMENTO_CLINICO', 'ESPORADICO']).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional().nullable(),
  status: z.enum(['ATIVO', 'CONCLUIDO', 'SUSPENSO']).optional(),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  frequenciaTipo: z.enum(['HORA', 'DIA', 'SEMANA', 'MES']).optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  tratamentoId: z.string().optional().nullable(),
});

async function checkMedicamentoOwner(medicamentoId: string, userId: string) {
    const medicamento = await db.medicamento.findUnique({
        where: { id: medicamentoId },
    });
    if (!medicamento || medicamento.userId !== userId) {
        return null;
    }
    return medicamento;
}

export async function GET(req: Request, { params }: { params: { medicamentoId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        const medicamento = await checkMedicamentoOwner(params.medicamentoId, session.user.id);
        if (!medicamento) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        return NextResponse.json(medicamento);

    } catch (error) {
        console.error('[MEDICAMENTO_GET_ID]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { medicamentoId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        if (!await checkMedicamentoOwner(params.medicamentoId, session.user.id)) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        const json = await req.json();
        const body = medicamentoUpdateSchema.parse(json);

        // CORREÇÃO: O `dataForDb` agora irá incluir os novos campos se eles estiverem presentes no body.
        const dataForDb = Object.fromEntries(
            Object.entries(body).map(([key, value]) => [key, value === '' ? null : value])
        );

        const updatedMedicamento = await db.medicamento.update({
            where: { id: params.medicamentoId },
            data: dataForDb,
        });

        return NextResponse.json(updatedMedicamento);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        console.error('[MEDICAMENTO_PATCH]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { medicamentoId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        if (!await checkMedicamentoOwner(params.medicamentoId, session.user.id)) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        await db.medicamento.delete({
            where: { id: params.medicamentoId },
        });

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error('[MEDICAMENTO_DELETE]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}
