
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma'; // Corrigido: Mantendo 'db' como o nome da variável
import { decryptString, encryptString } from '@/app/_lib/crypto';
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker";
import { logErrorToDb } from '@/app/_lib/logger';
import { Prisma } from '@prisma/client';

// GET: Retorna todas as condições de saúde do usuário
export async function GET() {
  const componentName = "API GET /api/condicoes";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const condicoes = await db.condicaoSaude.findMany({
        where: { userId: session.user.id },
    });

    const decryptedCondicoes = condicoes.map(condicao => ({
      ...condicao,
      nome: decryptString(condicao.nome),
      objetivo: condicao.objetivo ? decryptString(condicao.objetivo) : null,
      observacoes: condicao.observacoes ? decryptString(condicao.observacoes) : null,
    }));

    return NextResponse.json(decryptedCondicoes);
  } catch (error) {
    await logErrorToDb("Erro ao buscar condições de saúde", error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: 'Não foi possível buscar as condições de saúde. Tente novamente mais tarde.' }, { status: 500 });
  }
}

// POST: Cria uma nova condição de saúde
export async function POST(request: Request) {
    const componentName = "API POST /api/condicoes";
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }
        const userId = session.user.id;

        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('tratamentos')) {
            return NextResponse.json({ error: "Você atingiu o limite de tratamentos para o seu plano." }, { status: 403 });
        }

        const body = await request.json();
        const { nome, objetivo, observacoes, profissionalId, dataInicio } = body;

        if (!nome || !dataInicio) {
            return NextResponse.json({ error: 'Nome e Data de Início são obrigatórios' }, { status: 400 });
        }

        const novaCondicao = await db.condicaoSaude.create({
            data: {
                userId,
                nome: encryptString(nome),
                objetivo: objetivo ? encryptString(objetivo) : null,
                observacoes: observacoes ? encryptString(observacoes) : null,
                profissionalId,
                dataInicio: new Date(dataInicio),
            },
        });

        return NextResponse.json(novaCondicao, { status: 201 });

    } catch (error) {
        await logErrorToDb("Erro ao criar condição de saúde", error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: 'Não foi possível criar a condição de saúde. Verifique os dados e tente novamente.' }, { status: 500 });
    }
}

// DELETE: Deleta uma condição de saúde específica via search param (id)
export async function DELETE(request: NextRequest) {
  const componentName = "API DELETE /api/condicoes";
  const condicaoId = request.nextUrl.searchParams.get('id');

  if (!condicaoId) {
    return NextResponse.json({ error: 'O ID da condição é obrigatório.' }, { status: 400 });
  }

  try {
    await db.condicaoSaude.delete({ where: { id: condicaoId } });
    return new NextResponse(null, { status: 204 }); // Sucesso, sem conteúdo
  } catch (error) {
    let errorMessage = 'Não foi possível deletar a condição de saúde.';
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        errorMessage = 'Condição de saúde não encontrada.';
    }
    await logErrorToDb(`Erro ao deletar condição de saúde com ID: ${condicaoId}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH: Atualiza uma condição de saúde específica via search param (id)
export async function PATCH(request: NextRequest) {
  const componentName = "API PATCH /api/condicoes";
  const condicaoId = request.nextUrl.searchParams.get('id');

  if (!condicaoId) {
    return NextResponse.json({ error: 'O ID da condição é obrigatório.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { nome, objetivo, observacoes, profissionalId } = body;

    const dataToUpdate: Prisma.CondicaoSaudeUpdateInput = {};

    if (nome) dataToUpdate.nome = encryptString(nome);
    if (objetivo) dataToUpdate.objetivo = encryptString(objetivo);
    if (observacoes) dataToUpdate.observacoes = encryptString(observacoes);
    if (profissionalId !== undefined) {
        dataToUpdate.profissional = profissionalId ? { connect: { id: profissionalId } } : { disconnect: true };
    }

    const updatedCondicao = await db.condicaoSaude.update({
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
    let errorMessage = 'Não foi possível atualizar a condição de saúde.';
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        errorMessage = 'Condição de saúde não encontrada para atualização.';
    }
    await logErrorToDb(`Erro ao atualizar condição de saúde com ID: ${condicaoId}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
