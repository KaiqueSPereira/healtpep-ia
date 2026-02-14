import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker"; // Importando o verificador

const profissionalCreateSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio."),
  especialidade: z.string().min(1, "A especialidade e obrigatoria."),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio."),
  unidadeIds: z.array(z.string().uuid("ID da unidade invalido.")).optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unidadeId = searchParams.get('unidadeId');

  try {
    const whereCondition: Prisma.ProfissionalWhereInput = {
      userId: session.user.id,
    };

    if (unidadeId) {
      whereCondition.unidades = {
        some: {
          id: unidadeId,
        },
      };
    }

    const profissionais = await db.profissional.findMany({
      where: whereCondition,
      include: { unidades: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(profissionais);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json(
      { error: "Falha ao buscar os profissionais" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }
    const userId = session.user.id;

    // --- INÍCIO DA VERIFICAÇÃO DE PERMISSÃO ---
    const permissions = await getPermissionsForUser(userId);
  
    if (await permissions.hasReachedLimit('profissionais')) {
      return NextResponse.json(
        { error: "Você atingiu o limite de profissionais para o seu plano." },
        { status: 403 } // 403 Forbidden
      );
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---

    const body = await request.json();
    const parsedData = profissionalCreateSchema.parse(body);

    const existingProfissional = await db.profissional.findFirst({
        where: {
            NumClasse: parsedData.NumClasse,
            userId: userId,
        }
    });

    if (existingProfissional) {
        return NextResponse.json(
            { error: "Você já cadastrou um profissional com este número de classe." },
            { status: 409 }
        );
    }

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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
            { error: "Este número de classe já está cadastrado no sistema." },
            { status: 409 }
        );
    }

    return NextResponse.json(
      { error: "Falha ao cadastrar o profissional." },
      { status: 500 },
    );
  }
}
