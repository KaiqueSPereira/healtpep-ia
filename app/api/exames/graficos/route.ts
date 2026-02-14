import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { safeDecrypt } from "@/app/_lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exames = await prisma.exame.findMany({
      where: { userId },
      include: { 
        resultados: true 
      },
      orderBy: { dataExame: 'asc' },
    });

    // Decrypt the sensitive fields before sending them to the client
    const decryptedExames = exames.map(exame => {
        const decryptedResultados = exame.resultados.map(resultado => {
            const nome = safeDecrypt(resultado.nome);
            const valor = safeDecrypt(resultado.valor);
            return {
                ...resultado,
                nome: nome !== null ? nome : resultado.nome, // fallback to original if decryption fails
                valor: valor !== null ? valor : resultado.valor, // fallback to original if decryption fails
            };
        });

        return {
            ...exame,
            resultados: decryptedResultados
        };
    });
    
    return NextResponse.json(decryptedExames, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar dados de exames para gráficos:", error);
    return NextResponse.json({ error: "Erro interno ao processar dados para gráficos." }, { status: 500 });
  }
}
