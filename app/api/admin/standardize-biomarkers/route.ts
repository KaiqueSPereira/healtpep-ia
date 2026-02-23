
import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt } from "@/app/_lib/crypto";
import { standardizeBiomarkerName } from "@/app/_lib/biomarkerUtils";
import { logErrorToDb } from "@/app/_lib/logger";

/**
 * Rota de API para padronizar todos os nomes de biomarcadores existentes no banco de dados.
 * ATENÇÃO: Esta é uma operação de migração de dados e deve ser usada com cuidado.
 */
export async function POST() {
    const componentName = "API POST /api/admin/standardize-biomarkers";
    console.log("Iniciando a padronização de todos os biomarcadores...");

    try {
        const todosResultados = await prisma.resultadoExame.findMany();
        let atualizadosCount = 0;

        const updates = [];

        for (const resultado of todosResultados) {
            if (!resultado.nome) continue;

            try {
                const nomeDecriptado = safeDecrypt(resultado.nome);
                if (!nomeDecriptado) continue;

                const nomePadronizado = standardizeBiomarkerName(nomeDecriptado);

                if (nomeDecriptado.trim().toUpperCase() !== nomePadronizado.trim().toUpperCase()) {
                    updates.push(
                        prisma.resultadoExame.update({
                            where: { id: resultado.id },
                            data: { nome: safeEncrypt(nomePadronizado) },
                        })
                    );
                    atualizadosCount++;
                }
            } catch (decryptError) {
                console.error(`Erro ao decriptar ou processar resultado ${resultado.id}. Ignorando...`, decryptError);
                // Opcional: Logar este erro específico se necessário
                await logErrorToDb(`Falha ao processar o resultado ${resultado.id} durante a padronização`, decryptError instanceof Error ? decryptError.message : String(decryptError), componentName);
            }
        }

        if (updates.length > 0) {
            console.log(`Encontrados ${updates.length} biomarcadores para atualizar. Executando transação...`);
            await prisma.$transaction(updates);
            console.log("Transação concluída com sucesso.");
        }

        const mensagem = `Padronização concluída. ${atualizadosCount} de ${todosResultados.length} biomarcadores foram atualizados.`;
        console.log(mensagem);
        return NextResponse.json({ message: mensagem });

    } catch (error) {
        console.error("Erro crítico durante a execução da padronização de biomarcadores:", error);
        await logErrorToDb(
            "Erro crítico na padronização de biomarcadores", 
            error instanceof Error ? error.stack || error.message : String(error), 
            componentName
        );
        return NextResponse.json({ error: "Ocorreu um erro inesperado durante a padronização." }, { status: 500 });
    }
}
