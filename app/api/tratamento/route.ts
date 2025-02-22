import { db } from "@/app/_lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";


// 📌 Função para obter o ID do usuário autenticado
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUserId = async (req: NextRequest): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    console.error("Usuário não autenticado ou sem ID na sessão");
    return null;
  }
  return session.user.id;
};

// 📌 GET - Busca tratamentos do usuário logado
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 },
      );
    }

    const tratamentos = await db.tratamento.findMany({ where: { userId } });
    return NextResponse.json(tratamentos);
  } catch (error) {
    console.error("Erro ao buscar tratamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 📌 POST - Cria um novo tratamento vinculado ao usuário logado
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 },
      );
    }

    const { nome, profissionalId } = await req.json();
    if (!nome || !profissionalId) {
      return NextResponse.json(
        { error: "Nome e profissional são obrigatórios" },
        { status: 400 },
      );
    }

    const novoTratamento = await db.tratamento.create({
      data: { nome, profissionalId, userId },
    });

    return NextResponse.json(novoTratamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tratamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar tratamento" },
      { status: 500 },
    );
  }
}

// 📌 PATCH - Atualiza um tratamento do usuário logado
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 },
      );
    }

    const { id, nome } = await req.json();
    if (!id || !nome) {
      return NextResponse.json(
        { error: "ID e novo nome são obrigatórios" },
        { status: 400 },
      );
    }

    const tratamento = await db.tratamento.findUnique({ where: { id } });
    if (!tratamento || tratamento.userId !== userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const tratamentoAtualizado = await db.tratamento.update({
      where: { id },
      data: { nome },
    });

    return NextResponse.json(tratamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar tratamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar tratamento" },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Remove um tratamento do usuário logado
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const tratamentoId = url.searchParams.get("id");
    if (!tratamentoId) {
      return NextResponse.json(
        { error: "ID do tratamento é obrigatório" },
        { status: 400 },
      );
    }

    const tratamento = await db.tratamento.findUnique({
      where: { id: tratamentoId },
    });
    if (!tratamento || tratamento.userId !== userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await db.tratamento.delete({ where: { id: tratamentoId } });

    return NextResponse.json({ message: "Tratamento deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar tratamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar tratamento" },
      { status: 500 },
    );
  }
}
