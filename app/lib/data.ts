
import { db } from "@/app/_lib/prisma";
import { Consultatype, Prisma, Consultas, Anotacoes, Profissional, UnidadeDeSaude } from '@prisma/client';
import { authOptions } from "@/app/_lib/auth";
import { getServerSession } from "next-auth";
import { decryptString } from "@/app/_lib/crypto";
import { Consulta } from "@/app/_components/types";

// Tipo para a consulta com relações, usado para a desencriptação
type ConsultaParaDesencriptar = Consultas & {
    Anotacoes?: Anotacoes[];
    profissional?: Profissional | null;
    unidade?: UnidadeDeSaude | null;
};

// Função para buscar os profissionais de saúde do usuário
export async function fetchProfissionais() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const profissionais = await db.profissional.findMany({
    where: { userId: session.user.id },
    orderBy: { nome: 'asc' },
  });
  return profissionais;
}

// Função para buscar os tipos de consulta
export async function fetchTipos() {
  return Object.values(Consultatype);
}

// Função para descriptografar uma consulta com tipos corretos
const decryptConsulta = (consulta: ConsultaParaDesencriptar): Consulta => {
    const { Anotacoes: anotacoes, ...restOfConsulta } = consulta;
    return {
        ...restOfConsulta,
        motivo: restOfConsulta.motivo ? decryptString(restOfConsulta.motivo) : null,
        Anotacoes: anotacoes?.map((anotacao) => ({
            ...anotacao,
            anotacao: decryptString(anotacao.anotacao),
        })) || [],
        tipodeexame: restOfConsulta.tipodeexame ? decryptString(restOfConsulta.tipodeexame) : null,
    } as unknown as Consulta;
};

interface FetchConsultasParams {
  search?: string;
  tipo?: string;
  profissionalId?: string;
  limit?: number;
  cursor?: string;
}

export async function fetchConsultas(params: FetchConsultasParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { items: [], nextCursor: null };
  }

  const { search, tipo, profissionalId, limit = 8, cursor } = params;
  const userId = session.user.id;

  // 1. A busca no banco de dados filtra APENAS por campos não encriptados
  const where: Prisma.ConsultasWhereInput = { userId };
  if (profissionalId) where.profissionalId = profissionalId;
  if (tipo) where.tipo = tipo as Consultatype;

  // O filtro de "search" foi REMOVIDO daqui

  const consultasDoBanco = await db.consultas.findMany({
    where,
    // Se estivermos a pesquisar, temos de obter todos os registos para filtrar em memória.
    // A paginação será aplicada após a filtragem.
    take: search ? undefined : limit + 1, 
    cursor: search ? undefined : (cursor ? { id: cursor } : undefined),
    include: { profissional: true, unidade: true, Anotacoes: true },
    orderBy: { data: "desc" },
  });

  // 2. Desencriptamos TODOS os resultados obtidos
  const decryptedConsultas = consultasDoBanco.map(decryptConsulta);

  // 3. Aplicamos o filtro de busca em MEMÓRIA (se existir)
  const filteredConsultas = search
    ? decryptedConsultas.filter(c => {
        const searchTerm = search.toLowerCase();
        const motivo = c.motivo?.toLowerCase() || '';
        const tipoExame = c.tipodeexame?.toLowerCase() || '';
        const nomeProfissional = c.profissional?.nome.toLowerCase() || '';
        const nomeUnidade = c.unidade?.nome.toLowerCase() || '';
        
        return motivo.includes(searchTerm) ||
               tipoExame.includes(searchTerm) ||
               nomeProfissional.includes(searchTerm) ||
               nomeUnidade.includes(searchTerm);
      })
    : decryptedConsultas;

  // 4. Aplicamos a lógica de paginação no resultado FINAL (já filtrado)
  let nextCursor: string | null = null;
  let items = filteredConsultas;

  if (!search) { // A lógica de cursor só se aplica se não estivermos a pesquisar
      if (filteredConsultas.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }
  } else { // Se estamos a pesquisar, podemos simplesmente limitar os resultados
      items = filteredConsultas.slice(0, limit);
  }
  
  return {
    items,
    nextCursor,
  };
}
