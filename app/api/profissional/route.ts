// /app/api/medicos/route.ts
import { db } from "@/app/_lib/prisma";
import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";

export async function handler(req: Request) {
  const { method } = req;
  const session = await getSession({ req });

  if (!session) {
    return NextResponse.json(
      { error: "Usuário n?o autenticado" },
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
        { error: "Método n?o permitido" },
        { status: 405 },
      );
  }
}

async function handleGet(req: Request) {
  const url = new URL(req.url);
  const profissionalId = url.searchParams.get("id");

  if (profissionalId) {
    // Obter um médico específico
    try {
      const profissional = await db.profissional.findUnique({ where: { id: profissionalId } });
      if (!profissional) {
        return NextResponse.json(
          { error: "Especialista n?o encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json(profissional);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar o profissional" },
        { status: 500 },
      );
    }
  } else {
    // Listar todos os médicos
    try {
      const profissional = await db.profissional.findMany();
      return NextResponse.json(profissional);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar os profissionais" },
        { status: 500 },
      );
    }
  }
}

async function handlePost(req: Request) {
  try {
    const { nome, especialidade, NumClasse } = await req.json();
    const novoprofissional = await db.profissional.create({
      data: { nome, especialidade, NumClasse },
    });
    return NextResponse.json(novoprofissional);
  } catch {
    return NextResponse.json(
      { error: "Falha ao Cadastrar o profissional" },
      { status: 500 },
    );
  }
}

async function handlePatch(req: Request) {
  try {
    const { nome, especialidade, NumClasse, id } = await req.json();
    const profissionalAtualizado = await db.profissional.update({
      where: { id },
      data: { nome, especialidade, NumClasse },
    });
    return NextResponse.json(profissionalAtualizado);
  } catch {
    return NextResponse.json(
      { error: "Falha ao atualizar o cadastro do profissional" },
      { status: 500 },
    );
  }
}

async function handleDelete(req: Request) {
  const url = new URL(req.url);
  const medicoId = url.searchParams.get("id");

  if (!medicoId) {
    return NextResponse.json(
      { error: "ID do profissional é necessário" },
      { status: 400 },
    );
  }

  try {
    await db.profissional.delete({ where: { id: medicoId } });
    return NextResponse.json({ message: "Cadastro deletado com sucesso!" });
  } catch {
    return NextResponse.json(
      { error: "Falha ao deletar o Cadastro" },
      { status: 500 },
    );
  }
}

export default handler;
