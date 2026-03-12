import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/app/_lib/prisma';

const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

// Obter todas as metas de um usuário
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  // A verificação de token é importante para segurança
  // if (!token || token.sub !== userId) {
  //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  // }

  try {
    const metas = await prisma.meta.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(metas);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar metas.' }, { status: 500 });
  }
}

// Criar UMA OU VÁRIAS novas metas
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  // if (!token || token.sub !== userId) {
  //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  // }

  try {
    const body = await req.json();

    // Verifica se o corpo é um array. Se não for, envolve em um array para tratar ambos os casos.
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
            userId,
            tipo,
            valorAlvo,
            valorInicial,
            dataInicio: new Date(dataInicio),
            dataFim: dataFim ? new Date(dataFim) : null,
            status: status || 'ATIVA',
        };
    });

    // Usando createMany para criar todos as metas de uma vez
    const resultado = await prisma.meta.createMany({
        data: dadosParaCriar,
        skipDuplicates: true, // Opcional: ignora se uma meta duplicada for enviada
    });

    return NextResponse.json({ message: `${resultado.count} meta(s) criada(s) com sucesso.` }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar meta(s):', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao criar a(s) meta(s).';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
