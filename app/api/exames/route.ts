
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
                // Adiciona a contagem de anexos para cada exame
                _count: {
                    select: { anexos: true },
                }
            },
            orderBy: {
                dataExame: 'desc',
            },
        });

        // A descriptografia continua a mesma, pois _count não é criptografado
        const decryptedExames = exames.map(exame => {
            const decryptedProfissional = exame.profissional && exame.profissional.nome
                ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) }
                : exame.profissional;

            const decryptedUnidade = exame.unidades && exame.unidades.nome
                ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) }
                : exame.unidades;

            const decryptedResultados = exame.resultados.map(resultado => {
                return {
                    ...resultado,
                    nome: safeDecrypt(resultado.nome),
                    valor: safeDecrypt(resultado.valor),
                    unidade: resultado.unidade ? safeDecrypt(resultado.unidade) : null,
                    referencia: resultado.referencia ? safeDecrypt(resultado.referencia) : null,
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
