import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { encryptString, decryptString } from "@/app/_lib/crypto";

// Helper para criptografar dados de endereço
const encryptEnderecoData = (data: any) => {
  const encryptedData: any = { ...data };
  if (data.CEP) encryptedData.CEP = encryptString(data.CEP);
  if (data.rua) encryptedData.rua = encryptString(data.rua);
  if (data.bairro) encryptedData.bairro = encryptString(data.bairro);
  if (data.municipio) encryptedData.municipio = encryptString(data.municipio);
  if (data.numero) encryptedData.numero = parseInt(data.numero, 10);
  return encryptedData;
};

// Helper para descriptografar dados de endereço
const decryptEnderecoData = (endereco: any) => {
  if (!endereco) return null;
  return {
    ...endereco,
    CEP: endereco.CEP ? decryptString(endereco.CEP) : null,
    rua: endereco.rua ? decryptString(endereco.rua) : null,
    bairro: endereco.bairro ? decryptString(endereco.bairro) : null,
    municipio: endereco.municipio ? decryptString(endereco.municipio) : null,
  };
};

// Método POST: Criar um novo endereço
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { CEP, numero, rua, bairro, municipio, UF, nome, unidadeId } = body;

    if (!CEP || !numero || !rua || !bairro || !municipio || !UF || !nome || isNaN(parseInt(numero, 10))) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    const encryptedData = encryptEnderecoData({ CEP, rua, bairro, municipio });

    const novoEndereco = await db.endereco.create({
      data: {
        ...encryptedData,
        numero: parseInt(numero, 10),
        UF,
        nome,
        unidadeId: unidadeId || null,
      },
    });

    return NextResponse.json(novoEndereco);
  } catch (error) {
    console.error("Erro ao salvar o endereço:", error);
    return NextResponse.json({ error: "Erro ao salvar o endereço." }, { status: 500 });
  }
}

// Método GET: Obter endereços ou um endereço específico
export async function GET(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  try {
    if (enderecoId) {
      const endereco = await db.endereco.findUnique({ where: { id: enderecoId } });
      if (!endereco) {
        return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 });
      }
      const decryptedEndereco = decryptEnderecoData(endereco);
      return NextResponse.json(decryptedEndereco);
    } else {
      const enderecos = await db.endereco.findMany();
      const decryptedEnderecos = enderecos.map(decryptEnderecoData);
      return NextResponse.json(decryptedEnderecos);
    }
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return NextResponse.json({ error: "Falha ao buscar os endereços." }, { status: 500 });
  }
}

// Método PATCH: Atualizar um endereço
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do endereço é necessário." }, { status: 400 });
    }

    const encryptedData = encryptEnderecoData(dataToUpdate);

    const enderecoAtualizado = await db.endereco.update({
      where: { id },
      data: encryptedData,
    });

    return NextResponse.json(enderecoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar o endereço:", error);
    return NextResponse.json({ error: "Falha ao atualizar o endereço." }, { status: 500 });
  }
}

// Método DELETE: Deletar um endereço
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const enderecoId = url.searchParams.get("id");

  if (!enderecoId) {
    return NextResponse.json({ error: "ID do endereço é necessário." }, { status: 400 });
  }

  try {
    await db.endereco.delete({ where: { id: enderecoId } });
    return NextResponse.json({ message: "Endereço deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar o endereço:", error);
    return NextResponse.json({ error: "Falha ao deletar o endereço." }, { status: 500 });
  }
}
