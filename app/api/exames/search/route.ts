
import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { safeDecrypt } from "@/app/_lib/crypto";

// Handles GET requests to /api/exames/search
export async function GET(request: Request) {
  // Authenticate the user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract the search query 'q' from the request URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();

  // Return an empty array if no query is provided
  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // 1. Fetch all exam records from the database
    const allExames = await prisma.resultadoExame.findMany({
      select: {
        id: true,
        nome: true,
        unidade: true,
        referencia: true,
      },
    });

    // 2. Decrypt all exams in memory
    const decryptedExames = allExames.map((exame) => ({
      id: exame.id,
      nome: safeDecrypt(exame.nome),
      unidade: safeDecrypt(exame.unidade || ""),
      referencia: safeDecrypt(exame.referencia || ""),
    }));

    // 3. Filter the decrypted exams
    const filteredExames = decryptedExames.filter((exame) =>
      exame.nome.toLowerCase().includes(query)
    );

    // 4. Remove duplicates from the filtered results
    const uniqueExames = [];
    const seen = new Set();
    for (const exame of filteredExames) {
      const key = `${exame.nome}|${exame.unidade}|${exame.referencia}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueExames.push(exame);
      }
    }

    // 5. Limit the results to the top 10 matches
    const limitedResults = uniqueExames.slice(0, 10);

    return NextResponse.json(limitedResults);

  } catch (error) {
    // Log any server-side errors
    console.error("Erro ao buscar exames:", error);
    // Return a generic error response
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar exames" },
      { status: 500 }
    );
  }
}
