import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt } from "@/app/_lib/crypto";

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: "O ID do usuário é obrigatório." }, { status: 400 });
    }

    try {
        const exames = await prisma.exame.findMany({
            where: {
                userId: userId,
            },
            include: {
                profissional: true,
                unidades: true,
                resultados: true,
            },
            orderBy: {
                dataExame: 'desc',
            },
        });

        // Decrypt all sensitive data before sending to the client
        const decryptedExames = exames.map(exame => {
            const decryptedProfissional = exame.profissional && exame.profissional.nome
                ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) }
                : exame.profissional;

            const decryptedUnidade = exame.unidades && exame.unidades.nome
                ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) }
                : exame.unidades;

            const decryptedResultados = exame.resultados.map(resultado => {
                const nome = resultado.nome ? safeDecrypt(resultado.nome) : null;
                const valor = resultado.valor ? safeDecrypt(resultado.valor) : null;
                const unidade = resultado.unidade ? safeDecrypt(resultado.unidade) : null;
                const valorReferencia = resultado.referencia ? safeDecrypt(resultado.referencia) : null;

                return {
                    ...resultado,
                    nome,
                    valor,
                    unidade,
                    valorReferencia,
                };
            });
            
            const decryptedTipo = exame.tipo ? safeDecrypt(exame.tipo) : null;

            return {
                ...exame,
                tipo: decryptedTipo,
                profissional: decryptedProfissional,
                unidades: decryptedUnidade,
                resultados: decryptedResultados,
            };
        });

        return NextResponse.json(decryptedExames, { status: 200 });

    } catch (error) {
        console.error("Erro ao buscar exames:", error);
        return NextResponse.json({ error: "Erro interno do servidor ao buscar exames." }, { status: 500 });
    }
}
