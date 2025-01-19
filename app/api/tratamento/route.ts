import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "next-auth/react";

export async function handler(req: Request) {
  const { method } = req;
  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "Usuário n?o autorizado" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  switch (method) {
    case "GET":
      return await handleGet(req);
    case "POST":
      return await handlePost(req, userId);
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

async function handlePost(req: Request, userId: string) {
  try {
    const { nome, profissionalId } = await req.json();
    const novoTratamento = await db.tratamento.create({
      data: { nome, profissionalId, userId },
    });
    return NextResponse.json(novoTratamento);
  } catch (error) {
    return NextResponse.json(
      { status: 500 },
    );
  }
}

async function handleGet(req: Request) {
  const url = new URL(req.url);
  const tratamentoId = url.searchParams.get("id");

  if (tratamentoId) {
    try {
      const tratamento = await db.tratamento.findUnique({
        where: { id: tratamentoId },
      });
      if (!tratamento) {
        return NextResponse.json(
          { error: "Tratamento n?o encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json(tratamento);
    } catch (error) {
      return NextResponse.json(
        { status: 500 },
      );
    }
  } else {
    try {
      const tratamentos = await db.tratamento.findMany();
      return NextResponse.json(tratamentos);
    } catch (error) {
      return NextResponse.json(
        { status: 500 },
      );
    }
  }
}

async function handlePatch(req: Request) {
  try {
    const { id, nome } = await req.json();
    const tratamentoAtualizado = await db.tratamento.update({
      where: { id },
      data: { nome },
    });
    return NextResponse.json(tratamentoAtualizado);
  } catch (error) {
    return NextResponse.json(
      { status: 500 },
    );
  }
}

async function handleDelete(req: Request) {
  const url = new URL(req.url);
  const tratamentoId = url.searchParams.get("id");

  if (!tratamentoId) {
    return NextResponse.json(
      { error: "ID do tratamento é necessário" },
      { status: 400 },
    );
  }

  try {
    await db.tratamento.delete({ where: { id: tratamentoId } });
    return NextResponse.json({ message: "Tratamento deletado com sucesso!" });
  } catch (error) {
    return NextResponse.json(
      { status: 500 },
    );
  }
}

export default handler;
