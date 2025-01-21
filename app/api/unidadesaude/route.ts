import { db } from "@/app/_lib/prisma";
import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";

// Funç?o para garantir que o usuário esteja logado
async function checkAuth(req: Request) {
  const session = await getSession({ req });
  if (!session) {
    return NextResponse.json(
      { error: "Usuário n?o autenticado" },
      { status: 401 },
    );
  }
  return session;
}

// Exportaç?o dos métodos para cada tipo de requisiç?o HTTP
export async function GET(req: Request) {
  const session = await checkAuth(req);
  if (!session) return;

  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");

  if (unidadeId) {
    // Obter uma unidade específica
    try {
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { id: unidadeId },
      });
      if (!unidade) {
        return NextResponse.json(
          { error: "Unidade n?o encontrada" },
          { status: 404 },
        );
      }
      return NextResponse.json(unidade);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar a unidade" },
        { status: 500 },
      );
    }
  } else {
    // Listar todas as unidades
    try {
      const unidades = await db.unidadeDeSaude.findMany();
      return NextResponse.json(unidades);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar as unidades" },
        { status: 500 },
      );
    }
  }
}

export async function POST(req: Request) {
  const session = await checkAuth(req);
  if (!session) return;

  try {
    const { nome, tipo, endereco } = await req.json();
    const novaUnidade = await db.unidadeDeSaude.create({
      data: { nome, tipo, endereco },
    });
    return NextResponse.json(novaUnidade);
  } catch {
    return NextResponse.json(
      { error: "Falha ao cadastrar a unidade" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await checkAuth(req);
  if (!session) return;

  try {
    const { nome, tipo, endereco, id } = await req.json();
    const unidadeAtualizada = await db.unidadeDeSaude.update({
      where: { id },
      data: { nome, tipo, endereco },
    });
    return NextResponse.json(unidadeAtualizada);
  } catch {
    return NextResponse.json(
      { error: "Falha ao atualizar a unidade" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = await checkAuth(req);
  if (!session) return;

  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");

  if (!unidadeId) {
    return NextResponse.json(
      { error: "ID da unidade é necessário" },
      { status: 400 },
    );
  }

  try {
    await db.unidadeDeSaude.delete({ where: { id: unidadeId } });
    return NextResponse.json({ message: "Cadastro deletado com sucesso!" });
  } catch {
    return NextResponse.json(
      { error: "Falha ao deletar o cadastro" },
      { status: 500 },
    );
  }
}
