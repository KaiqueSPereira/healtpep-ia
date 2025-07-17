import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { encryptString } from '@/app/_lib/crypto'; // Importa a função de criptografia

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, peso, data: dataPeso } = data; // Renomeia 'data' do payload para evitar conflito

    // Verifica se os campos obrigatórios estão presentes
    if (!userId || !peso || !dataPeso) {
      return NextResponse.json({ error: 'userId, peso, and data are required' }, { status: 400 });
    }

    // Criptografa o peso e a data antes de salvar
    const encryptedPeso = encryptString(peso);
    const encryptedDataPeso = encryptString(dataPeso);

    const novoPeso = await prisma.pesoHistorico.create({
      data: {
        userId: userId,
        peso: encryptedPeso,
        data: encryptedDataPeso,
        // createdAt e updatedAt serão gerados automaticamente
      },
    });

    // Retorna o novo registro (sem descriptografar aqui, pois é um POST de criação)
    // Você pode ajustar o que é retornado conforme a necessidade do frontend
    return NextResponse.json(novoPeso, { status: 201 });

  } catch (error) {
    console.error('Erro ao adicionar peso:', error);
    return NextResponse.json({ error: 'Erro interno ao adicionar peso' }, { status: 500 });
  }
}