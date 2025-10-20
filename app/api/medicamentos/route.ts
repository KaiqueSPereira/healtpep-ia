
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

// UPDATED: Zod schema to use condicaoSaudeId
const medicamentoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().optional().nullable(),
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
  condicaoSaudeId: z.string().optional().nullable(), // UPDATED
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const medicamentos = await db.medicamento.findMany({
      where: { userId: session.user.id },
      // UPDATED: Select clause to include condicaoSaude
      select: {
        id: true,
        nome: true,
        principioAtivo: true,
        linkBula: true,
        posologia: true,
        forma: true,
        tipo: true,
        dataInicio: true,
        dataFim: true,
        status: true,
        estoque: true,
        quantidadeCaixa: true,
        quantidadeDose: true,
        frequenciaNumero: true,
        frequenciaTipo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        profissionalId: true,
        consultaId: true,
        condicaoSaudeId: true, // UPDATED
        profissional: true,
        consulta: true,
        condicaoSaude: true, // UPDATED
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

    // UPDATED: dataForDb to handle condicaoSaudeId
    const dataForDb = {
      ...body,
      principioAtivo: body.principioAtivo || null,
      linkBula: body.linkBula || null,
      posologia: body.posologia || null,
      forma: body.forma || null,
      frequenciaTipo: body.frequenciaTipo || null,
      profissionalId: body.profissionalId || null,
      consultaId: body.consultaId || null,
      condicaoSaudeId: body.condicaoSaudeId || null, // UPDATED
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
