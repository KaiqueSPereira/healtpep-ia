
import { db } from "@/app/_lib/prisma";
import { Consultatype, Prisma, Consultas, Anotacoes, Profissional, UnidadeDeSaude } from '@prisma/client';
import { authOptions } from "@/app/_lib/auth";
import { getServerSession } from "next-auth";
import { decryptString } from "@/app/_lib/crypto";
import { Consulta } from "@/app/_components/types";
import { logAction } from "@/app/_lib/logger";

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

// Função de diagnóstico SIMPLES para buscar os tipos de consulta
export async function fetchTipos() {
  const tipos = Object.values(Consultatype);
  
  // Log de diagnóstico SIMPLES para garantir que ele seja registrado.
  try {
    const session = await getServerSession(authOptions);
    await logAction({
      userId: session?.user?.id,
      action: "fetch_tipos_simple_diagnosis",
      level: "info",
      message: `fetchTipos foi executada.`,
      details: {
        "Quantidade de tipos encontrados": tipos.length,
      },
      component: "data-lib-simplified",
    });
  } catch (e) {
    // Se até isso falhar, o problema é muito mais profundo, mas pelo menos a app não quebra.
  }

  return tipos;
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

  const where: Prisma.ConsultasWhereInput = { userId };
  if (profissionalId) where.profissionalId = profissionalId;
  
  if (tipo) {
    const foundType = Object.values(Consultatype).find(
        validType => validType.toLowerCase() === tipo.toLowerCase().trim()
    );
    if (foundType) {
        where.tipo = foundType;
    }
  }

  const consultasDoBanco = await db.consultas.findMany({
    where,
    take: search ? undefined : limit + 1, 
    cursor: search ? undefined : (cursor ? { id: cursor } : undefined),
    include: { profissional: true, unidade: true, Anotacoes: true },
    orderBy: { data: "desc" },
  });

  const decryptedConsultas = consultasDoBanco.map(decryptConsulta);

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

  let nextCursor: string | null = null;
  let items = filteredConsultas;

  if (!search) {
      if (filteredConsultas.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }
  } else {
      items = filteredConsultas.slice(0, limit);
  }
  
  return {
    items,
    nextCursor,
  };
}
