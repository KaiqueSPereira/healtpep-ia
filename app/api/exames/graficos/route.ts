import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt } from "@/app/_lib/crypto";
import { Exame, ResultadoExame } from "@prisma/client";
import { logErrorToDb } from "@/app/_lib/logger";

type ExameComResultados = Exame & {
    resultados: ResultadoExame[];
};

export async function GET(request: NextRequest) {
    const componentName = "API GET /api/exames/graficos";
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: "O ID do usuário é obrigatório." }, { status: 400 });
    }

    try {
        const exames: ExameComResultados[] = await prisma.exame.findMany({
            where: { userId: userId },
            include: {
                resultados: true
            },
            orderBy: { dataExame: 'asc' },
        });

        const decryptedExames = exames.map((exame: ExameComResultados) => {
            const decryptedResultados = exame.resultados
                .map((resultado: ResultadoExame) => {
                    if (resultado.nome === null || resultado.valor === null) {
                        return null;
                    }

                    const nome = safeDecrypt(resultado.nome);
                    const valor = safeDecrypt(resultado.valor);
                    const categoria = resultado.categoria ? safeDecrypt(resultado.categoria) : "Sem Categoria"; // Corrigido: Descriptografa e fornece um padrão

                    if (nome === null || valor === null) {
                        return null;
                    }

                    return {
                        id: resultado.id,
                        nome,
                        valor,
                        categoria, // Corrigido: Inclui a categoria na resposta
                    };
                })
                .filter(Boolean as unknown as <T>(value: T | null | undefined) => value is T);
            
            const decryptedTipo = exame.tipo ? safeDecrypt(exame.tipo) : null;

            return {
                id: exame.id,
                dataExame: exame.dataExame,
                tipo: decryptedTipo,
                resultados: decryptedResultados,
            };
        });
        
        return NextResponse.json(decryptedExames, { status: 200 });

    } catch (error) {
        await logErrorToDb(
            "Erro ao buscar dados de exames para gráficos.",
            error instanceof Error ? error.stack || error.message : String(error),
            componentName
        );
        return NextResponse.json({ error: "Erro interno ao processar dados para gráficos." }, { status: 500 });
    }
}
