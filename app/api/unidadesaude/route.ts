// app/api/unidadesaude/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { ApiRouteHandler } from "../types";
import { getServerSession } from "next-auth"; // Importar getServerSession
import { authOptions } from "@/app/_lib/auth"; // Importar authOptions

type UnidadeParams = Record<string, never>;

export const GET: ApiRouteHandler<UnidadeParams> = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId"); // Adicionar para filtrar no GET também

    if (id) {
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { id },
        include: {
          endereco: true,
          profissionais: {
            include: {
              unidades: true,
            },
          },
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

    // Lógica para listar unidades, agora filtrando por usuário se userId for fornecido
    const whereClause: { userId?: string } = {};
    if (userId) {
        whereClause.userId = userId;
    }


    const unidades = await db.unidadeDeSaude.findMany({
        where: whereClause, // Aplicar o filtro de usuário se existir
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


export async function POST(req: Request) {
  try {
    // 1. Obter a sessão do usuário logado
    const session = await getServerSession(authOptions);

    // 2. Validar a autenticação
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const nome = body.nome;
    const telefone = body.telefone;
    const { tipo, enderecoId } = body;

    // Validação dos campos obrigatórios
    if (!nome || typeof nome !== "string") {
      return NextResponse.json(
        { error: "O campo 'nome' é obrigatorio e deve ser uma string valida" },
        { status: 400 },
      );
    }
    if (!telefone || typeof telefone !== "string") {
      return NextResponse.json(
        { error: "O campo 'telefone' é obrigatorio e deve ser uma string valida" },
        { status: 400 },
      );
    }

    // Validar e tipar o campo 'tipo' se ele tiver um tipo específico no seu schema Prisma
    // Exemplo: Se 'tipo' for uma string
    if (tipo !== undefined && typeof tipo !== "string") {
       return NextResponse.json({ error: "O campo 'tipo' deve ser uma string" }, { status: 400 });
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

    // 3. Criar nova unidade de saúde associada ao endereço e ao usuário
    const novaUnidade = await db.unidadeDeSaude.create({
      data: {
        nome,
        tipo: tipo as string | undefined, // Adicione uma asserção de tipo ou trate undefined se o campo for opcional
        telefone,
        endereco: {
          connect: { id: enderecoId }, // Associa o endereço ao criar a unidade
        },
        usuario: { // <-- Usando o nome do campo de relacionamento 'usuario'
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json(novaUnidade, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar a unidade:", error);
    const errorMessage = (error as Error).message || "Falha ao cadastrar a unidade";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
