import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';

// Idealmente, você deve adicionar uma verificação para garantir que apenas administradores
// possam chamar esta rota. Por enquanto, vamos focar na funcionalidade principal.

export async function POST() {
  try {
    await prisma.actionLog.deleteMany({});

    return NextResponse.json({ message: 'Todos os logs foram excluídos com sucesso.' });

  } catch (error) {
    console.error("Erro ao limpar os logs:", error);
    return new NextResponse(
      JSON.stringify({ message: 'Ocorreu um erro ao limpar os logs.' }),
      { status: 500 }
    );
  }
}
