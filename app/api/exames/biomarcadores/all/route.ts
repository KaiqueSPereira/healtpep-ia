
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { logErrorToDb } from '@/app/_lib/logger';

interface CategorizedBiomarkers {
  [category: string]: string[];
}

export async function GET() {
  const componentName = 'API GET /api/exames/biomarcadores/all';
  try {
    // 1. Busca todas as regras, obtendo o nome padronizado e a categoria.
    const allRules = await prisma.biomarkerRule.findMany({
      select: {
        standardizedName: true,
        category: true,
      },
      distinct: ['standardizedName', 'category'], // Garante combinações únicas.
    });

    // 2. Agrupa os nomes padronizados por categoria de forma eficiente.
    const categorizedBiomarkers = allRules.reduce<CategorizedBiomarkers>((acc, rule) => {
      const { category, standardizedName } = rule;
      if (!acc[category]) {
        acc[category] = [];
      }
      if (!acc[category].includes(standardizedName)) {
        acc[category].push(standardizedName);
      }
      return acc;
    }, {});

    // 3. Ordena os biomarcadores dentro de cada categoria alfabeticamente.
    for (const category in categorizedBiomarkers) {
      categorizedBiomarkers[category].sort();
    }

    return NextResponse.json(categorizedBiomarkers);

  } catch (error) {
    const errorMessage = 'Erro ao buscar e agrupar biomarcadores.';
    await logErrorToDb(
        errorMessage,
        error instanceof Error ? error.stack || error.message : String(error),
        componentName
    );
    return new NextResponse('Erro interno do servidor ao processar a solicitação.', { status: 500 });
  }
}
