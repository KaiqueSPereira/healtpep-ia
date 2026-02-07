// app/users/_components/IMCChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

const calcularIMC = (peso: number, alturaEmMetros: number): string | null => {
  if (alturaEmMetros <= 0 || peso <= 0) return null;
  const imc = peso / (alturaEmMetros * alturaEmMetros);
  return imc.toFixed(2);
};

const determinarFaixaIMC = (imc: number): string => {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc >= 18.5 && imc < 25) return 'Peso normal';
  if (imc >= 25 && imc < 30) return 'Sobrepeso';
  if (imc >= 30 && imc < 35) return 'Obesidade Grau 1';
  if (imc >= 35 && imc < 40) return 'Obesidade Grau 2';
  return 'Obesidade Grau 3 (Mórbida)';
};

const imcLabels = ['Abaixo do peso', 'Peso normal', 'Sobrepeso', 'Obesidade Grau 1', 'Obesidade Grau 2', 'Obesidade Grau 3 (Mórbida)'];
const imcValues = [18.5, 6.5, 5, 5, 5, 10]; // Representa a largura de cada faixa no gráfico
const imcColors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#d35400', '#c0392b'];

const pieData = imcLabels.map((label, index) => ({
  name: label,
  value: imcValues[index],
}));

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
          <div className="relative w-full h-48 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="100%" // Posiciona o centro na base do container
                  startAngle={180}
                  endAngle={0}
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={faixaIMCUltimoRegistro === entry.name ? imcColors[index] : `${imcColors[index]}80`} 
                      stroke={faixaIMCUltimoRegistro === entry.name ? '#ffffff' : 'transparent'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [null, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-center">
              <p className="text-2xl font-bold">{ultimoIMCCalculado}</p>
              <p className="text-sm text-gray-600">{faixaIMCUltimoRegistro}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}