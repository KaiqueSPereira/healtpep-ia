import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

const medicamentoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').optional(),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  TipoMedicamento: z.enum(['USO_CONTINUO', 'TRATAMENTO_CLINICO', 'ESPORADICO']).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.preprocess(
    (arg) => {
      // If the input is an empty string, convert it to null before validation
      if (typeof arg === 'string' && arg === '') return null;
      return arg;
    },
    z.coerce.date().optional().nullable()
  ),
  StatusMedicamento: z.enum(['ATIVO', 'CONCLUIDO', 'SUSPENSO']).optional(),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  FrequenciaTipo: z.enum(['HORA', 'DIA', 'SEMANA', 'MES']).optional().nullable(),
  condicaoSaudeId: z.string().optional().nullable(),
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

export async function GET(req: Request, { params }: { params: { Id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        const medicamento = await checkMedicamentoOwner(params.Id, session.user.id);
        if (!medicamento) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        return NextResponse.json(medicamento);

    } catch (error) {
        console.error('[MEDICAMENTO_GET_ID]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { Id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        if (!await checkMedicamentoOwner(params.Id, session.user.id)) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        const json = await req.json();
        const body = medicamentoUpdateSchema.parse(json);

        const updatedMedicamento = await db.medicamento.update({
            where: { id: params.Id },
            data: body,
        });

        return NextResponse.json(updatedMedicamento);

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[MEDICAMENTO_PUT_VALIDATION_ERROR]', error.issues);
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        console.error('[MEDICAMENTO_PUT]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { Id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Não autorizado', { status: 401 });
        }

        if (!await checkMedicamentoOwner(params.Id, session.user.id)) {
            return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
        }

        await db.medicamento.delete({
            where: { id: params.Id },
        });

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error('[MEDICAMENTO_DELETE]', error);
        return new NextResponse('Erro Interno do Servidor', { status: 500 });
    }
}
