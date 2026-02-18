
import { prisma } from '@/app/_lib/prisma';

/**
 * Grava um erro diretamente no banco de dados.
 * Esta é a função central para logging e deve ser usada por outras APIs no servidor.
 * @param message A mensagem principal do erro.
 * @param errorDetails O objeto de erro, stack trace ou detalhes técnicos.
 * @param component O nome do componente ou da API onde o erro ocorreu.
 */
export async function logErrorToDb(message: string, errorDetails: object | string, component: string) {
    try {
        await prisma.errorLog.create({
            data: {
                message: message,
                level: 'error', // Fixo como 'error' para esta função específica
                component: component,
                stack: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2),
            },
        });
    } catch (dbError) {
        // Este console.error é mantido intencionalmente. Se a gravação do log principal no DB falhar,
        // é um evento crítico que precisa ser visível no console do servidor.
        console.error("FALHA CRÍTICA AO GRAVAR LOG NO BANCO DE DADOS:", dbError);
    }
}
