
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { decryptString, encryptString } from '@/app/_lib/crypto';
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker";

// GET: Retorna todas as condições de saúde do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse(JSON.stringify({ error: 'Usuário não autenticado' }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
        });
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
    console.error('Erro ao buscar condições de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Cria uma nova condição de saúde
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Usuário não autenticado' }), {
                status: 401, headers: { 'Content-Type': 'application/json' },
            });
        }
        const userId = session.user.id;

        // --- INÍCIO DA VERIFICAÇÃO DE PERMISSÃO ---
        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('tratamentos')) {
            return new NextResponse(JSON.stringify({ error: "Você atingiu o limite de tratamentos para o seu plano." }), {
                status: 403, // Forbidden
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---

        const body = await request.json();
        const { nome, objetivo, observacoes, profissionalId, dataInicio } = body;

        if (!nome || !dataInicio) {
            return new NextResponse(JSON.stringify({ error: 'Nome e Data de Início são obrigatórios' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
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
        console.error('Erro ao criar condição de saúde:', error);
        return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

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
    await db.condicaoSaude.delete({ where: { id: condicaoId } });
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
    console.error('Erro ao atualizar condição de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
