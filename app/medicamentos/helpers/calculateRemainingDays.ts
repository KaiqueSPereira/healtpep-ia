
import { Medicamento } from "@prisma/client";

// Mapeia FrequenciaTipo para um fator de multiplicação em dias
const frequencyToDaysFactor = {
    HORA: 1 / 24,
    DIA: 1,
    SEMANA: 7,
    MES: 30, 
};

export const calculateRemainingDays = (medicamento: Partial<Medicamento>): number | null => {
    const { estoque, quantidadeCaixa, quantidadeDose, frequenciaNumero, frequenciaTipo } = medicamento;

    // Verifica se todos os campos necessários para o cálculo existem e são válidos
    if (
        estoque === null || estoque === undefined ||
        quantidadeCaixa === null || quantidadeCaixa === undefined ||
        quantidadeDose === null || quantidadeDose === undefined ||
        frequenciaNumero === null || frequenciaNumero === undefined ||
        frequenciaTipo === null || frequenciaTipo === undefined ||
        !frequencyToDaysFactor[frequenciaTipo]
    ) {
        return null; // Retorna nulo se qualquer campo essencial estiver faltando
    }

    // Cálculo do total de unidades de medicamento disponíveis
    const totalUnidades = estoque * quantidadeCaixa;

    // Cálculo de quantas doses são consumidas por dia
    const dosesPorDia = (1 / (frequencyToDaysFactor[frequenciaTipo] * (1 / frequenciaNumero))) * quantidadeDose;

    if (dosesPorDia <= 0) {
        return null; // Evita divisão por zero se a dose for nula
    }

    // Cálculo dos dias restantes
    const diasRestantes = totalUnidades / dosesPorDia;

    return Math.floor(diasRestantes); // Arredonda para o dia mais próximo
};
