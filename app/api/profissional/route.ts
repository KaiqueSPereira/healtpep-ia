import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod"; // Biblioteca de validação (opcional, mas recomendada)

// Definição do schema para validação dos dados
const profissionalSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório."),
  especialidade: z.string().min(1, "A especialidade é obrigatória."),
  NumClasse: z.string().min(1, "O número de classe é obrigatório."),
  unidadeId: z.string().uuid("ID da unidade inválido."),
});

// Método GET (Buscar profissionais)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const profissionalId = url.searchParams.get("id");

  if (profissionalId) {
    try {
      const profissional = await db.profissional.findUnique({
        where: { id: profissionalId },
        include: { unidades: true, tratamentos: true, consultas: true }, // Incluindo as relações
      });

      if (!profissional) {
        return NextResponse.json(
          { error: "Especialista não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json(profissional);
    } catch (error) {
      console.error("Erro ao buscar profissional:", error);
      return NextResponse.json(
        { error: "Falha ao buscar o profissional" },
        { status: 500 },
      );
    }
  } else {
    try {
      const profissionais = await db.profissional.findMany({
        include: { unidades: true, tratamentos: true, consultas: true },
      });
      return NextResponse.json(profissionais);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      return NextResponse.json(
        { error: "Falha ao buscar os profissionais" },
        { status: 500 },
      );
    }
  }
}

// Método POST (Criar um novo profissional)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validação dos dados com o Zod
    const parsedData = profissionalSchema.parse(body);

    const novoprofissional = await db.profissional.create({
      data: {
        nome: parsedData.nome,
        especialidade: parsedData.especialidade,
        NumClasse: parsedData.NumClasse,
        unidades: {
          connect: [{ id: parsedData.unidadeId }],
        },
      },
    });

    return NextResponse.json(novoprofissional);
  } catch (error) {
    console.error("Erro ao cadastrar o profissional:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao cadastrar o profissional" },
      { status: 400 },
    );
  }
}

// Método PATCH (Atualizar os dados de um profissional)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { nome, especialidade, NumClasse, unidadeId, id } = body;

    // Validação dos dados
    const parsedData = profissionalSchema.partial().parse({
      nome,
      especialidade,
      NumClasse,
      unidadeId,
    });

    const profissionalAtualizado = await db.profissional.update({
      where: { id },
      data: {
        nome: parsedData.nome,
        especialidade: parsedData.especialidade,
        NumClasse: parsedData.NumClasse,
        unidades: {
          connect: [{ id: unidadeId }],
        },
      },
    });

    return NextResponse.json(profissionalAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar o profissional:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar o cadastro do profissional" },
      { status: 500 },
    );
  }
}

// Método DELETE (Deletar um profissional)
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const profissionalId = url.searchParams.get("id");

  if (!profissionalId) {
    return NextResponse.json(
      { error: "ID do profissional é necessário" },
      { status: 400 },
    );
  }

  try {
    const profissional = await db.profissional.findUnique({
      where: { id: profissionalId },
    });

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 },
      );
    }

    await db.profissional.delete({
      where: { id: profissionalId },
    });

    return NextResponse.json({ message: "Cadastro deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar o cadastro:", error);
    return NextResponse.json(
      { error: "Falha ao deletar o Cadastro" },
      { status: 500 },
    );
  }
}
