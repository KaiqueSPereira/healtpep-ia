
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';
import { FrequenciaTipo } from '@prisma/client';

const abastecimentoCreateSchema = z.object({
  medicamentoId: z.string().min(1, 'ID do medicamento é obrigatório.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  dataAbastecimento: z.coerce.date(),
  unidadeDeSaudeId: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const medicamentoId = searchParams.get('medicamentoId');

    if (!medicamentoId) {
        return new NextResponse('ID do medicamento é obrigatório', { status: 400 });
    }

    const abastecimentosFromDb = await db.abastecimentoMedicamento.findMany({
      where: { medicamentoId: medicamentoId, medicamento: { userId: session.user.id } },
      include: { unidadeDeSaude: true },
      orderBy: { data: 'desc' },
    });

    const abastecimentos = abastecimentosFromDb.map(ab => ({
      ...ab,
      quantidade: parseInt(ab.quantidade, 10),
      dataAbastecimento: ab.data,
      observacoes: ab.observacoes ? safeDecrypt(ab.observacoes) : null,
      unidadeDeSaude: ab.unidadeDeSaude ? { ...ab.unidadeDeSaude, nome: safeDecrypt(ab.unidadeDeSaude.nome) } : null,
    }));

    return NextResponse.json(abastecimentos);

  } catch (error) {
    console.error('[ABASTECIMENTOS_GET]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const json = await request.json();
    const body = abastecimentoCreateSchema.parse(json);
    const { medicamentoId, quantidade, dataAbastecimento, unidadeDeSaudeId, observacoes } = body;

    const medicamento = await db.medicamento.findFirst({
        where: { id: medicamentoId, userId: session.user.id }
    });

    if (!medicamento) {
        return new NextResponse('Medicamento não encontrado.', { status: 404 });
    }

    // --- LÓGICA DE CÁLCULO DE CONSUMO RETROATIVO ---
    let consumoEstimado = 0;
    const hoje = new Date();
    const dataDoAbastecimento = new Date(dataAbastecimento);

    if (dataDoAbastecimento < hoje && medicamento.frequenciaNumero && medicamento.frequenciaTipo) {
        const diffEmMs = hoje.getTime() - dataDoAbastecimento.getTime();
        let diffEmUnidadesDeTempo = 0;

        switch (medicamento.frequenciaTipo) {
            case FrequenciaTipo.Hora:
                diffEmUnidadesDeTempo = diffEmMs / (1000 * 60 * 60);
                break;
            case FrequenciaTipo.Dia:
                diffEmUnidadesDeTempo = diffEmMs / (1000 * 60 * 60 * 24);
                break;
            case FrequenciaTipo.Semana:
                diffEmUnidadesDeTempo = diffEmMs / (1000 * 60 * 60 * 24 * 7);
                break;
            case FrequenciaTipo.Mes:
                diffEmUnidadesDeTempo = diffEmMs / (1000 * 60 * 60 * 24 * 30.44); // Média de dias no mês
                break;
        }

        consumoEstimado = Math.floor(diffEmUnidadesDeTempo) * medicamento.frequenciaNumero;
    }

    consumoEstimado = Math.max(0, consumoEstimado);
    const quantidadeLiquida = Math.max(0, quantidade - consumoEstimado);
    // --- FIM DA LÓGICA ---

    const encryptedObservacoes = observacoes ? encryptString(observacoes) : null;

    const [, updatedMedicamento] = await db.$transaction([
      db.abastecimentoMedicamento.create({
        data: {
          medicamentoId,
          quantidade: String(quantidade), // Salva a quantidade total comprada no histórico
          data: dataDoAbastecimento.toISOString(),
          unidadeDeSaudeId,
          observacoes: encryptedObservacoes,
        },
      }),
      db.medicamento.update({
        where: { id: medicamentoId },
        data: {
          estoque: { increment: quantidadeLiquida }, // Incrementa o estoque apenas com a quantidade líquida
          ultimaAtualizacaoEstoque: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ updatedMedicamento }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error('[ABASTECIMENTOS_POST]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
