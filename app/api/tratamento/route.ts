import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// 📌 GET - Busca tratamentos ou um tratamento específico por ID
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tratamentoId = url.searchParams.get("id");

    if (tratamentoId) {
      const tratamento = await db.tratamento.findUnique({
        where: { id: tratamentoId },
      });

      if (!tratamento) {
        return NextResponse.json(
          { error: "Tratamento não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json(tratamento);
    }

    const tratamentos = await db.tratamento.findMany();
    return NextResponse.json(tratamentos);
  } catch (error) {
    console.error("Erro ao buscar tratamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 📌 POST - Cria um novo tratamento
export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
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
      data: {
        nome,
        profissionalId,
        userId: token.sub, // ✅ Usa o ID do usuário do token JWT
      },
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
// 📌 PATCH - Atualiza um tratamento existente
export async function PATCH(req: Request) {
  try {
    const { id, nome } = await req.json();

    if (!id || !nome) {
      return NextResponse.json(
        { error: "ID e novo nome são obrigatórios" },
        { status: 400 },
      );
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

// 📌 DELETE - Remove um tratamento pelo ID
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const tratamentoId = url.searchParams.get("id");

    if (!tratamentoId) {
      return NextResponse.json(
        { error: "ID do tratamento é obrigatório" },
        { status: 400 },
      );
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
