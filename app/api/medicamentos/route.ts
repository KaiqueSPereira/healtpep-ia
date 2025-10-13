
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

const medicamentoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.enum(['USO_CONTINUO', 'TRATAMENTO_CLINICO', 'ESPORADICO']),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional().nullable(),
  status: z.enum(['ATIVO', 'CONCLUIDO', 'SUSPENSO']),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  frequenciaTipo: z.enum(['HORA', 'DIA', 'SEMANA', 'MES']).optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  tratamentoId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const medicamentos = await db.medicamento.findMany({
      where: { userId: session.user.id },
      include: {
        profissional: true,
        consulta: true,
        tratamento: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(medicamentos);
  } catch (error) {
    console.error('[MEDICAMENTOS_GET]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const json = await req.json();
    const body = medicamentoCreateSchema.parse(json);

    // Converte campos vazios ('') ou undefined para null, garantindo a integridade dos dados.
    const dataForDb = {
      ...body,
      posologia: body.posologia || null,
      forma: body.forma || null,
      frequenciaTipo: body.frequenciaTipo || null,
      profissionalId: body.profissionalId || null,
      consultaId: body.consultaId || null,
      tratamentoId: body.tratamentoId || null,
      dataFim: body.dataFim ?? null,
      estoque: body.estoque ?? null,
      quantidadeCaixa: body.quantidadeCaixa ?? null,
      quantidadeDose: body.quantidadeDose ?? null,
      frequenciaNumero: body.frequenciaNumero ?? null,
    };

    const medicamento = await db.medicamento.create({
      data: {
        userId: session.user.id,
        ...dataForDb,
      },
    });

    return NextResponse.json(medicamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error('[MEDICAMENTOS_POST]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
