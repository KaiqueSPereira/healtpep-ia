// app/api/unidadesaude/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker"; // Importando o verificador
import { logAction } from "@/app/_lib/logger";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  try {
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
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
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId: userId,
        action: "get_unidadesaude_error",
        level: "error",
        message: "Erro ao buscar unidades de saúde",
        details: errorMessage,
        component: "unidadesaude-api"
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
};


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  try {
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // --- INÍCIO DA VERIFICAÇÃO DE PERMISSÃO ---
    const permissions = await getPermissionsForUser(userId);
  
    if (await permissions.hasReachedLimit('unidades')) {
      return NextResponse.json(
        { error: "Você atingiu o limite de unidades de saúde para o seu plano." },
        { status: 403 } // 403 Forbidden
      );
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---

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
                connect: { id: userId },
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

    await logAction({
        userId: userId,
        action: "create_unidade_saude",
        level: "info",
        message: `Unidade de saúde '${novaUnidade.id}' criada com sucesso`,
        details: { unidadeId: novaUnidade.id },
        component: "unidadesaude-api"
    });

    return NextResponse.json(novaUnidade, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({
        userId: userId,
        action: "create_unidade_saude_error",
        level: "error",
        message: "Erro ao cadastrar a unidade",
        details: errorMessage,
        component: "unidadesaude-api"
    });
    return NextResponse.json(
      { error: `Falha ao cadastrar a unidade: ${errorMessage}` },
      { status: 500 },
    );
  }
}
