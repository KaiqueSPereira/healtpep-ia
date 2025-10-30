import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { decryptString, encryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from '@prisma/client';

// Tipos para as funções de descriptografia
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
}

const consultaWithRelations = Prisma.validator<Prisma.ConsultasDefaultArgs>()({
  include: {
    profissional: true,
    unidade: true,
    Anotacoes: { orderBy: { createdAt: 'desc' } },
    anexos: true,
    Exame: { 
        include: { profissional: true, unidades: true }, 
        orderBy: { dataExame: 'desc' } 
    },
    condicoes: true, 
    consultaOrigem: {
      include: {
        Anotacoes: { orderBy: { createdAt: 'desc' } },
        anexos: true,
        Exame: {
          include: {
            profissional: true,
            unidades: true
          },
          orderBy: { dataExame: 'desc' }
        }
      }
    },
    retornos: { 
        include: {
            profissional: true,
            unidade: true,
        },
        orderBy: { data: 'desc' } 
    },
  },
});

interface ConsultaParams {
  params: { consultaId: string };
}

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

export async function GET(_request: Request, { params }: ConsultaParams) {
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

    const responseData = {
      ...consulta,
      motivo: consulta.motivo ? decryptString(consulta.motivo) : null,
      tipodeexame: consulta.tipodeexame ? decryptString(consulta.tipodeexame) : null,
      Anotacoes: decryptAnotacoes(consulta.Anotacoes as AnotacaoParaDescriptografar[]),
      Exame: decryptExames(consulta.Exame as ExameParaDescriptografar[]),
      
      consultaOrigem: consulta.consultaOrigem ? {
        ...consulta.consultaOrigem,
        motivo: consulta.consultaOrigem.motivo ? decryptString(consulta.consultaOrigem.motivo) : null,
        Anotacoes: decryptAnotacoes(consulta.consultaOrigem.Anotacoes as AnotacaoParaDescriptografar[]),
        Exame: decryptExames(consulta.consultaOrigem.Exame as ExameParaDescriptografar[])
      } : null,
      
      consultasDeRetorno: consulta.retornos,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { motivo, tipodeexame, data, ...rest } = body;

    const dataToUpdate: Prisma.ConsultasUpdateInput = { ...rest };

    if (motivo !== undefined) {
        if (!motivo) {
            return NextResponse.json({ error: "O campo 'motivo' é obrigatório e não pode ser vazio." }, { status: 400 });
        }
        dataToUpdate.motivo = encryptString(motivo);
    }

    if (tipodeexame !== undefined) {
        if (!tipodeexame) {
            return NextResponse.json({ error: "O campo 'tipodeexame' é obrigatório e não pode ser vazio." }, { status: 400 });
        }
        dataToUpdate.tipodeexame = encryptString(tipodeexame);
    }

    if (data) {
      dataToUpdate.data = new Date(data);
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

export async function DELETE(_request: Request, { params }: ConsultaParams) {
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