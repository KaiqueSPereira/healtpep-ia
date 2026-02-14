
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { FrequenciaTipo, StatusMedicamento } from '@prisma/client';
import { safeDecrypt } from '@/app/_lib/crypto';
import { startOfDay } from 'date-fns';

// Função para calcular a dose diária
function getDosesPorDia(frequenciaTipo: FrequenciaTipo, frequenciaNumero: number, quantidadeDose: number): number {
    switch (frequenciaTipo) {
        case 'Hora': return (24 / frequenciaNumero) * quantidadeDose;
        case 'Dia': return frequenciaNumero * quantidadeDose;
        case 'Semana': return (frequenciaNumero / 7) * quantidadeDose;
        case 'Mes': return (frequenciaNumero / 30) * quantidadeDose; // Aproximação
        default: return 0;
    }
}

export async function GET(request: Request) {
    // --- PROTEÇÃO DA ROTA ---
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Iniciando rotina de dedução de estoque...');

    try {
        const medicamentosAtivos = await db.medicamento.findMany({
            where: {
                status: StatusMedicamento.Ativo,
                estoque: { gt: 0 },
                frequenciaNumero: { not: null },
                frequenciaTipo: { not: null },
                quantidadeDose: { not: null },
                dataInicio: { lte: new Date() }
            }
        });

        let totalProcessado = 0;
        let totalNotificacoes = 0;

        for (const med of medicamentosAtivos) {
            if (!med.frequenciaTipo || !med.frequenciaNumero || !med.quantidadeDose || !med.estoque) {
                continue;
            }

            const dosesPorDia = getDosesPorDia(med.frequenciaTipo, med.frequenciaNumero, med.quantidadeDose);
            if (dosesPorDia <= 0) {
                continue;
            }

            // --- LÓGICA DE DATA CORRIGIDA ---
            // Compara apenas o dia, ignorando as horas, para garantir consistência.
            const hoje = startOfDay(new Date());
            const ultimaAtualizacao = startOfDay(med.updatedAt);
            const diffEmMs = hoje.getTime() - ultimaAtualizacao.getTime();
            const diffEmDias = Math.round(diffEmMs / (1000 * 60 * 60 * 24));

            if (diffEmDias < 1) {
                continue;
            }

            const totalDeducao = dosesPorDia * diffEmDias;
            const novoEstoque = Math.max(0, med.estoque - totalDeducao);

            await db.medicamento.update({
                where: { id: med.id },
                data: {
                    estoque: novoEstoque,
                    status: novoEstoque === 0 ? StatusMedicamento.Concluido : med.status,
                    updatedAt: new Date() // Atualiza a data para marcar a baixa de hoje
                }
            });

            totalProcessado++;

            const diasRestantes = novoEstoque / dosesPorDia;

            if (diasRestantes <= 7 && diasRestantes > 0) {
                const notificacaoExistente = await db.notification.findFirst({
                    where: {
                        medicamentoId: med.id,
                        type: 'ESTOQUE_BAIXO',
                        isRead: false
                    }
                });

                if (!notificacaoExistente) {
                    const nomeMedicamento = safeDecrypt(med.nome);
                    await db.notification.create({
                        data: {
                            userId: med.userId,
                            medicamentoId: med.id,
                            type: 'ESTOQUE_BAIXO',
                            title: 'Estoque Baixo',
                            message: `Seu estoque de ${nomeMedicamento} está acabando. Restam aproximadamente ${Math.ceil(diasRestantes)} dias.`
                        }
                    });
                    totalNotificacoes++;
                }
            }
        }

        console.log(`Rotina finalizada. Medicamentos processados: ${totalProcessado}. Novas notificações: ${totalNotificacoes}.`);
        return NextResponse.json({ success: true, processed: totalProcessado, notifications: totalNotificacoes });

    } catch (error) {
        console.error('[CRON_STOCK_DEDUCTION_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
