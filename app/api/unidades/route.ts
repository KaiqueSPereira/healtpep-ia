import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

// Rota para buscar todas as unidades de saúde do usuário logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401 });
    }

    const unidades = await db.unidadeDeSaude.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return new NextResponse(JSON.stringify(unidades), { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar unidades de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}
