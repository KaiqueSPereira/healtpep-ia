import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { decryptString } from "@/app/_lib/crypto";

type Resultado = {
  id: string;
  exameId: string;
  nome: string;
  valor: string;
  unidade?: string | null;
  referencia?: string | null;
};

type Exame = {
  id: string;
  userId: string;
  nome: string;
  dataExame: Date;
  anotacao?: string | null;
  nomeArquivo?: string | null;
  profissionalId?: string | null;
  unidadeSaudeId?: string | null;
  consultaId?: string | null;
  resultados: Resultado[];
};


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exames = await prisma.exame.findMany({
      where: {
        userId,
      },
      include: {
        resultados: true,
      },
      orderBy: {
        dataExame: 'asc', // Alterado para ordem descendente
      },
    });

    const decryptedExames = exames.map(exame => ({
      ...exame,
      nome: decryptString(exame.nome),
      anotacao: exame.anotacao ? decryptString(exame.anotacao) : null,
      nomeArquivo: exame.nomeArquivo ? decryptString(exame.nomeArquivo) : null,
      resultados: exame.resultados.map(resultado => ({
        ...resultado,
        nome: decryptString(resultado.nome),
        valor: decryptString(resultado.valor),
        unidade: resultado.unidade ? decryptString(resultado.unidade) : null,
        referencia: resultado.referencia ? decryptString(resultado.referencia) : null,
      })),
    }));

    return NextResponse.json(decryptedExames, { status: 200 }); // Retornando diretamente o array
  } catch (error) {
    console.error("Erro ao buscar exames para gráficos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}