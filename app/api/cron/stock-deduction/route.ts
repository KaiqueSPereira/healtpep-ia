
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
                dataInicio: { lte: new Date() },
                ultimaAtualizacaoEstoque: { not: null }, // Garante que a lógica só rode em medicamentos já abastecidos.
            }
        });

        let totalProcessado = 0;
        let totalNotificacoes = 0;

        for (const med of medicamentosAtivos) {
            // As verificações abaixo são redundantes devido ao where, mas mantidas por segurança.
            if (!med.frequenciaTipo || !med.frequenciaNumero || !med.quantidadeDose || !med.estoque || !med.ultimaAtualizacaoEstoque) {
                continue;
            }

            const dosesPorDia = getDosesPorDia(med.frequenciaTipo, med.frequenciaNumero, med.quantidadeDose);
            if (dosesPorDia <= 0) {
                continue;
            }

            // --- LÓGICA DE DATA CORRIGIDA ---
            const hoje = startOfDay(new Date());
            const ultimaAtualizacao = startOfDay(med.ultimaAtualizacaoEstoque);
            const diffEmMs = hoje.getTime() - ultimaAtualizacao.getTime();
            const diffEmDias = Math.round(diffEmMs / (1000 * 60 * 60 * 24));

            // Se a última atualização foi hoje ou no futuro, não faz nada.
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
                    ultimaAtualizacaoEstoque: new Date() // Atualiza a data para marcar a baixa de hoje como o novo ponto de partida.
                }
            });

            totalProcessado++;

            const diasRestantes = novoEstoque / dosesPorDia;

            // Lógica de notificação permanece a mesma...
            if (diasRestantes <= 7 && diasRestantes > 0) {
                const notificacaoExistente = await db.notification.findFirst({
                    where: {
                        medicamentoId: med.id,
                        type: 'ESTOQUE_BAIXO',
                        isRead: false
                    }
                });

                if (!notificacaoExistente) {
                    // A descriptografia do nome só é necessária para a mensagem
                    const nomeMedicamento = med.nome;
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
