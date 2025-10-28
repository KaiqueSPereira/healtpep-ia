// Este arquivo é um Server Component por padrão no App Router.
import { Consultas, Consultatype, Profissional, UnidadeDeSaude } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import AgendamentoItem from "./components/agendamentosItem";
import Header from "@/app/_components/header";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import ConsultaFilter from './components/ConsultaFilter';
// CORREÇÃO: Importa o tipo unificado para fazer o mapeamento
import { AgendamentoUnificado } from "./components/agendamentolist"; 


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
}
interface ConsultaWhereClause {
  profissionalId?: string;
  tipo?: Consultatype;
  AND?: SearchCondition[];
  OR?: SearchCondition[];
  data?: { equals: Date };
}

// CORREÇÃO: Define um tipo mais preciso para as consultas que vêm da base de dados
type ConsultaComRelacoes = Consultas & { 
    profissional: Profissional | null; 
    unidade: UnidadeDeSaude | null; 
};

const Consultaspage = async ({ searchParams }: ConsultaspageProps) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return <div className="p-5">Usuário não autenticado.</div>;
  }

  const userId = session.user.id;

  const search = searchParams.search?.trim() || "";
  const profissionalId = searchParams.profissionalId;
  const tipo = searchParams.tipo;

  const whereClause: ConsultaWhereClause & { userId: string } = { userId };

  if (profissionalId) {
    whereClause.profissionalId = profissionalId;
  }
  if (tipo && Object.values(Consultatype).includes(tipo)) {
    whereClause.tipo = tipo;
  }

  if (search) {
    const parsedDate = parseDate(search);
    if (parsedDate && Object.keys(whereClause).length === 1) { // Verifica se só tem userId
      whereClause.data = { equals: parsedDate };
    } else if (!parsedDate) {
      const searchConditions: SearchCondition[] = [
        { motivo: { contains: search, mode: "insensitive" } },
        { tipodeexame: { contains: search, mode: "insensitive" } },
        { profissional: { nome: { contains: search, mode: "insensitive" } } },
        { Anotacoes: { some: { anotacao: { contains: search, mode: "insensitive" } } } },
        { unidade: { nome: { contains: search, mode: "insensitive" } } },
      ].filter(Boolean) as SearchCondition[];
      
      if (Object.keys(whereClause).length > 1) {
        whereClause.AND = (whereClause.AND || []).concat(searchConditions);
      } else {
        whereClause.OR = searchConditions;
      }
    }
  }

  const consultas: ConsultaComRelacoes[] = await db.consultas.findMany({
    where: whereClause,
    include: {
      profissional: true,
      unidade: true,
    },
    orderBy: {
      data: 'desc',
    }
  });

  const profissionaisList: Profissional[] = await db.profissional.findMany({
    where: { userId: userId },
    orderBy: { nome: 'asc' },
  });

  const tiposConsultaList: Consultatype[] = Object.values(Consultatype);

  return (
    <div>
      <Header />
      <div className="p-5">
        <ConsultaFilter
          professionals={profissionaisList}
          consultationTypes={tiposConsultaList}
        />

        <h2 className="text-xs font-bold uppercase text-gray-400 mt-6 mb-2">
          {search || profissionalId || tipo ?
            `Resultados da Busca:`
            : "Todas as Consultas"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultas && consultas.length > 0 ? (
            consultas.map((consulta) => {
              // CORREÇÃO: Mapeia o objeto 'consulta' para o formato 'AgendamentoUnificado'
              const agendamento: AgendamentoUnificado = {
                id: consulta.id,
                data: consulta.data.toISOString(),
                nomeProfissional: consulta.profissional?.nome || 'Não especificado',
                especialidade: consulta.profissional?.especialidade || 'Clínico Geral',
                local: consulta.unidade?.nome || 'Local não especificado',
                tipo: 'Consulta',
                userId: consulta.userId,
              };

              return (
                <AgendamentoItem
                  key={consulta.id}
                  agendamento={agendamento}
                />
              );
            })
          ) : (
            <p className="text-sm text-gray-500">Nenhum resultado encontrado com os critérios especificados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultaspage;
