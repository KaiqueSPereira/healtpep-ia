import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { decryptString } from '@/app/_lib/crypto'; 

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401 });
    }

    const condicoes = await db.condicaoSaude.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
       
        nome: 'asc',
      },
    });

    const decryptedCondicoes = condicoes.map(condicao => ({
      ...condicao,
      nome: decryptString(condicao.nome),
    }));

    return new NextResponse(JSON.stringify(decryptedCondicoes), { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar condições de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}
