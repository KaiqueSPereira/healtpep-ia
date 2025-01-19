// /app/api/medicos/route.ts
import { db } from "@/app/_lib/prisma";
import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";

export async function handler(req: Request) {
  const { method } = req;
  const session = await getSession({ req });

  if (!session) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 },
    );
  }
  switch (method) {
    case "GET":
      return await handleGet(req);
    case "POST":
      return await handlePost(req);
    case "PATCH":
      return await handlePatch(req);
    case "DELETE":
      return await handleDelete(req);
    default:
      return NextResponse.json(
        { error: "Método não permitido" },
        { status: 405 },
      );
  }
}

async function handleGet(req: Request) {
  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");

  if (unidadeId) {
    // Obter um médico específico
    try {
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { id: unidadeId },
      });
      if (!unidade) {
        return NextResponse.json(
          { error: "Unidade de Saúde não encontrada" },
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
    // Listar todos os médicos
    try {
      const unidade = await db.unidadeDeSaude.findMany();
      return NextResponse.json(unidade);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar as unidades" },
        { status: 500 },
      );
    }
  }
}

async function handlePost(req: Request) {
  try {
    const { nome, tipo, endereco } = await req.json();
    const novaunidade = await db.unidadeDeSaude.create({
      data: { nome, tipo, endereco },
    });
    return NextResponse.json(novaunidade);
  } catch {
    return NextResponse.json(
      { error: "Falha ao Cadastrar a unidade" },
      { status: 500 },
    );
  }
}

async function handlePatch(req: Request) {
  try {
    const { nome, tipo, endereco, id } = await req.json();
    const unidadeAtualizada = await db.unidadeDeSaude.update({
      where: { id },
      data: { nome, tipo, endereco },
    });
    return NextResponse.json(unidadeAtualizada);
  } catch {
    return NextResponse.json(
      { error: "Falha ao atualizar o cadastro da unidade" },
      { status: 500 },
    );
  }
}

async function handleDelete(req: Request) {
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
      { error: "Falha ao deletar o Cadastro" },
      { status: 500 },
    );
  }
}

export default handler;
