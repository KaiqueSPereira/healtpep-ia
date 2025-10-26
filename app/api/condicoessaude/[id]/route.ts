
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { decryptString, encryptString } from '@/app/_lib/crypto';

// DELETE: Deleta uma condição de saúde específica
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const condicaoId = params.id;

  if (!condicaoId) {
    return new NextResponse(JSON.stringify({ error: 'ID da condição é obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await prisma.condicaoSaude.delete({ where: { id: condicaoId } });
    return new NextResponse(null, { status: 204 }); // Sucesso, sem conteúdo
  } catch (error) {
    console.error('Erro ao deletar condição de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH: Atualiza uma condição de saúde específica
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const condicaoId = params.id;

  if (!condicaoId) {
    return new NextResponse(JSON.stringify({ error: 'ID da condição é obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { nome, objetivo, observacoes, profissionalId } = body;

    const dataToUpdate: {
      nome?: string;
      objetivo?: string | null;
      observacoes?: string | null;
      profissionalId?: string | null;
    } = {};

    if (nome) dataToUpdate.nome = encryptString(nome);
    if (objetivo) dataToUpdate.objetivo = encryptString(objetivo);
    if (observacoes) dataToUpdate.observacoes = encryptString(observacoes);
    // Permite definir o profissionalId como null se ele for removido
    if (profissionalId !== undefined) dataToUpdate.profissionalId = profissionalId;


    const updatedCondicao = await prisma.condicaoSaude.update({
      where: { id: condicaoId },
      data: dataToUpdate,
    });

    const decryptedCondicao = {
      ...updatedCondicao,
      nome: decryptString(updatedCondicao.nome),
      objetivo: updatedCondicao.objetivo ? decryptString(updatedCondicao.objetivo) : null,
      observacoes: updatedCondicao.observacoes ? decryptString(updatedCondicao.observacoes) : null,
    };

    return NextResponse.json(decryptedCondicao);

  } catch (error) {
    console.error('Erro ao atualizar condição de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
