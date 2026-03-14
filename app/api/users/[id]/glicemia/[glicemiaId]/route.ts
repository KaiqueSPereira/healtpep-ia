import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  // Workaround: Extrair IDs diretamente da URL, ignorando o `context.params` que está quebrado.
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  // URL: /api/users/[id]/glicemia/[glicemiaId]
  // Indices: 0/ 1 /  2  / 3  /    4     /      5
  const userId = pathParts[3];
  const glicemiaId = pathParts[5];

  if (!userId || !glicemiaId) {
    return NextResponse.json({ error: 'Não foi possível extrair os IDs da URL.' }, { status: 400 });
  }

  try {
    await prisma.glicemiaCapilar.delete({
      where: {
        id: glicemiaId,
        dadosSaude: {
          userId: userId,
        },
      },
    });

    return NextResponse.json({ message: 'Registro de glicemia excluído com sucesso.' }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado ou não autorizado a excluir.' }, { status: 404 });
    }

    console.error('Erro ao excluir registro de glicemia:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao excluir o registro.' }, { status: 500 });
  }
}
