
import { db } from '@/app/_lib/prisma';

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Grava uma ação ou erro no banco de dados.
 * Esta é a função central para logging e deve ser usada por outras APIs no servidor.
 * @param message A mensagem principal do log.
 * @param details Detalhes técnicos, como objetos de erro ou outros dados.
 * @param component O nome do componente ou da API onde o evento ocorreu.
 * @param level O nível do log (info, warn, error).
 * @param action A ação que estava sendo executada (ex: 'create_consulta').
 * @param userId O ID do usuário que executou a ação (opcional).
 */
export async function logAction({
    message,
    details,
    component,
    level,
    action,
    userId,
}: {
    message: string;
    details?: object | string;
    component: string;
    level: LogLevel;
    action: string;
    userId?: string;
}) {
    try {
        await db.actionLog.create({
            data: {
                message: message,
                stack: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : null,
                component: component,
                level: level,
                action: action,
                userId: userId,
            },
        });
    } catch (dbError) {
        // Se a gravação do log principal no DB falhar, logamos no console.
        // Isso é crucial para a depuração de problemas no próprio sistema de log.
        console.error("FALHA CRÍTICA AO GRAVAR LOG DE AÇÃO NO BANCO DE DADOS:", dbError);
        // Fallback para o log de erro antigo, caso a nova tabela não funcione
        console.error("Log original:", { message, details, component, level, action, userId });
    }
}

/**
 * @deprecated Use a nova função `logAction` em vez desta.
 * Grava um erro diretamente no banco de dados.
 * Esta função é mantida para retrocompatibilidade.
 * @param message A mensagem principal do erro.
 * @param errorDetails O objeto de erro, stack trace ou detalhes técnicos.
 * @param component O nome do componente ou da API onde o erro ocorreu.
 */
export async function logErrorToDb(message: string, errorDetails: object | string, component: string) {
    await logAction({
        message: message,
        details: errorDetails,
        component: component,
        level: 'error',
        action: `legacy_error_${component}`.toLowerCase(), // Ação genérica para erros legados
    });
}

