import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// Método POST (mantido para a rota sem ID) - Note: Este POST aqui é incomum. A criação geralmente seria em /unidadesaude/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, tipo, enderecoId, telefone } = body;

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
        telefone,
        endereco: {
          connect: { id: enderecoId },
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
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Get ID from URL parameters
    const body = await req.json();
    const { nome, tipo, endereco, telefone } = body;

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
        telefone,
        endereco: endereco
          ? {
              upsert: {
                update: endereco,
                create: endereco,
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

// Método DELETE - Corrigido para rotas dinâmicas
export async function DELETE(request: Request, { params }: { params: { id: string } }) { // Adicionado request: Request
  const { id } = params; // Get ID from URL parameters

  if (!id) {
    return NextResponse.json(
      { error: "O campo 'id' é obrigatório para deletar uma unidade" },
      { status: 400 },
    );
  }

  try {
    await db.unidadeDeSaude.delete({ where: { id } });
    return NextResponse.json({ message: "Unidade deletada com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar a unidade:", error);
    return NextResponse.json(
      { error: "Falha ao deletar a unidade" },
      { status: 500 },
    );
  }
}

// Adicionar método GET para buscar uma unidade específica por ID
// export async function GET(request: Request, { params }: { params: { id: string } }) {
//   const { id } = params;
//   // ... lógica para buscar a unidade
// }
