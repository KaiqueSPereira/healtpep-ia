"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for the chart component
const IMCChartContent = dynamic(() => import('./IMCChartContent'), {
  loading: () => <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false,
});

interface PesoRegistro {
  id: string;
  userId?: string;
  peso: string;
  data: string;
  createdAt?: string;
  updatedAt?: string;
}

interface IMCChartProps {
  userId: string;
  userHeight: number | null;
  historicoPeso: PesoRegistro[] | null;
  loadingHistorico: boolean;
  errorHistorico: string | null;
}

export default function IMCChart({ userHeight, historicoPeso, loadingHistorico, errorHistorico }: IMCChartProps) {
  const [ultimoIMCCalculado, setUltimoIMCCalculado] = useState<string | null>(null);
  const [faixaIMCUltimoRegistro, setFaixaIMCUltimoRegistro] = useState<string | null>(null);

  useEffect(() => {
    const safeHistoricoPeso = Array.isArray(historicoPeso) ? historicoPeso : [];
    if (safeHistoricoPeso.length > 0 && userHeight !== null) {
      const historicoOrdenado = [...safeHistoricoPeso].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const ultimoRegistro = historicoOrdenado[historicoOrdenado.length - 1];
      if (ultimoRegistro) {
        const pesoNumerico = parseFloat(ultimoRegistro.peso);
        if (!isNaN(pesoNumerico)) {
          const imc = calcularIMC(pesoNumerico, userHeight);
          setUltimoIMCCalculado(imc);
          if (imc !== null) {
            setFaixaIMCUltimoRegistro(determinarFaixaIMC(parseFloat(imc)));
          }
        }
      }
    }
  }, [historicoPeso, userHeight]);

  const safeHistoricoPeso = Array.isArray(historicoPeso) ? historicoPeso : [];

  return (
    <Card className="border-none">
      <CardHeader><CardTitle>Índice de Massa Corporal (IMC)</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        {loadingHistorico ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : errorHistorico ? (
          <p className="text-red-500">{errorHistorico}</p>
        ) : userHeight === null ? (
          <p className="text-orange-500">Informe a altura para visualizar o IMC.</p>
        ) : safeHistoricoPeso.length === 0 ? (
           <p>Nenhum registro de peso para calcular o IMC.</p>
        ) : ultimoIMCCalculado === null ? (
           <p className="text-orange-500">Não foi possível calcular o IMC.</p>
        ) : (
          <IMCChartContent 
            ultimoIMCCalculado={ultimoIMCCalculado}
            faixaIMCUltimoRegistro={faixaIMCUltimoRegistro}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions can remain in this file or be moved to a utils file
const calcularIMC = (peso: number, alturaEmMetros: number): string | null => {
  if (alturaEmMetros <= 0 || peso <= 0) return null;
  const imc = peso / (alturaEmMetros * alturaEmMetros);
  return imc.toFixed(2);
};

const determinarFaixaIMC = (imc: number): string => {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc >= 18.5 && imc < 25) return 'Sobrepeso';
  if (imc >= 25 && imc < 30) return 'Obesidade Grau 1';
  if (imc >= 35 && imc < 40) return 'Obesidade Grau 2';
  return 'Obesidade Grau 3 (Mórbida)';
};
