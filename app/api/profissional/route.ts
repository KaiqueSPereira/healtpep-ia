import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod"; // Biblioteca de validação (opcional, mas recomendada)

// Definição do schema para validação dos dados
const profissionalSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio."),
  especialidade: z.string().min(1, "A especialidade e obrigatoria."),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio."),
  unidadeId: z.string().uuid("ID da unidade invalido."),
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
          { error: "Especialista n?o encontrado" },
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
    const errorMessage = (error as Error).message || "Falha ao cadastrar o profissional";
    return NextResponse.json(
      { error: errorMessage },
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

export async function DELETE(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  if (!params || !params.profissionalId) {
    return new Response("ID do profissional não fornecido", { status: 400 });
  }

  const { profissionalId } = params;

  try {
    await db.profissional.delete({
      where: { id: profissionalId },
    });

    return new Response("Profissional deletado com sucesso", { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return new Response("Erro interno ao deletar profissional", {
      status: 500,
    });
  }
}

