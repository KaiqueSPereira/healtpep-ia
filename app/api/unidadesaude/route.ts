import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { ApiRouteHandler } from "../types";

type UnidadeParams = Record<string, never>;

export const GET: ApiRouteHandler<UnidadeParams> = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { id },
        include: {
          endereco: true,
          profissionais: true,
        },
      });

      if (!unidade) {
        return NextResponse.json(
          { error: "Unidade não encontrada" },
          { status: 404 },
        );
      }

      return NextResponse.json(unidade);
    }

    const unidades = await db.unidadeDeSaude.findMany({
      include: {
        endereco: true,
        profissionais: true,
      },
    });

    return NextResponse.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
};

// Método POST
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nome = body.nome; // Nome da unidade
    const { tipo, enderecoId } = body;

    // Validação dos campos obrigatórios
    if (!nome || typeof nome !== "string") {
      return NextResponse.json(
        { error: "O campo 'nome' é obrigatorio e deve ser uma string valida" },
        { status: 400 },
      );
    }

    if (!enderecoId || typeof enderecoId !== "string") {
      return NextResponse.json(
        { error: "O campo 'enderecoId' é obrigatorio e deve ser um ID valido" },
        { status: 400 },
      );
    }

    // Verificar se o endereço existe e está disponível
    const enderecoExistente = await db.endereco.findUnique({
      where: { id: enderecoId },
    });

    if (!enderecoExistente) {
      return NextResponse.json(
        { error: `Endereco com ID '${enderecoId}' nao encontrado` },
        { status: 404 },
      );
    }

    if (enderecoExistente.unidadeId) {
      return NextResponse.json(
        {
          error: `Endereço com ID '${enderecoId}' já está associado a uma unidade de saúde`,
        },
        { status: 400 },
      );
    }

    // Criar nova unidade de saúde associada ao endereço
    const novaUnidade = await db.unidadeDeSaude.create({
      data: {
        nome,
        tipo,
        endereco: {
          connect: { id: enderecoId }, // Associa o endereço ao criar a unidade
        },
      },
    });

    return NextResponse.json(novaUnidade, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar a unidade:", error);
    return NextResponse.json(
      { error: "Falha ao cadastrar a unidade" },
      { status: 500 },
    );
  }
}

// Método PATCH
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, tipo, endereco } = body;

    if (!id) {
      return NextResponse.json(
        { error: "O campo 'id' é obrigatório" },
        { status: 400 },
      );
    }

    const unidadeAtualizada = await db.unidadeDeSaude.update({
      where: { id },
      data: {
        nome,
        tipo,
        endereco: endereco
          ? {
              upsert: {
                update: endereco, // Atualizar endereço existente
                create: endereco, // Criar novo endereço se não existir
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(unidadeAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar a unidade:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar a unidade" },
      { status: 500 },
    );
  }
}

// Método DELETE
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");

  if (!unidadeId) {
    return NextResponse.json(
      { error: "O campo 'id' é obrigatório para deletar uma unidade" },
      { status: 400 },
    );
  }

  try {
    await db.unidadeDeSaude.delete({ where: { id: unidadeId } });
    return NextResponse.json({ message: "Unidade deletada com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar a unidade:", error);
    return NextResponse.json(
      { error: "Falha ao deletar a unidade" },
      { status: 500 },
    );
  }
}
