import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { decryptString, encryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Anotacoes, Exame, Profissional, UnidadeDeSaude, Prisma } from '@prisma/client';

// 1. Helper do Prisma para obter o tipo de payload completo
const consultaWithRelations = Prisma.validator<Prisma.ConsultasDefaultArgs>()({
  include: {
    profissional: true,
    unidade: true,
    Anotacoes: true,
    anexos: true,
    Exame: { include: { profissional: true, unidades: true } },
    condicoes: true, // Corrigido de 'tratamento' para 'condicoes'
    consultaOrigem: { select: { id: true, data: true, tipo: true } },
    retornos: { select: { id: true, data: true, tipo: true }, orderBy: { data: 'asc' } },
  },
});

// 2. Define um tipo TypeScript para a consulta completa
type FullConsulta = Prisma.ConsultasGetPayload<typeof consultaWithRelations>;

interface ConsultaParams {
  params: { consultaId: string };
}

type ExameWithRelations = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
};

const getUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
};

// 📌 GET - VERSÃO FINAL CORRIGIDA
export async function GET(_request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // 3. Usa a busca com a cláusula 'include' corrigida
    const consulta: FullConsulta | null = await db.consultas.findUnique({
      where: { id: params.consultaId, userId: userId },
      ...consultaWithRelations, // Usa o validador para garantir a inclusão e a tipagem
    });

    if (!consulta) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    // 4. Constrói a resposta a partir do objeto 'consulta' agora CORRETAMENTE TIPADO
    const responseData = {
      id: consulta.id,
      tipo: consulta.tipo,
      data: consulta.data,
      // O campo 'status' não existe no schema, foi removido.
      motivo: consulta.motivo ? decryptString(consulta.motivo) : null,
      tipodeexame: consulta.tipodeexame ? decryptString(consulta.tipodeexame) : null,
      
      profissional: consulta.profissional,
      unidade: consulta.unidade,
      condicoes: consulta.condicoes, // Corrigido

      Anotacoes: (consulta.Anotacoes || []).map((anotacao: Anotacoes) => ({ // Tipagem explícita
        ...anotacao,
        anotacao: decryptString(anotacao.anotacao),
      })),
      
      anexos: consulta.anexos || [],
      
      Exame: (consulta.Exame || []).map((exame: ExameWithRelations) => ({ // Tipagem explícita
        ...exame,
        tipo: exame.tipo ? decryptString(exame.tipo) : exame.tipo,
        anotacao: exame.anotacao ? decryptString(exame.anotacao) : exame.anotacao,
        dataExame: new Date(exame.dataExame).toISOString(),
      })),

      consultaOrigem: consulta.consultaOrigem,
      retornos: consulta.retornos,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      console.error("API ERRO: Tentativa de serializar uma estrutura circular em JSON.", error);
      return NextResponse.json({ error: "Erro interno ao processar dados relacionados." }, { status: 500 });
    }
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { motivo, tipodeexame, ...rest } = body;

    const consultaAtualizada = await db.consultas.update({
      where: { id: params.consultaId, userId: userId },
      data: {
        ...rest,
        ...(motivo !== undefined && { motivo: motivo ? encryptString(motivo) : null }),
        ...(tipodeexame !== undefined && { tipodeexame: tipodeexame ? encryptString(tipodeexame) : null }),
      },
    });

    return NextResponse.json(consultaAtualizada);

  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json({ error: "Erro ao atualizar consulta" }, { status: 500 });
  }
}

// 📌 DELETE - Deletar uma consulta
export async function DELETE(_request: Request, { params }: ConsultaParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    await db.consultas.delete({ where: { id: params.consultaId, userId: userId } });

    return NextResponse.json({ message: "Consulta deletada com sucesso" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json({ error: "Erro ao deletar consulta" }, { status: 500 });
  }
}
