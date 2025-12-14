
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { FrequenciaTipo, StatusMedicamento } from '@prisma/client';
import { safeDecrypt } from '@/app/_lib/crypto';

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
    // Garante que a rota só pode ser acessada por um serviço de Cron autorizado
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Iniciando rotina de dedução de estoque...');

    try {
        // 1. Encontra todos os medicamentos ativos que precisam de dedução
        const medicamentosAtivos = await db.medicamento.findMany({
            where: {
                status: StatusMedicamento.Ativo,
                estoque: { gt: 0 }, // Só processa se tiver estoque
                frequenciaNumero: { not: null },
                frequenciaTipo: { not: null },
                quantidadeDose: { not: null },
                dataInicio: { lte: new Date() } // Só começa a deduzir se a data de início já passou
            }
        });

        let totalProcessado = 0;
        let totalNotificacoes = 0;

        // 2. Itera sobre cada medicamento
        for (const med of medicamentosAtivos) {
            // O cálculo só deve ser feito se todos os campos necessários existirem
            if (!med.frequenciaTipo || !med.frequenciaNumero || !med.quantidadeDose || !med.estoque) {
                continue;
            }
            
            // Calcula a quantidade de doses a serem consumidas por dia
            const dosesPorDia = getDosesPorDia(med.frequenciaTipo, med.frequenciaNumero, med.quantidadeDose);
            if (dosesPorDia <= 0) {
                continue; // Pula se o cálculo for inválido
            }
            
            const hoje = new Date();
            const ultimaAtualizacao = new Date(med.updatedAt);
            const diffEmMs = hoje.getTime() - ultimaAtualizacao.getTime();
            const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));

            // Só executa a dedução se tiver passado pelo menos 1 dia desde a última atualização
            if (diffEmDias < 1) {
                 continue;
            }

            const totalDeducao = dosesPorDia * diffEmDias;
            const novoEstoque = Math.max(0, med.estoque - totalDeducao);

            // 3. Atualiza o estoque no banco de dados
            await db.medicamento.update({
                where: { id: med.id },
                data: {
                    estoque: novoEstoque,
                    // Se o estoque zerar, muda o status para Concluído
                    status: novoEstoque === 0 ? StatusMedicamento.Concluido : med.status,
                    updatedAt: new Date() // Força a atualização da data
                }
            });
            
            totalProcessado++;

            // 4. Verifica se o estoque está baixo e cria a notificação
            const diasRestantes = novoEstoque / dosesPorDia;

            if (diasRestantes <= 7 && diasRestantes > 0) {
                 // Verifica se já existe uma notificação recente para este medicamento
                const notificacaoExistente = await db.notification.findFirst({
                    where: {
                        medicamentoId: med.id,
                        type: 'ESTOQUE_BAIXO',
                        isRead: false // Considera apenas as não lidas para evitar duplicatas
                    }
                });

                // Se não houver notificação, cria uma nova
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
