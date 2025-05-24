import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { decrypt } from "@/app/_lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exames = await prisma.exame.findMany({
      where: { userId },
      orderBy: { dataExame: "desc" },
      include: { resultados: true },
      take: 100, // pode buscar mais para garantir variedade
    });

    const sugestoesMap = new Map<
      string,
      {
        nome: string;
        resultados: { valor: string; valorReferencia: string }[];
        unidades: { nome: string };
      }
    >();

    for (const exame of exames) {
      const r = exame.resultados[0];
      if (!r) continue;

      const nome = decrypt(Buffer.from(r.nome, "hex")).toString();
      if (sugestoesMap.has(nome)) continue;

      sugestoesMap.set(nome, {
        nome,
        resultados: [
          {
            valor: decrypt(Buffer.from(r.valor, "hex")).toString(),
            valorReferencia: decrypt(
              Buffer.from(r.referencia || "", "hex"),
            ).toString(),
          },
        ],
        unidades: {
          nome: decrypt(Buffer.from(r.unidade || "", "hex")).toString(),
        },
      });
    }

    const sugestoes = Array.from(sugestoesMap.values());
    return NextResponse.json(sugestoes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar exames sugeridos." },
      { status: 500 },
    );
  }
}
