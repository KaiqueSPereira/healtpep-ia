'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt } from '@/app/_lib/crypto';

/**
 * Rota da API para buscar nomes únicos de biomarcadores de resultados de exames
 * que estão atualmente marcados com a categoria "Pendente".
 * Os nomes dos biomarcadores são descriptografados antes de serem retornados.
 * 
 * @returns {Promise<NextResponse>} Uma resposta JSON contendo um array de nomes de biomarcadores
 * ou uma resposta de erro em caso de falha.
 */
export async function GET() {
  try {
    const pendingBiomarkers = await prisma.resultadoExame.findMany({
      where: {
        categoria: 'Pendente',
      },
      select: {
        nome: true,
      },
      distinct: ['nome'],
    });

    // Extrai e descriptografa os nomes para um array de strings
    const names = pendingBiomarkers.map(b => safeDecrypt(b.nome));

    return NextResponse.json(names);
  } catch (error) {
    console.error('Erro ao buscar biomarcadores pendentes:', error);
    // Retorna uma resposta de erro genérica para o cliente para não expor detalhes internos
    return new NextResponse('Erro interno do servidor ao processar a solicitação.', { status: 500 });
  }
}
