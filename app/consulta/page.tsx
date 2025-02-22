
import { Consultatype } from "@prisma/client";
import { db } from "../_lib/prisma";
import AgendamentoItem from "./components/agendamentosItem";



// Função para validar e transformar a string de data para um objeto Date
const parseDate = (dateString: string) => {
  // Formatos possíveis: dd/mm/aaaa, dd/mm/aa, dd/mm, dd
  const regexFullDate = /^(\d{2})\/(\d{2})\/(\d{4})$/; // dd/mm/aaaa
  const regexYearShort = /^(\d{2})\/(\d{2})\/(\d{2})$/; // dd/mm/aa
  const regexMonthDay = /^(\d{2})\/(\d{2})$/; // dd/mm
  const regexDayOnly = /^(\d{2})$/; // dd

  let date: Date | null = null;

  // Verificar e tentar transformar a data
  const matchFullDate = dateString.match(regexFullDate);
  if (matchFullDate) {
    // dd/mm/aaaa
    const [, day, month, year] = matchFullDate;
    date = new Date(`${year}-${month}-${day}`);
  } else {
    const matchShortYear = dateString.match(regexYearShort);
    if (matchShortYear) {
      // dd/mm/aa
      const [, day, month, year] = matchShortYear;
      date = new Date(`20${year}-${month}-${day}`); // Assumindo que "aa" é o século 2000
    } else {
      const matchMonthDay = dateString.match(regexMonthDay);
      if (matchMonthDay) {
        // dd/mm
        const [, day, month] = matchMonthDay;
        date = new Date(
          new Date().getFullYear(),
          parseInt(month) - 1,
          parseInt(day),
        ); // Usa o ano atual
      } else {
        const matchDayOnly = dateString.match(regexDayOnly);
        if (matchDayOnly) {
          // dd
          const [, day] = matchDayOnly;
          date = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            parseInt(day),
          ); // Usa o ano e mês atuais
        }
      }
    }
  }

  return date;
};

interface ConsultaspageProps {
  searchParams: {
    search?: string;
  };
}

const Consultaspage = async ({ searchParams }: ConsultaspageProps) => {
  const search = searchParams.search?.trim() || "";
  let consultas;

  // Verifica se o valor de pesquisa é uma data
  const parsedDate = parseDate(search);

  if (parsedDate) {
    // Se a data for válida, busca a consulta pela data
    consultas = await db.consultas.findMany({
      where: {
        data: {
          equals: parsedDate, // Compara a data exata
        },
      },
    });
  } else {
    // Se não for uma data, faz a pesquisa nos campos de texto
    consultas = await db.consultas.findMany({
      where: {
        OR: [
          { queixas: { startsWith: search, mode: "insensitive" } }, // Alternativa: startsWith
          { tratamento: { endsWith: search, mode: "insensitive" } }, // Alternativa: endsWith
          { tipodeexame: { equals: search, mode: "insensitive" } }, // Alternativa: equals
          { tipo: { equals: search as Consultatype } }, // Voltar ao equals se necessário
          {
            profissional: { nome: { startsWith: search, mode: "insensitive" } },
          }, // Alternativa: startsWith
          { unidade: { nome: { contains: search, mode: "insensitive" } } }, // Alternativa: contains
        ],
      },
    });
  }
  
  

  return (
    <div>
      <h2 className="text-xs font-bold uppercase text-gray-400">
        Resultados para &quot;{search}&quot;
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {consultas.length > 0 ? (
          consultas.map((consulta) => (
            <AgendamentoItem key={consulta.id} consultas={{ ...consulta, data: consulta.data.toISOString() }} />
          ))
        ) : (
          <p>Nenhum resultado encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default Consultaspage;
