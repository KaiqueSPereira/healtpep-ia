import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { encryptString, decryptString } from "@/app/_lib/crypto";
import { Anotacoes, Prisma } from '@prisma/client';
import { Session } from "next-auth";

const getUserSessionAndId = async (): Promise<{ session: Session | null, userId: string | null }> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, userId: null };
  }
  return { session, userId: session.user.id };
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

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

    type ConsultaWithRelations = Prisma.ConsultasGetPayload<{
      include: {
        usuario: { select: { name: true, email: true } };
        profissional: { select: { id: true, nome: true, especialidade: true } };
        unidade: { select: { id: true, nome: true } };
        Anotacoes: true;
        condicoes: true; 
      };
    }>;

    const consultas: ConsultaWithRelations[] = await db.consultas.findMany({
      where: {
        userId: userId
      },
      include: {
        usuario: { select: { name: true, email: true } },
        profissional: { select: { id: true, nome: true, especialidade: true } },
        unidade: { select: { id: true, nome: true } },
        Anotacoes: true,
        condicoes: true,
      },
      orderBy: { data: "desc" },
    });

    const decryptedConsultas = consultas.map(consulta => {
      const decryptedMotivo = consulta.motivo ? decryptString(consulta.motivo) : null;
      const decryptedAnotacoes = consulta.Anotacoes.map((anotacao: Anotacoes) => ({
        ...anotacao,
        anotacao: decryptString(anotacao.anotacao),
      }));
      const decryptedTipoExame = typeof consulta.tipodeexame === 'string' && consulta.tipodeexame ? decryptString(consulta.tipodeexame) : null;

      return {
        ...consulta,
        motivo: decryptedMotivo,
        Anotacoes: decryptedAnotacoes,
        tipodeexame: decryptedTipoExame,
      };
    });

    return NextResponse.json(decryptedConsultas);
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

export async function POST(req: Request) {
  try {
    const { session, userId } = await getUserSessionAndId();

    if (!session || !userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const {
      data,
      tipo,
      profissionalId,
      unidadeId,
      condicaoSaudeId,
      queixas,
      tipoexame,
      // CORREÇÃO: Recebe o ID da consulta de origem
      consultaOrigemId,
    } = body;

    const motivoParaCriptografar = tipo === "Exame" ? tipoexame : queixas;

    if (!data || !tipo) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: data e tipo` },
        { status: 400 }
      );
    }

    const encryptedMotivo = motivoParaCriptografar ? encryptString(motivoParaCriptografar) : "";
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
        // CORREÇÃO: Salva a relação com a consulta de origem se o ID for fornecido
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
