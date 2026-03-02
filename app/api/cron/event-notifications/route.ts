
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { addDays } from 'date-fns';
import { safeDecrypt } from '@/app/_lib/crypto';
import { logAction } from '@/app/_lib/logger';

export async function GET(request: Request) {
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await logAction({ action: "cron_event_notifications_start", level: "info", message: "Iniciando rotina de notificação de eventos próximos", component: "cron-event-notifications" });

    let totalNotificacoes = 0;

    try {
        const users = await db.user.findMany({ where: { emailVerified: { not: null } } });

        for (const user of users) {
            const userId = user.id;
            const amanha = addDays(new Date(), 1);
            const startOfTomorrow = new Date(amanha.setHours(0, 0, 0, 0));
            const endOfTomorrow = new Date(amanha.setHours(23, 59, 59, 999));
            let userNotifications = 0;

            // 1. Processa consultas para o usuário
            const consultas = await db.consultas.findMany({
                where: { userId, data: { gte: startOfTomorrow, lt: endOfTomorrow } }
            });

            for (const consulta of consultas) {
                if (!await db.notification.findFirst({ where: { userId, type: 'EVENTO_PROXIMO', relatedId: consulta.id, relatedModel: 'Consulta' } })) {
                    await db.notification.create({
                        data: {
                            userId: userId,
                            type: 'EVENTO_PROXIMO',
                            title: 'Lembrete de Consulta',
                            message: `Você tem uma consulta "${safeDecrypt(consulta.motivo)}" agendada para amanhã.`,
                            relatedId: consulta.id,
                            relatedModel: 'Consulta'
                        }
                    });
                    totalNotificacoes++;
                    userNotifications++;
                }
            }

            // 2. Processa exames para o usuário
            const exames = await db.exame.findMany({
                where: { userId, dataExame: { gte: startOfTomorrow, lt: endOfTomorrow } }
            });

            for (const exame of exames) {
                if (!await db.notification.findFirst({ where: { userId, type: 'EVENTO_PROXIMO', relatedId: exame.id, relatedModel: 'Exame' } })) {
                    await db.notification.create({
                        data: {
                            userId: userId,
                            type: 'EVENTO_PROXIMO',
                            title: 'Lembrete de Exame',
                            message: `Você tem um exame "${safeDecrypt(exame.nome)}" agendado para amanhã.`,
                            relatedId: exame.id,
                            relatedModel: 'Exame'
                        }
                    });
                    totalNotificacoes++;
                    userNotifications++;
                }
            }
            if (userNotifications > 0) {
                await logAction({ userId, action: "cron_event_notifications_user_success", level: "info", message: `${userNotifications} notificações de eventos criadas para o usuário`, component: "cron-event-notifications" });
            }
        }

        await logAction({ action: "cron_event_notifications_finish", level: "info", message: `Rotina finalizada. Novas notificações de eventos: ${totalNotificacoes}.`, component: "cron-event-notifications" });
        return NextResponse.json({ success: true, notifications: totalNotificacoes });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ action: "cron_event_notifications_error", level: "error", message: "Erro na rotina de notificação de eventos", details: errorMessage, component: "cron-event-notifications" });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
