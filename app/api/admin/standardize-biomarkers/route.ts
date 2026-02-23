
import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt } from "@/app/_lib/crypto";
import { standardizeBiomarkerName } from "@/app/_lib/biomarkerUtils";
import { logErrorToDb } from "@/app/_lib/logger";

/**
 * Rota de API para FORÇAR a padronização de TODOS os nomes de biomarcadores no banco de dados.
 * Esta rota MODIFICA o banco de dados.
 */
export async function POST() {
    const componentName = "API POST /api/admin/standardize-biomarkers";
    console.log("Iniciando a RE-PADRONIZAÇÃO forçada de todos os biomarcadores...");

    try {
        const todosResultados = await prisma.resultadoExame.findMany();
        
        let atualizadosCount = 0;

        for (const resultado of todosResultados) {
            if (!resultado.nome) {
                continue; // Pula resultados sem nome
            }

            try {
                const nomeDecriptado = safeDecrypt(resultado.nome);
                if (!nomeDecriptado) {
                    // Loga ou marca exames que não puderam ser decriptados, se necessário
                    continue;
                }

                const nomePadronizado = standardizeBiomarkerName(nomeDecriptado);

                // Compara o nome decriptado original com o novo nome padronizado
                if (nomeDecriptado.trim() !== nomePadronizado.trim()) {
                    const nomeEncriptado = safeEncrypt(nomePadronizado);
                    if (nomeEncriptado) {
                        await prisma.resultadoExame.update({
                            where: { id: resultado.id },
                            data: { nome: nomeEncriptado },
                        });
                        atualizadosCount++;
                    }
                }
            } catch (error) {
                // Ignora erros em um único item para não parar todo o processo
                console.error(`Erro ao processar o resultado ${resultado.id}:`, error);
            }
        }

        const mensagem = `Re-padronização concluída. ${atualizadosCount} de ${todosResultados.length} biomarcadores foram atualizados para o novo padrão.`;
        console.log(mensagem);
        
        return NextResponse.json({ message: mensagem });

    } catch (error) {
        console.error("Erro crítico durante a re-padronização de biomarcadores:", error);
        await logErrorToDb(
            "Erro crítico na re-padronização de biomarcadores", 
            error instanceof Error ? error.stack || error.message : String(error), 
            componentName
        );
        return NextResponse.json({ error: "Ocorreu um erro inesperado durante a atualização." }, { status: 500 });
    }
}
