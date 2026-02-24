
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { logErrorToDb } from '@/app/_lib/logger';

export async function PUT(req: Request) {
  const componentName = "API PUT /api/exames/biomarcadores/categorize";
  try {
    const body = await req.json();

    // Usando o schema do errorLog diretamente para um debug preciso.
    await prisma.errorLog.create({
      data: {
        message: 'Debug: Corpo da Requisição de Categorização',
        level: 'info',
        component: componentName,
        stack: JSON.stringify(body, null, 2), // Stringify do body para análise
      },
    });

    const standardizedName = body.standardizedName || body.biomarkerName;
    const { newCategory } = body;

    if (!standardizedName || !newCategory) {
      return NextResponse.json({ error: 'O nome do biomarcador e a nova categoria são obrigatórios.' }, { status: 400 });
    }

    const updateResult = await prisma.biomarkerRule.updateMany({
      where: {
        standardizedName: standardizedName,
      },
      data: {
        category: newCategory,
      },
    });

    if (updateResult.count === 0) {
        console.warn(`Nenhuma regra de biomarcador encontrada para o nome padronizado: '${standardizedName}'. A categoria não foi atualizada.`);
    }

    return NextResponse.json({
      message: `A categoria para '${standardizedName}' foi atualizada para '${newCategory}' com sucesso.`,
      updatedRulesCount: updateResult.count,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    await logErrorToDb('Erro ao categorizar biomarcador', error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
