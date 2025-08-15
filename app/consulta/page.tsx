// Este arquivo é um Server Component por padrão no App Router.

import { Consultatype, Consultas, Profissional } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import AgendamentoItem from "./components/agendamentosItem";
import Header from "@/app/_components/header";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import ConsultaFilter from './components/ConsultaFilter';


const parseDate = (dateString: string) => {
  const regexFullDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const regexYearShort = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const regexMonthDay = /^(\d{2})\/(\d{2})$/;
  const regexDayOnly = /^(\d{2})$/;

  let date: Date | null = null;

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
        date = new Date(
          new Date().getFullYear(),
          parseInt(month) - 1,
          parseInt(day),
        );
      } else {
        const matchDayOnly = dateString.match(regexDayOnly);
        if (matchDayOnly) {
          const [, day] = matchDayOnly;
          date = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            parseInt(day),
          );
        }
      }
    }
  }

  if (date && isNaN(date.getTime())) {
    return null;
  }

  return date;
};


interface ConsultaspageProps {
  searchParams: {
    search?: string;
    profissionalId?: string;
    tipo?: Consultatype;
  };
}
interface SearchCondition {
  motivo?: { contains: string; mode: "insensitive" };
  tipodeexame?: { contains: string; mode: "insensitive" };
  profissional?: { nome: { contains: string; mode: "insensitive" } };
  Anotacoes?: { some: { anotacao: { contains: string; mode: "insensitive" } } } | undefined;
  unidade?: { nome: { contains: string; mode: "insensitive" } };
  // Adicione outras possíveis condições aqui se houver
}
interface ConsultaWhereClause {
  profissionalId?: string;
  tipo?: Consultatype;
  AND?: SearchCondition[];
  OR?: SearchCondition[];
  data?: { equals: Date };
  // Adicione outras propriedades que whereClause possa receber
}

const Consultaspage = async ({ searchParams }: ConsultaspageProps) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    // Handle unauthorized access - you might want to redirect or show a message
    return <div className="p-5">Usuário não autenticado.</div>;
  }

  const userId = session.user.id;

  const search = searchParams.search?.trim() || "";
  const profissionalId = searchParams.profissionalId;
  const tipo = searchParams.tipo;

  const whereClause: ConsultaWhereClause = {};

  if (profissionalId) {
    whereClause.profissionalId = profissionalId;
  }
  if (tipo && Object.values(Consultatype).includes(tipo)) {
    whereClause.tipo = tipo;
  }

  if (search) {
    const parsedDate = parseDate(search);
    if (parsedDate && Object.keys(whereClause).length === 0) {
      whereClause.data = { equals: parsedDate };
    } else if (!parsedDate) {
      const searchConditions: SearchCondition[] = [
        { motivo: { contains: search, mode: "insensitive" as const } as { contains: string; mode: "insensitive" } },
        { tipodeexame: { contains: search, mode: "insensitive" as const } as { contains: string; mode: "insensitive" } },
        {
          profissional: { nome: { contains: search, mode: "insensitive" as const } } as { nome: { contains: string; mode: "insensitive" } },
        },
        { Anotacoes: { some: { anotacao: { contains: search, mode: "insensitive" as const } } } as { some: { anotacao: { contains: string; mode: "insensitive" } } } | undefined },
        { unidade: { nome: { contains: search, mode: "insensitive" as const } } as { nome: { contains: string; mode: "insensitive" } }, },
      ].filter(Boolean);
      if (Object.keys(whereClause).length > 0) {
        whereClause.AND = searchConditions;
      } else {
        whereClause.OR = searchConditions;
      }
    }
  }

  const consultas: Consultas[] = await db.consultas.findMany({
    where: { ...whereClause, userId: userId }, // Filter by logged-in user ID
    include: {
      profissional: true,
      unidade: true,
      // Anotacoes: true, // No need to include Anotacoes here to filter on them
    },
    orderBy: {
      data: 'desc',
    }
  });

  const profissionaisList: Profissional[] = await db.profissional.findMany({
    where: { userId: userId }, // <-- Adicionado filtro pelo userId do usuário logado
    orderBy: { nome: 'asc' },
  });

  const tiposConsultaList: Consultatype[] = Object.values(Consultatype);


  return (
    <div>
      <Header />

      <ConsultaFilter
        professionals={profissionaisList} // Agora passará a lista filtrada
        consultationTypes={tiposConsultaList}
      />

      <h2 className="text-xs font-bold uppercase text-gray-400 mt-4">
        {search || profissionalId || tipo ?
          `Resultados da Busca:`
          : "Todas as Consultas"}
      </h2>

      {(search || profissionalId || tipo) && (
        <p className="text-sm text-gray-500 mb-4">
          {search && `Busca por texto: "${search}"`}
          {profissionalId && ` | Profissional ID: ${profissionalId}`}
          {tipo && ` | Tipo: ${tipo}`}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consultas && consultas.length > 0 ? (
          consultas.map((consulta) => (
            <AgendamentoItem
              key={consulta.id}
              consultas={consulta}
            />
          ))
        ) : (
          <p>Nenhum resultado encontrado com os critérios especificados.</p>
        )}
      </div>
    </div>
  );
};

export default Consultaspage;
