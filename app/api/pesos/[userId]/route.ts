// app/api/pesos/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt } from '@/app/_lib/crypto'; // Importa a função de descriptografia

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const historicoPeso = await prisma.pesoHistorico.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        data: 'asc', // Ordena pelo campo 'data' (que contém a data da medição)
      },
    });

    // Descriptografa os dados de peso antes de retornar
    const historicoPesoDescriptografado = historicoPeso.map(registro => ({
      ...registro,
      peso: registro.peso ? safeDecrypt(registro.peso) : null,
      data: registro.data ? safeDecrypt(registro.data) : null, // Descriptografa a data também
    }));

    return NextResponse.json(historicoPesoDescriptografado, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar histórico de peso:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar histórico de peso' }, { status: 500 });
  }
}
