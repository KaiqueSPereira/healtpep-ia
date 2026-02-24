
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { logErrorToDb } from '@/app/_lib/logger';

/**
 * Rota da API para buscar nomes únicos e padronizados de biomarcadores
 * que estão atualmente marcados com a categoria "Pendente" na tabela de regras.
 * 
 * @returns {Promise<NextResponse>} Uma resposta JSON contendo um array de nomes de biomarcadores
 * ou uma resposta de erro em caso de falha.
 */
export async function GET() {
  const componentName = 'API GET /api/exames/biomarcadores/pendentes';
  try {
    const pendingRules = await prisma.biomarkerRule.findMany({
      where: {
        category: 'Pendente',
      },
      select: {
        standardizedName: true,
      },
      distinct: ['standardizedName'],
    });

    // Extrai os nomes padronizados para um array de strings
    const names = pendingRules.map(rule => rule.standardizedName);

    return NextResponse.json(names);
    
  } catch (error) {
    const errorMessage = 'Erro ao buscar biomarcadores pendentes.';
    await logErrorToDb(
        errorMessage,
        error instanceof Error ? error.stack || error.message : String(error),
        componentName
    );
    return new NextResponse('Erro interno do servidor ao processar a solicitação.', { status: 500 });
  }
}
