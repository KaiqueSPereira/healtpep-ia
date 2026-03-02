import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { encryptString, decryptString } from "@/app/_lib/crypto";
import { logAction } from "@/app/_lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

// Helper para obter a sessão e o ID do usuário
async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        // Retornamos null em vez de lançar um erro para permitir logs de acesso não autenticado se necessário
        return { userId: undefined };
    }
    return { userId: session.user.id };
}


// Tipagem baseada no schema do Prisma
interface Endereco {
  id: string;
  CEP: string;
  rua: string;
  bairro: string;
  municipio: string;
  numero: number;
  UF: string;
  nome: string;
  unidadeId: string | null;
}

// Tipagem para os dados descriptografados
type DecryptedEndereco = Omit<Endereco, 'CEP' | 'rua' | 'bairro' | 'municipio' | 'nome'> & {
  CEP: string | null;
  rua: string | null;
  bairro: string | null;
  municipio: string | null;
  nome: string | null;
};

// Helper para descriptografar dados de endereço
const decryptEnderecoData = (endereco: Endereco | null): DecryptedEndereco | null => {
  if (!endereco) return null;
  return {
    ...endereco,
    CEP: endereco.CEP ? decryptString(endereco.CEP) : null,
    rua: endereco.rua ? decryptString(endereco.rua) : null,
    bairro: endereco.bairro ? decryptString(endereco.bairro) : null,
    municipio: endereco.municipio ? decryptString(endereco.municipio) : null,
    nome: endereco.nome ? decryptString(endereco.nome) : null,
  };
};

// POST: Criar um novo endereço
export async function POST(request: Request) {
    const { userId } = await getSessionInfo();
  try {
    const body = await request.json();
    const { CEP, rua, bairro, municipio, numero, UF, unidadeId } = body;

    if (!CEP || !rua || !bairro || !municipio || !numero || !UF || !unidadeId) {
      return NextResponse.json({ error: "Todos os campos, incluindo unidadeId, são obrigatórios." }, { status: 400 });
    }

    const unidade = await db.unidadeDeSaude.findUnique({ where: { id: unidadeId } });
    if (!unidade) {
      return NextResponse.json({ error: "Unidade de saúde não encontrada." }, { status: 404 });
    }

    const numeroAsInt = parseInt(numero, 10);
    if (isNaN(numeroAsInt)) {
      return NextResponse.json({ error: "O campo 'numero' deve ser um número válido." }, { status: 400 });
    }

    const novoEndereco = await db.endereco.create({
      data: {
        CEP: encryptString(CEP),
        rua: encryptString(rua),
        bairro: encryptString(bairro),
        municipio: encryptString(municipio),
        nome: encryptString(unidade.nome),
        numero: numeroAsInt,
        UF,
        unidadeId: unidadeId,
      },
    });
    
    await logAction({
        userId,
        action: "create_endereco",
        level: "info",
        message: `Endereço com ID '${novoEndereco.id}' criado com sucesso.`,
        details: { enderecoId: novoEndereco.id },
        component: "enderecos-api",
    });

    const decryptedEndereco = decryptEnderecoData(novoEndereco as Endereco);
    return NextResponse.json(decryptedEndereco, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "create_endereco_error",
        level: "error",
        message: "Erro ao salvar o endereço",
        details: errorMessage,
        component: "enderecos-api",
    });
    return NextResponse.json({ error: "Erro ao salvar o endereço." }, { status: 500 });
  }
}

// GET: Obter endereços
export async function GET(request: Request) {
  const url = new URL(request.url);
  const enderecoId = url.searchParams.get("id");
  const { userId } = await getSessionInfo();


  try {
    if (enderecoId) {
      const endereco = await db.endereco.findUnique({ where: { id: enderecoId } });
      if (!endereco) {
        return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 });
      }
      const decryptedEndereco = decryptEnderecoData(endereco as Endereco);
      return NextResponse.json(decryptedEndereco);
    } else {
      const enderecos = await db.endereco.findMany();
      const decryptedEnderecos = enderecos.map(e => decryptEnderecoData(e as Endereco));
      return NextResponse.json(decryptedEnderecos);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "get_endereco_error",
        level: "error",
        message: "Erro ao buscar endereços",
        details: errorMessage,
        component: "enderecos-api",
    });
    return NextResponse.json({ error: "Falha ao buscar os endereços." }, { status: 500 });
  }
}

// PATCH: Atualizar um endereço
export async function PATCH(request: Request) {
    const { userId } = await getSessionInfo();
  try {
    const body = await request.json();
    const { id, CEP, rua, bairro, municipio, numero, UF, unidadeId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do endereço é necessário." }, { status: 400 });
    }

    const dataToUpdate: Prisma.EnderecoUpdateInput = {};

    if (unidadeId) {
      const unidade = await db.unidadeDeSaude.findUnique({ where: { id: unidadeId } });
      if (!unidade) {
        return NextResponse.json({ error: "Unidade de saúde não encontrada." }, { status: 404 });
      }
      dataToUpdate.nome = encryptString(unidade.nome);
      dataToUpdate.unidadeId = unidadeId;
    }

    if (CEP) dataToUpdate.CEP = encryptString(CEP);
    if (rua) dataToUpdate.rua = encryptString(rua);
    if (bairro) dataToUpdate.bairro = encryptString(bairro);
    if (municipio) dataToUpdate.municipio = encryptString(municipio);
    if (numero) {
      const numeroAsInt = parseInt(numero, 10);
      if (isNaN(numeroAsInt)) {
        return NextResponse.json({ error: "O campo 'numero' deve ser um número válido." }, { status: 400 });
      }
      dataToUpdate.numero = numeroAsInt;
    }
    if (UF) dataToUpdate.UF = UF;

    const enderecoAtualizado = await db.endereco.update({
      where: { id },
      data: dataToUpdate,
    });
     await logAction({
        userId,
        action: "update_endereco",
        level: "info",
        message: `Endereço com ID '${id}' atualizado com sucesso.`,
        details: { enderecoId: id },
        component: "enderecos-api",
    });

    const decryptedEndereco = decryptEnderecoData(enderecoAtualizado as Endereco);
    return NextResponse.json(decryptedEndereco);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "update_endereco_error",
        level: "error",
        message: "Erro ao atualizar o endereço",
        details: errorMessage,
        component: "enderecos-api",
    });
    return NextResponse.json({ error: "Falha ao atualizar o endereço." }, { status: 500 });
  }
}

// DELETE: Deletar um endereço
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const enderecoId = url.searchParams.get("id");
  const { userId } = await getSessionInfo();


  if (!enderecoId) {
    return NextResponse.json({ error: "ID do endereço é necessário." }, { status: 400 });
  }

  try {
    await db.endereco.delete({ where: { id: enderecoId } });
    await logAction({
        userId,
        action: "delete_endereco",
        level: "info",
        message: `Endereço com ID '${enderecoId}' deletado com sucesso.`,
        details: { enderecoId },
        component: "enderecos-api",
    });
    return NextResponse.json({ message: "Endereço deletado com sucesso!" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
    }
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId,
        action: "delete_endereco_error",
        level: "error",
        message: "Erro ao deletar o endereço",
        details: errorMessage,
        component: "enderecos-api",
    });
    return NextResponse.json({ error: "Falha ao deletar o endereço." }, { status: 500 });
  }
}
