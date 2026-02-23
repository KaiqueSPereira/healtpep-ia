
import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { safeDecrypt } from "@/app/_lib/crypto";

// Normaliza a string para comparação
const normalizeString = (str: string | null) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Busca todos os resultados de exames
    const allBiomarkers = await prisma.resultadoExame.findMany({
      select: {
        nome: true,
      },
    });

    // Descriptografa e normaliza os nomes
    const decryptedBiomarkers = allBiomarkers.map((b) => safeDecrypt(b.nome));

    // Cria um conjunto de nomes normalizados e únicos
    const uniqueNormalizedNames = new Set(
      decryptedBiomarkers.map(name => normalizeString(name))
    );
    
    // Remove o nome em branco, se existir
    uniqueNormalizedNames.delete('');

    return NextResponse.json(Array.from(uniqueNormalizedNames));

  } catch (error) {
    console.error("Erro ao buscar biomarcadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar biomarcadores." },
      { status: 500 }
    );
  }
}
