import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// MĂ©todo POST: Criar um novo endereĂ§o
export async function POST(req: Request) {
  try {
    const { CEP, numero, rua, bairro, municipio, UF, nome, unidadeId } =
      await req.json();

    // ValidaĂ§ĂŁo de dados
    if (
      !CEP ||
      !numero ||
      !rua ||
      !bairro ||
      !municipio ||
      !UF ||
      !nome ||
      isNaN(parseInt(numero, 10))
    ) {
      return NextResponse.json(
        { error: "Preencha todos os campos corretamente." },
        { status: 400 },
      );
    }

    const novoEndereco = await db.endereco.create({
      data: {
        CEP,
        numero: parseInt(numero, 10),
        rua,
        bairro,
        municipio,
        UF,
        nome,
        unidadeId: unidadeId || null, // Unidade Ă© opcional
      },
    });

    return NextResponse.json(novoEndereco);
  } catch (error) {
    console.error("Erro ao salvar o endereço:", error);
    return NextResponse.json(
      { error: "Erro ao salvar o endereço." },
      { status: 500 },
    );
  }
}

// MĂ©todo GET: Obter endereĂ§os ou um endereĂ§o especĂ­fico
export async function GET(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  if (enderecoId) {
    try {
      const endereco = await db.endereco.findUnique({
        where: { id: enderecoId },
      });

      if (!endereco) {
        return NextResponse.json(
          { error: "Endereço não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json(endereco);
    } catch (error) {
      console.error("Erro ao buscar o endereço:", error);
      return NextResponse.json(
        { error: "Falha ao buscar o endereço." },
        { status: 500 },
      );
    }
  } else {
    try {
      const enderecos = await db.endereco.findMany();
      return NextResponse.json(enderecos);
    } catch (error) {
      console.error("Erro ao buscar os endereços:", error);
      return NextResponse.json(
        { error: "Falha ao buscar os endereços." },
        { status: 500 },
      );
    }
  }
}

// MĂ©todo PATCH: Atualizar um endereĂ§o
export async function PATCH(req: Request) {
  try {
    const { id, CEP, numero, rua, bairro, municipio, UF, nome, unidadeId } =
      await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do endereço e necessario." },
        { status: 400 },
      );
    }

    const enderecoAtualizado = await db.endereco.update({
      where: { id },
      data: {
        CEP,
        numero: parseInt(numero, 10),
        rua,
        bairro,
        municipio,
        UF,
        nome,
        unidadeId,
      },
    });

    return NextResponse.json(enderecoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar o endereco:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar o endereco." },
      { status: 500 },
    );
  }
}

// MĂ©todo DELETE: Deletar um endereĂ§o
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  if (!enderecoId) {
    return NextResponse.json(
      { error: "ID do endereco e necessario." },
      { status: 400 },
    );
  }

  try {
    await db.endereco.delete({ where: { id: enderecoId } });
    return NextResponse.json({ message: "Endereco deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar o endereco:", error);
    return NextResponse.json(
      { error: "Falha ao deletar o endereco." },
      { status: 500 },
    );
  }
}
