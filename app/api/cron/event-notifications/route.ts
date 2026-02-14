
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { addDays } from 'date-fns';
import { safeDecrypt } from '@/app/_lib/crypto';

export async function GET(request: Request) {
    // --- PROTEÇÃO DA ROTA ---
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Iniciando rotina de notificação de eventos próximos...');

    try {
        const hoje = new Date();
        const amanha = addDays(hoje, 1);
        let totalNotificacoes = 0;

        // 1. Busca por consultas agendadas para amanhã
        const consultas = await db.consultas.findMany({
            where: {
                data: {
                    gte: new Date(amanha.setHours(0, 0, 0, 0)),
                    lt: new Date(amanha.setHours(23, 59, 59, 999))
                }
            }
        });

        for (const consulta of consultas) {
            const nomeConsulta = safeDecrypt(consulta.motivo);

            const notificacaoExistente = await db.notification.findFirst({
                where: {
                    userId: consulta.userId,
                    type: 'EVENTO_PROXIMO',
                    relatedId: consulta.id,
                    relatedModel: 'Consulta'
                }
            });

            if (!notificacaoExistente) {
                await db.notification.create({
                    data: {
                        userId: consulta.userId,
                        type: 'EVENTO_PROXIMO',
                        title: 'Lembrete de Consulta',
                        message: `Você tem uma consulta "${nomeConsulta}" agendada para amanhã.`,
                        relatedId: consulta.id,
                        relatedModel: 'Consulta'
                    }
                });
                totalNotificacoes++;
            }
        }

        // 2. Busca por exames agendados para amanhã
        const exames = await db.exame.findMany({
            where: {
                dataExame: { // Corrigido de 'data' para 'dataExame'
                    gte: new Date(amanha.setHours(0, 0, 0, 0)),
                    lt: new Date(amanha.setHours(23, 59, 59, 999))
                }
            }
        });

        for (const exame of exames) {
            const nomeExame = safeDecrypt(exame.nome); // 'nome' está correto para exames

            const notificacaoExistente = await db.notification.findFirst({
                where: {
                    userId: exame.userId,
                    type: 'EVENTO_PROXIMO',
                    relatedId: exame.id,
                    relatedModel: 'Exame'
                }
            });

            if (!notificacaoExistente) {
                await db.notification.create({
                    data: {
                        userId: exame.userId,
                        type: 'EVENTO_PROXIMO',
                        title: 'Lembrete de Exame',
                        message: `Você tem um exame "${nomeExame}" agendado para amanhã.`,
                        relatedId: exame.id,
                        relatedModel: 'Exame'
                    }
                });
                totalNotificacoes++;
            }
        }

        console.log(`Rotina finalizada. Novas notificações de eventos: ${totalNotificacoes}.`);
        return NextResponse.json({ success: true, notifications: totalNotificacoes });

    } catch (error) {
        console.error('[CRON_EVENT_NOTIFICATIONS_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
