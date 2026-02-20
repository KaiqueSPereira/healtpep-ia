import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { decryptString } from "@/app/_lib/crypto";
import { Anotacoes, Consultas, Consultatype, Prisma, Profissional, UnidadeDeSaude, CondicaoSaude } from '@prisma/client';
import { Session } from "next-auth";
import { Anexo } from "@/app/_components/types"; 

export const dynamic = 'force-dynamic';

type ConsultaComRelacoes = Consultas & {
    Anotacoes?: Anotacoes[];
    condicoes?: CondicaoSaude[]; 
    profissional?: Profissional | null;
    unidade?: UnidadeDeSaude | null;
    anexos?: Anexo[];
};

const getUserSessionAndId = async (): Promise<{ session: Session | null, userId: string | null }> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, userId: null };
  }
  return { session, userId: session.user.id };
};

const parseDate = (dateString: string) => {
    const regexFullDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const regexYearShort = /^(\d{2})\/(\d{2})\/(\d{2})$/;
    const regexMonthDay = /^(\d{2})\/(\d{2})$/;
    const regexDayOnly = /^(\d{2})$/;

    let date: Date | null = null;
    const now = new Date();

    const matchFullDate = dateString.match(regexFullDate);
    if (matchFullDate) {
        const [, day, month, year] = matchFullDate;
        date = new Date(`${year}-${month}-${day}`);
    } else {
        const matchShortYear = dateString.match(regexYearShort);
        if (matchShortYear) {
        const [, day, month, year] = matchShortYear;
        date = new Date(`20${year}-${month}-${day}`);
        } else {
        const matchMonthDay = dateString.match(regexMonthDay);
        if (matchMonthDay) {
            const [, day, month] = matchMonthDay;
            date = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day));
        } else {
            const matchDayOnly = dateString.match(regexDayOnly);
            if (matchDayOnly) {
            const [, day] = matchDayOnly;
            date = new Date(now.getFullYear(), now.getMonth(), parseInt(day));
            }
        }
        }
    }

    if (date && isNaN(date.getTime())) return null;
    return date;
};

// Função para descriptografar uma consulta
const decryptConsulta = (consulta: ConsultaComRelacoes) => {
    const { Anotacoes: anotacoes, ...restOfConsulta } = consulta;
    return {
        ...restOfConsulta,
        motivo: restOfConsulta.motivo ? decryptString(restOfConsulta.motivo) : null,
        Anotacoes: anotacoes?.map((anotacao: Anotacoes) => ({
            ...anotacao,
            anotacao: decryptString(anotacao.anotacao),
        })) || [],
        tipodeexame: restOfConsulta.tipodeexame ? decryptString(restOfConsulta.tipodeexame) : null,
    };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId } = await getUserSessionAndId();

    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const getData = searchParams.get("get");
    const now = new Date();

    if (getData === "dashboard") {
      const [futuros, passados] = await db.$transaction([
        db.consultas.findMany({
          where: { userId, data: { gte: now } },
          orderBy: { data: 'asc' },
          include: { profissional: true, unidade: true },
        }),
        db.consultas.findMany({
          where: { userId, data: { lt: now } },
          orderBy: { data: 'desc' },
          take: 5,
          include: { profissional: true, unidade: true },
        }),
      ]);

      return NextResponse.json({
        futuros: futuros.map(decryptConsulta),
        passados: passados.map(decryptConsulta),
      });
    }

    if (getData === "all") {
      const allConsultas = await db.consultas.findMany({
        where: { userId },
        orderBy: { data: 'desc' },
        include: { profissional: true, unidade: true },
      });
      return NextResponse.json(allConsultas.map(decryptConsulta));
    }

    if (getData === "tipos") {
      return NextResponse.json(Object.values(Consultatype));
    }

    if (getData === "profissionais") {
      const profissionais = await db.profissional.findMany({
        where: { userId: userId },
        orderBy: { nome: 'asc' },
      });
      return NextResponse.json(profissionais);
    }
    
    const limit = parseInt(searchParams.get("limit") || "8");
    const cursor = searchParams.get("cursor") || null;
    const searchTerm = searchParams.get("search")?.trim() || "";
    const profissionalId = searchParams.get("profissionalId");
    const tipo = searchParams.get("tipo") as Consultatype | null;

    let where: Prisma.ConsultasWhereInput = { userId };
    if (profissionalId) where.profissionalId = profissionalId;
    if (tipo) where.tipo = tipo;
    
    if (searchTerm) {
      const parsedDate = parseDate(searchTerm);
      if (parsedDate) {
         where = { userId, data: { gte: parsedDate, lt: new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000) } };
      } else {
        where.OR = [
          { motivo: { contains: searchTerm, mode: "insensitive" } },
          { tipodeexame: { contains: searchTerm, mode: "insensitive" } },
          { profissional: { nome: { contains: searchTerm, mode: "insensitive" } } },
          { unidade: { nome: { contains: searchTerm, mode: "insensitive" } } },
          { Anotacoes: { some: { anotacao: { contains: searchTerm, mode: "insensitive" } } } },
        ];
      }
    }
    
    const consultas = await db.consultas.findMany({
      where,
      take: limit + 1, 
      cursor: cursor ? { id: cursor } : undefined,
      // --- CORREÇÃO: `condicaoSaude` para `condicoes` ---
      include: { profissional: true, unidade: true, Anotacoes: true, condicoes: true, anexos: true }, 
      orderBy: { data: "desc" },
    });

    let nextCursor: string | null = null;
    if (consultas.length > limit) {
      const nextItem = consultas.pop();
      nextCursor = nextItem!.id;
    }
    
    return NextResponse.json({
      items: consultas.map(decryptConsulta),
      nextCursor,
    });

  } catch (error) {
    let errorMessage = "Erro ao buscar os dados";
    if (error instanceof Error) { errorMessage = `Erro ao buscar dados: ${error.message}`; }
    console.error(errorMessage, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
