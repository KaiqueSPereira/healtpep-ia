'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt, safeEncrypt } from '@/app/_lib/crypto';

/**
 * Rota da API para renomear (ou unificar) categorias de biomarcadores.
 * Recebe uma categoria de origem e uma de destino (em texto plano) e
 * atualiza todos os registros com a categoria de origem para a de destino (criptografada).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sourceCategory, targetCategory } = body; // Nomes em texto plano

    if (!sourceCategory || !targetCategory) {
      return new NextResponse('Nomes de categoria de origem e destino são obrigatórios.', { status: 400 });
    }
    if (sourceCategory === targetCategory) {
      return new NextResponse('Categoria de origem e destino não podem ser iguais.', { status: 400 });
    }

    // 1. Busca todas as categorias únicas (raw/criptografadas) do banco de dados.
    const uniqueRawCategories = await prisma.resultadoExame.findMany({
      select: { categoria: true },
      distinct: ['categoria'],
      where: { categoria: { not: '' } },
    });

    // 2. Encontra todas as variações de categorias criptografadas que correspondem à categoria de origem.
    const rawSourceCategoriesToUpdate = uniqueRawCategories
      .filter(record => safeDecrypt(record.categoria!) === sourceCategory)
      .map(record => record.categoria!);

    if (rawSourceCategoriesToUpdate.length === 0) {
      return new NextResponse(`Categoria de origem '${sourceCategory}' não encontrada.`, { status: 404 });
    }

    // 3. Criptografa a categoria de destino.
    const encryptedTargetCategory = safeEncrypt(targetCategory);

    // 4. Atualiza todos os registros.
    const result = await prisma.resultadoExame.updateMany({
      where: {
        categoria: {
          in: rawSourceCategoriesToUpdate,
        },
      },
      data: {
        categoria: encryptedTargetCategory,
      },
    });

    return NextResponse.json({
      message: `Categoria '${sourceCategory}' foi renomeada para '${targetCategory}'.`,
      count: result.count,
    });

  } catch (error) {
    console.error('Erro ao renomear categoria:', error);
    return new NextResponse('Erro interno do servidor.', { status: 500 });
  }
}
