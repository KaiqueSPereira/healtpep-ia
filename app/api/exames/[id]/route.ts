import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { decryptString } from "@/app/_lib/crypto";


export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const exame = await prisma.exame.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        profissional: true,
        unidades: true,
        consulta: true,
        resultados: true, // necessário para descriptografar os resultados também
      },
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame não encontrado" },
        { status: 404 },
      );
    }

    const exameDescriptografado = {
      ...exame,
      nome: decryptString(exame.nome),
      nomeArquivo: exame.nomeArquivo ? decryptString(exame.nomeArquivo) : null,
      anotacao: exame.anotacao ? decryptString(exame.anotacao) : null,
      resultados: exame.resultados?.map((r) => ({
        ...r,
        nome: decryptString(r.nome),
        valor: decryptString(r.valor),
        unidade: decryptString(r.unidade ?? ""),
        referencia: decryptString(r.referencia ?? ""),
      })),
    };

    return NextResponse.json({ exame: exameDescriptografado }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exame:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
