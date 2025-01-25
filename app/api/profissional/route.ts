import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// Método GET
export async function GET(req: Request) {
  const url = new URL(req.url);
  const profissionalId = url.searchParams.get("id");

  if (profissionalId) {
    try {
      const profissional = await db.profissional.findUnique({
        where: { id: profissionalId },
        include: { unidade: true },
      });
      if (!profissional) {
        return NextResponse.json(
          { error: "Especialista não encontrado" },
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
    try {
      const profissionais = await db.profissional.findMany({
        include: { unidade: true },
      });
      return NextResponse.json(profissionais);
    } catch {
      return NextResponse.json(
        { error: "Falha ao buscar os profissionais" },
        { status: 500 },
      );
    }
  }
}

// Método POST
export async function POST(req: Request) {
  try {
    const { nome, especialidade, NumClasse, unidadeId } = await req.json();
    const novoprofissional = await db.profissional.create({
      data: {
        nome,
        especialidade,
        NumClasse,
        unidade: { connect: { id: unidadeId } },
      },
    });
    return NextResponse.json(novoprofissional);
  } catch {
    return NextResponse.json(
      { error: "Falha ao cadastrar o profissional" },
      { status: 500 },
    );
  }
}

// Método PATCH
export async function PATCH(req: Request) {
  try {
    const { nome, especialidade, NumClasse, unidadeId, id } = await req.json();
    const profissionalAtualizado = await db.profissional.update({
      where: { id },
      data: {
        nome,
        especialidade,
        NumClasse,
        unidade: { connect: { id: unidadeId } },
      },
    });
    return NextResponse.json(profissionalAtualizado);
  } catch {
    return NextResponse.json(
      { error: "Falha ao atualizar o cadastro do profissional" },
      { status: 500 },
    );
  }
}

// Método DELETE
export async function DELETE(req: Request) {
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
