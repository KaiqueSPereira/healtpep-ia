import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function handler(req: Request) {
  const { method } = req;
  const session = await getServerSession(req);

  if (!session) {
    return NextResponse.json(
      { error: "Usu�rio n?o autenticado" },
      { status: 401 },
    );
  }

  switch (method) {
    case "GET":
      return await handleGet(req);
    case "POST":
      return await handlePost(req, session);
    case "PATCH":
      return await handlePatch(req);
    case "DELETE":
      return await handleDelete(req);
    default:
      return NextResponse.json(
        { error: "M�todo n?o permitido" },
        { status: 405 },
      );
  }
}

async function handlePost(req: Request, session: any) {
  try {
    const { CEP, numero, rua, bairro, municipio, UF, nome, unidadeId } =
      await req.json();

    // Use o userId da sess?o
    const userId = session.user.id; // O id do usu�rio logado

    const novoEndereco = await db.endereco.create({
      data: {
        CEP,
        numero,
        rua,
        bairro,
        municipio,
        UF,
        nome,
        userId, // Associando o endere�o ao usu�rio logado
        unidadeId,
      },
    });
    return NextResponse.json(novoEndereco);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao salvar o endere�o" },
      { status: 500 },
    );
  }
}

async function handleGet(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  if (enderecoId) {
    try {
      const endereco = await db.endereco.findUnique({
        where: { id: enderecoId },
      });
      if (!endereco) {
        return NextResponse.json(
          { error: "Endere�o n?o encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json(endereco);
    } catch (error) {
      return NextResponse.json(
        { error: "Falha ao buscar o endere�o" },
        { status: 500 },
      );
    }
  } else {
    try {
      const enderecos = await db.endereco.findMany();
      return NextResponse.json(enderecos);
    } catch (error) {
      return NextResponse.json(
        { error: "Falha ao buscar os endere�os" },
        { status: 500 },
      );
    }
  }
}

async function handlePatch(req: Request) {
  try {
    const {
      id,
      CEP,
      numero,
      rua,
      bairro,
      municipio,
      UF,
      nome,
      userId,
      unidadeId,
    } = await req.json();
    const enderecoAtualizado = await db.endereco.update({
      where: { id },
      data: {
        CEP,
        numero,
        rua,
        bairro,
        municipio,
        UF,
        nome,
        userId,
        unidadeId,
      },
    });
    return NextResponse.json(enderecoAtualizado);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao atualizar o endere�o" },
      { status: 500 },
    );
  }
}

async function handleDelete(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  if (!enderecoId) {
    return NextResponse.json(
      { error: "ID do endere�o � necess�rio" },
      { status: 400 },
    );
  }

  try {
    await db.endereco.delete({ where: { id: enderecoId } });
    return NextResponse.json({ message: "Endere�o deletado com sucesso!" });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao deletar o endere�o" },
      { status: 500 },
    );
  }
}

export default handler;
