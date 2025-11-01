import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";

// Definição do schema para validação dos dados de criação
const profissionalCreateSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio."),
  especialidade: z.string().min(1, "A especialidade e obrigatoria."),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio."),
  unidadeIds: z.array(z.string().uuid("ID da unidade invalido.")).optional(),
});

// Método GET (Listar todos os profissionais)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  try {
    const profissionais = await db.profissional.findMany({
      where: { userId: session.user.id },
      include: { unidades: true },
      orderBy: { nome: 'asc' } // Ordenar por nome
    });
    return NextResponse.json(profissionais);
  } catch (error) {
    console.error("Erro ao buscar todos os profissionais:", error);
    return NextResponse.json(
      { error: "Falha ao buscar os profissionais" },
      { status: 500 },
    );
  }
}

// Método POST (Criar um novo profissional)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = profissionalCreateSchema.parse(body);
    const userId = session.user.id;

    // 1. VERIFICAÇÃO PRÉVIA: Checar se o usuário já cadastrou este profissional
    const existingProfissional = await db.profissional.findFirst({
        where: {
            NumClasse: parsedData.NumClasse,
            userId: userId,
        }
    });

    // 2. RETORNO AMIGÁVEL: Se encontrar, retorna erro 409
    if (existingProfissional) {
        return NextResponse.json(
            { error: "Você já cadastrou um profissional com este número de classe." },
            { status: 409 } // 409 Conflict
        );
    }

    // Se não existir, prossegue com a criação
    const novoProfissional = await db.profissional.create({
      data: {
        nome: parsedData.nome,
        especialidade: parsedData.especialidade,
        NumClasse: parsedData.NumClasse,
        userId: userId,
        unidades: {
          connect: parsedData.unidadeIds?.map(id => ({ id })) || [],
        },
      },
      include: { 
        unidades: true,
      }
    });

    return NextResponse.json(novoProfissional, { status: 201 });

  } catch (error) {
    console.error("Erro ao cadastrar o profissional:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }

    // 3. SEGUNDA CAMADA DE SEGURANÇA: Tratar erro de duplicidade do banco de dados
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
            { error: "Este número de classe já está cadastrado no sistema." },
            { status: 409 } // 409 Conflict
        );
    }

    return NextResponse.json(
      { error: "Falha ao cadastrar o profissional." },
      { status: 500 },
    );
  }
}
