
import { NextResponse } from "next/server";
import { fetchConsultas, fetchProfissionais, fetchTipos } from "@/app/lib/data";
import { db } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth";
import { getServerSession } from "next-auth";
import { decryptString } from "@/app/_lib/crypto";
import { Consultas, Anotacoes, Profissional, UnidadeDeSaude } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Tipo para a consulta com relações, usado para a desencriptação
type ConsultaParaDesencriptar = Consultas & {
    Anotacoes?: Anotacoes[];
    profissional?: Profissional | null;
    unidade?: UnidadeDeSaude | null;
};

// Função de desencriptação com tipos corretos
const decryptConsulta = (consulta: ConsultaParaDesencriptar) => {
  const { Anotacoes: anotacoes, ...restOfConsulta } = consulta;
  return {
      ...restOfConsulta,
      motivo: restOfConsulta.motivo ? decryptString(restOfConsulta.motivo) : null,
      Anotacoes: anotacoes?.map((anotacao) => ({
          ...anotacao,
          anotacao: decryptString(anotacao.anotacao),
      })) || [],
      tipodeexame: restOfConsulta.tipodeexame ? decryptString(restOfConsulta.tipodeexame) : null,
  };
};


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const getData = searchParams.get("get");

    if (getData === "profissionais") {
      const profissionais = await fetchProfissionais();
      return NextResponse.json(profissionais);
    }

    if (getData === "tipos") {
      const tipos = await fetchTipos();
      return NextResponse.json(tipos);
    }
    
    if (getData === "dashboard") {
      const now = new Date();
      const [futuros, passados] = await db.$transaction([
        db.consultas.findMany({
          where: { userId: session.user.id, data: { gte: now } },
          orderBy: { data: 'asc' },
          include: { profissional: true, unidade: true },
        }),
        db.consultas.findMany({
          where: { userId: session.user.id, data: { lt: now } },
          orderBy: { data: 'desc' },
          take: 5,
          include: { profissional: true, unidade: true },
        }),
      ]);

      return NextResponse.json({
        futuros: futuros.map(c => decryptConsulta(c as ConsultaParaDesencriptar)),
        passados: passados.map(c => decryptConsulta(c as ConsultaParaDesencriptar)),
      });
    }

    // Para a busca principal de consultas, passamos os parâmetros para a função reutilizável.
    const consultaData = await fetchConsultas({
      search: searchParams.get("search") || undefined,
      tipo: searchParams.get("tipo") || undefined,
      profissionalId: searchParams.get("profissionalId") || undefined,
      limit: parseInt(searchParams.get("limit") || "8"),
      cursor: searchParams.get("cursor") || undefined,
    });

    return NextResponse.json(consultaData);

  } catch (error) {
    console.error("Erro na rota da API de consultas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
