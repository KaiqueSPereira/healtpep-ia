'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt, safeEncrypt } from '@/app/_lib/crypto';

/**
 * Rota da API para unificar nomes de biomarcadores.
 * Recebe um nome de origem e um nome de destino (em texto plano) e
 * atualiza todos os registros com o nome de origem para o nome de destino (criptografado).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sourceName, targetName } = body; // Nomes em texto plano

    if (!sourceName || !targetName) {
      return new NextResponse('Nomes de origem e destino são obrigatórios.', { status: 400 });
    }
    if (sourceName === targetName) {
      return new NextResponse('Nome de origem e destino não podem ser iguais.', { status: 400 });
    }

    // 1. Busca todos os nomes únicos (raw/criptografados) do banco de dados.
    const uniqueRawNames = await prisma.resultadoExame.findMany({
      select: { nome: true },
      distinct: ['nome'],
      where: { nome: { not: '' } },
    });

    // 2. Encontra todas as variações de nomes criptografados que correspondem ao nome de origem descriptografado.
    const rawSourceNamesToUpdate = uniqueRawNames
      .filter(record => safeDecrypt(record.nome) === sourceName)
      .map(record => record.nome);

    if (rawSourceNamesToUpdate.length === 0) {
      return new NextResponse(`Biomarcador de origem '${sourceName}' não encontrado.`, { status: 404 });
    }

    // 3. Criptografa o nome de destino para armazenamento.
    const encryptedTargetName = safeEncrypt(targetName);

    // 4. Atualiza todos os registros que possuem um dos nomes de origem.
    const result = await prisma.resultadoExame.updateMany({
      where: {
        nome: {
          in: rawSourceNamesToUpdate,
        },
      },
      data: {
        nome: encryptedTargetName,
      },
    });

    return NextResponse.json({
      message: `Biomarcador '${sourceName}' foi unificado para '${targetName}'.`,
      count: result.count,
    });

  } catch (error) {
    console.error('Erro ao unificar biomarcadores:', error);
    return new NextResponse('Erro interno do servidor.', { status: 500 });
  }
}
