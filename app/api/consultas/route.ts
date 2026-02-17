import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { encryptString, decryptString } from "@/app/_lib/crypto";
import { Anotacoes, Prisma } from '@prisma/client';
import { Session } from "next-auth";
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker";

export const dynamic = 'force-dynamic'; // Garante que a rota é sempre dinâmica

const getUserSessionAndId = async (): Promise<{ session: Session | null, userId: string | null }> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, userId: null };
  }
  return { session, userId: session.user.id };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("tipo") === "true") {
      const consultaTipos: { tipo: string }[] = await db.$queryRaw`
        SELECT e.enumlabel AS tipo
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Consultatype';
      `;
      return NextResponse.json(consultaTipos.map((row) => row.tipo));
    }

    const { userId } = await getUserSessionAndId();

    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    type ConsultaFromDb = Prisma.ConsultasGetPayload<{
      include: {
        profissional: true;
        unidade: true;
        Anotacoes: true;
        condicoes: true;
      };
    }>;

    const consultas: ConsultaFromDb[] = await db.consultas.findMany({
      where: {
        userId: userId
      },
      include: {
        profissional: true,
        unidade: true,
        Anotacoes: true,
        condicoes: true,
      },
      orderBy: { data: "desc" },
    });

    const decryptedAndMappedConsultas = consultas.map(consulta => {
      const { condicoes, ...restOfConsulta } = consulta;

      const decryptedMotivo = restOfConsulta.motivo ? decryptString(restOfConsulta.motivo) : null;
      const decryptedAnotacoes = restOfConsulta.Anotacoes.map((anotacao: Anotacoes) => ({
        ...anotacao,
        anotacao: decryptString(anotacao.anotacao),
      }));
      const decryptedTipoExame = typeof restOfConsulta.tipodeexame === 'string' && restOfConsulta.tipodeexame ? decryptString(restOfConsulta.tipodeexame) : null;

      return {
        ...restOfConsulta,
        motivo: decryptedMotivo,
        Anotacoes: decryptedAnotacoes,
        tipodeexame: decryptedTipoExame,
        condicaoSaude: condicoes,
      };
    });

    return NextResponse.json(decryptedAndMappedConsultas);

  } catch (error) {
    let errorMessage = "Erro ao buscar os dados";
    if (error instanceof Error) {
      errorMessage = `Erro ao buscar dados: ${error.message}`;
    }
    console.error(errorMessage, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, userId } = await getUserSessionAndId();

    if (!session || !userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    const permissions = await getPermissionsForUser(userId);
  
    if (await permissions.hasReachedLimit('consultas')) {
      return NextResponse.json(
        { error: "Você atingiu o limite de consultas para o seu plano." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      data,
      tipo,
      profissionalId,
      unidadeId,
      condicaoSaudeId,
      queixas,
      tipoexame,
      consultaOrigemId,
    } = body;

    if (!data || !tipo) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: data e tipo` },
        { status: 400 }
      );
    }

    const encryptedMotivo = queixas ? encryptString(queixas) : "";
    const encryptedTipoExame = tipo === "Exame" && tipoexame ? encryptString(tipoexame) : null;

    const novaConsulta = await db.consultas.create({
      data: {
        userId: userId,
        data: new Date(data),
        tipo,
        profissionalId: profissionalId || null,
        unidadeId: unidadeId || null,
        motivo: encryptedMotivo,
        tipodeexame: encryptedTipoExame,
        condicoes: condicaoSaudeId ? { connect: { id: condicaoSaudeId } } : undefined,
        consultaOrigemId: consultaOrigemId || null,
      },
    });

    return NextResponse.json(novaConsulta, { status: 201 });
  } catch (error) {
    let errorMessage = "Erro ao criar consulta";
    if (error instanceof Error) {
      errorMessage = `Erro ao criar consulta: ${error.message}`;
    }
    console.error(errorMessage, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
