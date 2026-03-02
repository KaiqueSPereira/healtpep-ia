
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { logAction } from '@/app/_lib/logger';
import { StatusMedicamento, FrequenciaTipo } from '@prisma/client';

const calculateDosesSince = (lastUpdate: Date, frequenciaNumero: number, frequenciaTipo: FrequenciaTipo): number => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let hoursPerDose = 0;
    switch (frequenciaTipo) {
        case FrequenciaTipo.Hora: hoursPerDose = frequenciaNumero; break;
        case FrequenciaTipo.Dia: hoursPerDose = frequenciaNumero * 24; break;
        case FrequenciaTipo.Semana: hoursPerDose = frequenciaNumero * 24 * 7; break;
        case FrequenciaTipo.Mes: hoursPerDose = frequenciaNumero * 24 * 30; break; // Aproximação
    }

    if (hoursPerDose === 0) return 0;
    return Math.floor(diffHours / hoursPerDose);
};

export async function GET(request: Request) {
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await logAction({ action: "cron_stock_deduction_start", level: "info", message: "Iniciando rotina de dedução de estoque", component: "cron-stock-deduction" });

    try {
        const users = await db.user.findMany({ where: { emailVerified: { not: null } } });

        for (const user of users) {
            const userId = user.id;
            const medicamentos = await db.medicamento.findMany({
                where: {
                    userId: userId,
                    status: StatusMedicamento.Ativo,
                    estoque: { not: null },
                    frequenciaNumero: { not: null },
                    frequenciaTipo: { not: null },
                    ultimaAtualizacaoEstoque: { not: null },
                }
            });

            for (const medicamento of medicamentos) {
                // @ts-ignore: Garantimos que os campos não são nulos na query
                const dosesConsumidas = calculateDosesSince(medicamento.ultimaAtualizacaoEstoque, medicamento.frequenciaNumero, medicamento.frequenciaTipo);
                const quantidadeDose = medicamento.quantidadeDose ?? 1; // Default de 1 se não especificado

                if (dosesConsumidas > 0) {
                    const deducaoTotal = dosesConsumidas * quantidadeDose;
                    const novoEstoque = Math.max(0, (medicamento.estoque ?? 0) - deducaoTotal);

                    await db.medicamento.update({
                        where: { id: medicamento.id },
                        data: {
                            estoque: novoEstoque,
                            ultimaAtualizacaoEstoque: new Date(),
                        },
                    });

                    await logAction({
                        userId,
                        action: "cron_stock_deduction_success",
                        level: "info",
                        message: `Dedução de estoque para o medicamento ${medicamento.id}. Doses: ${dosesConsumidas}, Redução: ${deducaoTotal}, Novo Estoque: ${novoEstoque}`,
                        component: "cron-stock-deduction"
                    });
                }
            }
        }

        await logAction({ action: "cron_stock_deduction_finish", level: "info", message: "Rotina de dedução de estoque finalizada com sucesso", component: "cron-stock-deduction" });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ action: "cron_stock_deduction_error", level: "error", message: "Erro na rotina de dedução de estoque", details: errorMessage, component: "cron-stock-deduction" });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
