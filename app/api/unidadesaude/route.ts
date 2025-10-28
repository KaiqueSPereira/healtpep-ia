// app/api/unidadesaude/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { ApiRouteHandler } from "../types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

type UnidadeParams = Record<string, never>;

export const GET: ApiRouteHandler<UnidadeParams> = async (request) => {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const unidade = await db.unidadeDeSaude.findUnique({
        where: { 
            id,
            userId: userId
        },
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
          { error: "Unidade não encontrada ou não pertence ao usuário" },
          { status: 404 },
        );
      }

      return NextResponse.json(unidade);
    }

    const unidades = await db.unidadeDeSaude.findMany({
      where: { userId: userId },
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const { nome, tipo, telefone, endereco } = body;

    // --- Validation ---
    if (!nome || !tipo || !telefone || !endereco) {
        return NextResponse.json({ error: "Campos da unidade de saúde são obrigatórios." }, { status: 400 });
    }

    const { rua, numero, bairro, cidade, estado, cep } = endereco;
    if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
        return NextResponse.json({ error: "Todos os campos do endereço são obrigatórios." }, { status: 400 });
    }
    
    if (isNaN(parseInt(numero, 10))) {
        return NextResponse.json({ error: "O número do endereço deve ser um valor numérico." }, { status: 400 });
    }
    // --- End Validation ---

    const novaUnidade = await db.unidadeDeSaude.create({
        data: {
            nome,
            tipo,
            telefone,
            usuario: {
                connect: { id: session.user.id },
            },
            endereco: {
                create: {
                    nome: nome, // Use o nome da unidade como nome do endereço
                    rua,
                    numero: parseInt(numero, 10),
                    bairro,
                    municipio: cidade,
                    UF: estado,
                    CEP: cep,
                }
            }
        },
        include: {
            endereco: true
        }
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
