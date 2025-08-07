// app/users/_components/IMCChart.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions, TooltipItem } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PesoRegistro {
  id: string;
  userId: string;
  peso: string; // Peso descriptografado (string)
  data: string; // Data descriptografada (string)
  createdAt: string;
  updatedAt: string;
}

interface IMCChartProps {
  userId: string;
  userHeight: number | null; // Altura do usuário em centímetros
  historicoPeso: PesoRegistro[]; // Receber histórico de peso como prop do pai
  loadingHistorico: boolean; // Receber estado de loading do pai
  errorHistorico: string | null; // Receber estado de erro do pai
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

export default function IMCChart({ userId, userHeight, historicoPeso, loadingHistorico, errorHistorico }: IMCChartProps) {
  const [ultimoIMCCalculado, setUltimoIMCCalculado] = useState<string | null>(null);
  const [faixaIMCUltimoRegistro, setFaixaIMCUltimoRegistro] = useState<string | null>(null);

  useEffect(() => {
    if (historicoPeso && historicoPeso.length > 0 && userHeight !== null) {
      const historicoOrdenado = [...historicoPeso].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const ultimoRegistro = historicoOrdenado[historicoOrdenado.length - 1];

      const pesoNumerico = parseFloat(ultimoRegistro.peso);

      if (!isNaN(pesoNumerico)) {
        // Converter userHeight de centímetros para metros
        const alturaEmMetros = userHeight / 100;
        const imc = calcularIMC(pesoNumerico, alturaEmMetros);

        setUltimoIMCCalculado(imc);

        if (imc !== null) {
          const faixa = determinarFaixaIMC(parseFloat(imc));
          setFaixaIMCUltimoRegistro(faixa);
        } else {
          setFaixaIMCUltimoRegistro(null);
        }
      } else {
        setUltimoIMCCalculado(null);
        setFaixaIMCUltimoRegistro(null);
      }
    } else {
      setUltimoIMCCalculado(null);
      setFaixaIMCUltimoRegistro(null);
    }
  }, [historicoPeso, userHeight]); // Depende de historicoPeso e userHeight

  // Data para o gráfico de IMC (usando Doughnut como gauge)
  const imcValue = ultimoIMCCalculado !== null ? parseFloat(ultimoIMCCalculado) : 0;

  // Faixas de IMC e cores correspondentes (para visualização em gauge)
  const imcRanges = [18.5, 25, 30, 35, 40]; // Limites das faixas (aproximados para o gauge)
  const imcLabels = ['Abaixo do peso', 'Peso normal', 'Sobrepeso', 'Obesidade Grau 1', 'Obesidade Grau 2', 'Obesidade Grau 3']; // Rótulos das faixas (com mais granularidade para exibição)
  const imcColors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#d35400', '#c0392b']; // Cores para cada faixa (azul, verde, amarelo, laranja, laranja escuro, vermelho)

  const dataGauge = {
    labels: imcLabels,
    datasets: [
      {
        label: 'IMC',
        data: [imcRanges[0], imcRanges[1] - imcRanges[0], imcRanges[2] - imcRanges[1], imcRanges[3] - imcRanges[2], imcRanges[4] - imcRanges[3], 50 - imcRanges[4]], // Use ranges for data points
        backgroundColor: imcLabels.map((label, index) => {
          // Make non-highlighted colors more opaque, highlighted color more vibrant
          if (faixaIMCUltimoRegistro === label) {
            return imcColors[index]; // Use original vibrant color for highlighted
          }
          // Add transparency to non-highlighted colors
          return imcColors[index] + '80'; // '80' is a hex value for alpha (around 50% opacity)
        }),
        borderColor: imcLabels.map((label) => {
          // Highlight the segment corresponding to the user's IMC category
          if (faixaIMCUltimoRegistro === label) {
            return '#ffffff'; // White border for highlighted segment
          }
          return 'transparent'; // No border for other segments
        }),
        borderWidth: 5, // Highlighted border width
 // Add inner and outer radius for better gauge appearance
      },
    ],
  };

  const optionsGauge: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Oculta a legenda
      },
      tooltip: {
        enabled: true,
        displayColors: false, // Hide color box in tooltip
        position: 'nearest',
        callbacks: {
          label: (tooltipItem: TooltipItem<'doughnut'>): string => {
            // Exibe apenas o rótulo da faixa no tooltip
            return imcLabels[tooltipItem.dataIndex];
          },
          title: () => '', // Remove o título do tooltip
        },
      }
    },
    rotation: 270, // Start at the bottom
    circumference: 180, // Half a circle for the gauge effect
    cutout: '80%', // Tamanho do buraco central
  };


  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Índice de Massa Corporal (IMC)</CardTitle> {/* Título ajustado */}
      </CardHeader>
      <CardContent className="grid gap-4">
        {loadingHistorico ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : errorHistorico ? (
          <p className="text-red-500">{errorHistorico}</p>
        ) : userHeight === null ? (
          <p className="text-orange-500">Informe a altura do usuário (em centímetros) para visualizar o gráfico de IMC.</p>
        ) : historicoPeso.length === 0 ? (
           <p>Nenhum registro de peso encontrado para calcular o IMC.</p>
        ) : ultimoIMCCalculado === null ? (
           <p className="text-orange-500">Não foi possível calcular o IMC. Verifique os dados de peso e altura.</p>
        ) : (
          <div className="flex flex-col items-center w-full">
             <div className="relative w-full max-w-md h-64 flex justify-center items-center">
                <Doughnut data={dataGauge} options={optionsGauge} />
                {/* Exibir o valor do IMC e a faixa no centro do gauge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
                   <p className="text-2xl font-bold">{ultimoIMCCalculado}</p>
                   <p className="text-sm text-gray-600">{faixaIMCUltimoRegistro}</p>
                </div>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
