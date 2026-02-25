
import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../_lib/auth"; // Corrected path
import { safeDecrypt } from "@/app/_lib/crypto";

// Handles GET requests to /api/exames/search
export async function GET(request: Request) {
  // 1. Authenticate the user session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract and validate the search query
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // 3. EFFICIENT FETCH: Get results ONLY for the current user, ordered by most recent
    const userExamResults = await prisma.resultadoExame.findMany({
      where: {
        exame: {
          userId: session.user.id,
        },
      },
      orderBy: {
        exame: {
          dataExame: 'desc',
        },
      },
      select: {
        nome: true,
        unidade: true,
        referencia: true,
      },
    });

    // 4. Decrypt the user's results
    const decryptedResults = userExamResults.map((result) => ({
      nome: safeDecrypt(result.nome),
      unidade: safeDecrypt(result.unidade || ""),
      referencia: safeDecrypt(result.referencia || ""),
    }));

    // 5. SMART DE-DUPLICATION: Filter and get unique names (most recent entry wins)
    const uniqueExamsMap = new Map();
    for (const result of decryptedResults) {
      // Check if the name matches the query and if we haven't seen this name before
      if (result.nome.toLowerCase().includes(query) && !uniqueExamsMap.has(result.nome)) {
        uniqueExamsMap.set(result.nome, result);
      }
    }

    // 6. Convert map to array and limit results
    const finalResults = Array.from(uniqueExamsMap.values()).slice(0, 10);

    return NextResponse.json(finalResults);

  } catch (error) {
    console.error("Erro ao buscar nomes de exames:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar nomes de exames" },
      { status: 500 }
    );
  }
}
