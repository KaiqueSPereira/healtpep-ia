import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// MĂ©todo GET
export async function GET(req: Request) {
  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");
  const unidadeNome = url.searchParams.get("nome");

  try {
    if (unidadeId) {
      // Buscar uma unidade especĂ­fica
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { id: unidadeId },
        include: {
          endereco: true, // `endereco` Ă© agora um Ăşnico objeto
          consultas: true,
          profissionais: true,
        },
      });

      if (!unidade) {
        return NextResponse.json(
          { error: `Unidade com ID ${unidadeId} nĂŁo encontrada` },
          { status: 404 },
        );
      }

      return NextResponse.json(unidade);
    } else {
      // Buscar todas as unidades com filtro opcional de nome
      const filtro: Prisma.UnidadeDeSaudeWhereInput = unidadeNome
        ? {
            nome: {
              contains: unidadeNome,
              mode: "insensitive",
            },
          }
        : {};

      const unidades = await db.unidadeDeSaude.findMany({
        where: filtro,
        include: {
          endereco: true, // `endereco` Ă© um Ăşnico objeto
        },
      });

      return NextResponse.json(unidades);
    }
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return NextResponse.json(
      { error: "Falha ao buscar as unidades" },
      { status: 500 },
    );
  }
}

// MĂ©todo POST
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nome = body.nome; // Nome da unidade
    const { tipo, enderecoId } = body;

    // ValidaĂ§ĂŁo dos campos obrigatĂłrios
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

    // Verificar se o endereĂ§o existe e estĂˇ disponĂ­vel
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
          error: `EndereĂ§o com ID '${enderecoId}' jĂˇ estĂˇ associado a uma unidade de saĂşde`,
        },
        { status: 400 },
      );
    }

    // Criar nova unidade de saĂşde associada ao endereĂ§o
    const novaUnidade = await db.unidadeDeSaude.create({
      data: {
        nome,
        tipo,
        endereco: {
          connect: { id: enderecoId }, // Associa o endereĂ§o ao criar a unidade
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
// MĂ©todo PATCH
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, tipo, endereco } = body;

    if (!id) {
      return NextResponse.json(
        { error: "O campo 'id' Ă© obrigatĂłrio" },
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
                update: endereco, // Atualizar endereĂ§o existente
                create: endereco, // Criar novo endereĂ§o se nĂŁo existir
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

// MĂ©todo DELETE
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("id");

  if (!unidadeId) {
    return NextResponse.json(
      { error: "O campo 'id' Ă© obrigatĂłrio para deletar uma unidade" },
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
