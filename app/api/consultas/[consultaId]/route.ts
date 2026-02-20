import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { decryptString, encryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Prisma, Consultatype } from '@prisma/client';

// Tipos
interface AnotacaoParaDescriptografar {
  id: string;
  anotacao: string;
  createdAt: Date;
}

interface ExameParaDescriptografar {
    id: string;
    tipo: string;
    anotacao: string;
    dataExame: Date;
    profissional?: { nome: string } | null; 
    unidades?: { nome: string } | null;
}

interface HistoricoItem {
  id: string;
  tipo: Consultatype;
  motivo: string | null;
  data: Date;
  profissional: { nome: string } | null;
  unidade: { nome: string } | null;
}

// Validador Prisma com relações existentes
const consultaWithRelations = Prisma.validator<Prisma.ConsultasDefaultArgs>()({
  include: {
    condicoes: true,
    profissional: true,
    unidade: { include: { endereco: true } },
    Anotacoes: { orderBy: { createdAt: 'desc' } },
    anexos: true,
    Exame: { 
        include: { profissional: true, unidades: { include: { endereco: true } } }, 
        orderBy: { dataExame: 'desc' } 
    },
    consultaOrigem: {
      include: {
        Anotacoes: { orderBy: { createdAt: 'desc' } },
        anexos: true,
        Exame: {
          include: { profissional: true, unidades: { include: { endereco: true } } },
          orderBy: { dataExame: 'desc' }
        }
      }
    },
    retornos: { 
        include: {
            profissional: true,
            unidade: { include: { endereco: true } },
        },
        orderBy: { data: 'desc' } 
    },
  },
});

const getUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
};

const decryptExames = (exames: ExameParaDescriptografar[] | undefined) => {
    if (!exames) return [];
    return exames.map(exame => ({
        ...exame,
        tipo: exame.tipo ? decryptString(exame.tipo) : undefined,
        anotacao: exame.anotacao ? decryptString(exame.anotacao) : undefined,
        dataExame: new Date(exame.dataExame).toISOString(), 
    }));
};

const decryptAnotacoes = (anotacoes: AnotacaoParaDescriptografar[] | undefined) => {
    if (!anotacoes) return [];
    return anotacoes.map(anotacao => ({
        ...anotacao,
        anotacao: decryptString(anotacao.anotacao),
    }));
};

export async function GET(request: Request, { params }: { params: { consultaId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const consulta = await db.consultas.findUnique({
      where: { id: params.consultaId, userId: userId },
      ...consultaWithRelations,
    });

    if (!consulta) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    let historicoTratamento: HistoricoItem[] | null = null;

    if (consulta.condicoes && consulta.condicoes.length > 0) {
      const condicaoId = consulta.condicoes[0].id;

      const consultasDoTratamento = await db.consultas.findMany({
        where: {
          userId,
          condicoes: {
            some: {
              id: condicaoId,
            },
          },
        },
        include: {
          profissional: true,
          unidade: true,
        },
        orderBy: {
          data: 'asc',
        },
      });

      historicoTratamento = consultasDoTratamento.map(c => ({
        id: c.id,
        tipo: c.tipo,
        motivo: c.motivo ? decryptString(c.motivo) : null,
        data: c.data,
        profissional: c.profissional ? { nome: c.profissional.nome } : null,
        unidade: c.unidade ? { nome: c.unidade.nome } : null,
      }));
    }

    const responseData = {
      id: consulta.id,
      userId: consulta.userId,
      tipo: consulta.tipo,
      data: consulta.data,
      motivo: consulta.motivo ? decryptString(consulta.motivo) : null,
      unidade: consulta.unidade,
      profissional: consulta.profissional,
      Anotacoes: decryptAnotacoes(consulta.Anotacoes as AnotacaoParaDescriptografar[]),
      Exame: decryptExames(consulta.Exame as ExameParaDescriptografar[]),
      tratamento: consulta.condicoes,
      anexos: consulta.anexos,
      consultaOrigem: consulta.consultaOrigem ? {
        ...consulta.consultaOrigem,
        motivo: consulta.consultaOrigem.motivo ? decryptString(consulta.consultaOrigem.motivo) : null,
        Anotacoes: decryptAnotacoes(consulta.consultaOrigem.Anotacoes as AnotacaoParaDescriptografar[]),
        Exame: decryptExames(consulta.consultaOrigem.Exame as ExameParaDescriptografar[])
      } : null,
      consultasDeRetorno: consulta.retornos,
      historicoTratamento: historicoTratamento,
      tipodeexame: consulta.tipodeexame ? decryptString(consulta.tipodeexame) : null,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { consultaId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { motivo, tipodeexame, data, profissionalId, unidadeId, consultaOrigemId, ...rest } = body;

    const dataToUpdate: Prisma.ConsultasUpdateInput = { ...rest };

    if (motivo !== undefined) {
        // Correção Definitiva: Verifica se o resultado da encriptação não é nulo antes de atribuir.
        const encryptedMotivo = encryptString(motivo || '');
        if (encryptedMotivo !== null) {
            dataToUpdate.motivo = encryptedMotivo;
        }
    }

    if (tipodeexame !== undefined) {
        // Aplicando a mesma lógica segura para o campo tipodeexame.
        const encryptedTipodeexame = encryptString(tipodeexame || '');
        if (encryptedTipodeexame !== null) {
            dataToUpdate.tipodeexame = encryptedTipodeexame;
        }
    }
    
    if (profissionalId) {
        dataToUpdate.profissional = { connect: { id: profissionalId } };
    } else {
        dataToUpdate.profissional = { disconnect: true };
    }

    if (unidadeId) {
        dataToUpdate.unidade = { connect: { id: unidadeId } };
    } else {
        dataToUpdate.unidade = { disconnect: true };
    }

    if (data) {
      dataToUpdate.data = new Date(data);
    }

    if (consultaOrigemId) {
      dataToUpdate.consultaOrigem = { connect: { id: consultaOrigemId } };
    } else {
      dataToUpdate.consultaOrigem = { disconnect: true };
    }

    const consultaAtualizada = await db.consultas.update({
      where: { id: params.consultaId, userId: userId },
      data: dataToUpdate,
    });

    return NextResponse.json(consultaAtualizada);

  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json({ error: "Erro ao atualizar consulta" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { consultaId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    await db.consultas.delete({ where: { id: params.consultaId, userId: userId } });

    return NextResponse.json({ message: "Consulta deletada com sucesso" }, { status: 200 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Não é possível apagar. Existem consultas de retorno vinculadas a esta consulta.' }, { status: 409 });
    }
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json({ error: "Erro ao deletar consulta" }, { status: 500 });
  }
}
