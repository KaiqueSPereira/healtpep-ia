
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
    } as unknown as Consulta; // Usar 'as unknown as Consulta' para garantir a compatibilidade
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

  const where: Prisma.ConsultasWhereInput = { userId }; // Correção: de let para const
  if (profissionalId) where.profissionalId = profissionalId;
  if (tipo) where.tipo = tipo as Consultatype;

  if (search) {
    where.OR = [
      { motivo: { contains: search, mode: "insensitive" } },
      { tipodeexame: { contains: search, mode: "insensitive" } },
      { profissional: { nome: { contains: search, mode: "insensitive" } } },
      { unidade: { nome: { contains: search, mode: "insensitive" } } },
    ];
  }

  const consultas = await db.consultas.findMany({
    where,
    take: limit + 1, 
    cursor: cursor ? { id: cursor } : undefined,
    include: { profissional: true, unidade: true, Anotacoes: true }, // Anotacoes incluídas para desencriptação
    orderBy: { data: "desc" },
  });

  let nextCursor: string | null = null;
  if (consultas.length > limit) {
    const nextItem = consultas.pop();
    nextCursor = nextItem!.id;
  }

  const decryptedConsultas = consultas.map(decryptConsulta);

  return {
    items: decryptedConsultas,
    nextCursor,
  };
}
