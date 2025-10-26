
import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { encryptString, decryptString } from '@/app/_lib/crypto';

const condicaoCreateSchema = z.object({
  userId: z.string().min(1, 'O ID do usuário é obrigatório.'),
  nome: z.string().min(2, "O nome da condição é obrigatório."),
  dataInicio: z.coerce.date({ required_error: "A data de início é obrigatória." }),
  cidCodigo: z.string().optional(),
  cidDescricao: z.string().optional(),
  observacoes: z.string().optional(),
  profissionalId: z.string().optional(), // Validação para o ID do profissional
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const condicoes = await prisma.condicaoSaude.findMany({
      where: { userId: userId },
      include: { profissional: true }, // Inclui o profissional vinculado
      orderBy: { dataInicio: 'desc' },
    });

    const decryptedCondicoes = condicoes.map(cond => ({
      ...cond,
      nome: decryptString(cond.nome),
      observacoes: cond.observacoes ? decryptString(cond.observacoes) : null,
      // O profissional não precisa de descriptografia
    }));

    return NextResponse.json(decryptedCondicoes, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar condições de saúde:", error);
    return NextResponse.json({ error: 'Falha ao buscar condições de saúde' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = condicaoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId, nome, dataInicio, cidCodigo, cidDescricao, observacoes, profissionalId } = validation.data;

    const newCondicao = await prisma.condicaoSaude.create({
      data: {
        userId,
        nome: encryptString(nome),
        dataInicio,
        cidCodigo,
        cidDescricao,
        observacoes: observacoes ? encryptString(observacoes) : undefined,
        profissionalId: profissionalId || null, // Salva o ID do profissional
      },
    });

    const decryptedResponse = {
        ...newCondicao,
        nome: decryptString(newCondicao.nome),
        observacoes: newCondicao.observacoes ? decryptString(newCondicao.observacoes) : null,
    };

    return NextResponse.json(decryptedResponse, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar condição de saúde:", error);
    return NextResponse.json({ error: 'Falha ao criar condição de saúde' }, { status: 500 });
  }
}
