import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação e autorização do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = request.nextUrl;
    const searchTerm = searchParams.get('term');

    // Se não houver termo de busca, retorna uma lista vazia
    if (!searchTerm) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Busca apenas nas condições de saúde pertencentes ao usuário logado
    const condicoesSaude = await prisma.condicaoSaude.findMany({
      where: {
        userId: userId, // Filtro de segurança para garantir a privacidade dos dados
        nome: {
          contains: searchTerm,
          mode: 'insensitive', // Busca case-insensitive
        },
      },
      include: {
        // Inclui as consultas relacionadas, com os respetivos profissionais
        consultas: {
           include: {
              profissional: true,
           }
        },
        // Inclui os exames relacionados, com os respetivos profissionais
        exames: {
            include: {
               profissional: true,
            }
        },
        // Inclui os medicamentos relacionados, enriquecendo o resultado da busca
        medicamentos: true,
      },
    });

    // Retorna as condições de saúde encontradas, já com os dados relacionados aninhados
    return NextResponse.json(condicoesSaude, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar condições de saúde:', error);
    return NextResponse.json({ error: 'Falha ao buscar condições de saúde' }, { status: 500 });
  }
}
