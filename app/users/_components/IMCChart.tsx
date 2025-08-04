// app/users/_components/IMCChart.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2'; // Using Doughnut as a proxy for a gauge chart visualization

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
  userHeight: number | null; // Altura do usuário em metros
}

const calcularIMC = (peso: number, altura: number): string | null => {
  if (altura <= 0 || peso <= 0) return null;
  const imc = peso / (altura * altura);
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

export default function IMCChart({ userId, userHeight }: IMCChartProps) {
  const [historicoPeso, setHistoricoPeso] = useState<PesoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimoIMCCalculado, setUltimoIMCCalculado] = useState<string | null>(null);
  const [faixaIMCUltimoRegistro, setFaixaIMCUltimoRegistro] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchHistoricoPeso = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/pesos/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar histórico de peso');
      }
      const data: PesoRegistro[] = await response.json();
      setHistoricoPeso(data);
    } catch (err: unknown) {
      setError('Erro inesperado ao buscar histórico de peso');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico de peso para calcular o IMC.",
      });
      console.error('Fetch histórico peso for IMC error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchHistoricoPeso();
  }, [fetchHistoricoPeso]);

  useEffect(() => {
    if (historicoPeso.length > 0 && userHeight !== null) {
      const ultimoRegistro = historicoPeso[historicoPeso.length - 1];
      const pesoNumerico = parseFloat(ultimoRegistro.peso);
      if (!isNaN(pesoNumerico)) {
        const imc = calcularIMC(pesoNumerico, userHeight);
        setUltimoIMCCalculado(imc);
        if (imc !== null) {
          setFaixaIMCUltimoRegistro(determinarFaixaIMC(parseFloat(imc)));
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
  }, [historicoPeso, userHeight]);

  // Data para o gráfico de IMC (usando Doughnut como gauge)
  const imcValue = ultimoIMCCalculado !== null ? parseFloat(ultimoIMCCalculado) : 0;

  // Faixas de IMC e cores correspondentes (aproximadas para visualização em gauge)
  // Abaixo: < 18.5 (ex: 0-18.5)
  // Normal: 18.5 - 24.9 (ex: 18.5-25)
  // Sobre: 25 - 29.9 (ex: 25-30)
  // Obesidade 1: 30 - 34.9 (ex: 30-35)
  // Obesidade 2: 35 - 39.9 (ex: 35-40)
  // Obesidade 3: >= 40 (ex: 40-50+, usar um limite superior para o gráfico)
  const imcRanges = [18.5, 25, 30, 35, 40, 50]; // Exemplo de limites para o gráfico
  const imcLabels = ['Abaixo do peso', 'Peso normal', 'Sobrepeso', 'Obesidade Grau 1', 'Obesidade Grau 2', 'Obesidade Grau 3'];
  const imcColors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#d35400', '#c0392b']; // Cores para cada faixa

  const dataGauge = {
    labels: imcLabels,
    datasets: [
      {
        label: 'IMC',
        data: [
          imcRanges[0], // Abaixo do peso
          imcRanges[1] - imcRanges[0], // Peso normal
          imcRanges[2] - imcRanges[1], // Sobrepeso
          imcRanges[3] - imcRanges[2], // Obesidade Grau 1
          imcRanges[4] - imcRanges[3], // Obesidade Grau 2
          imcRanges[5] - imcRanges[4], // Obesidade Grau 3 (usando 50 como limite superior)
          Math.max(0, 50 - imcValue) // Espaço restante para simular o gauge completo
        ],
        backgroundColor: [
          imcColors[0],
          imcColors[1],
          imcColors[2],
          imcColors[3],
          imcColors[4],
          imcColors[5],
          '#e0e0e0', // Cor para o espaço restante
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const optionsGauge: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false, // Permite controlar o tamanho
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const label = imcLabels[tooltipItem.dataIndex];
            const value = dataGauge.datasets[0].data[tooltipItem.dataIndex];
             // Custom tooltip logic if needed
             return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    rotation: 270, // Rotação para parecer um velocímetro
    circumference: 180, // Apenas metade do círculo
    cutout: '70%', // Tamanho do buraco central
  };

  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Gráfico de IMC</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : userHeight === null ? (
          <p className="text-orange-500">Informe a altura do usuário para visualizar o gráfico de IMC.</p>
        ) : historicoPeso.length === 0 ? (
           <p>Nenhum registro de peso encontrado para calcular o IMC.</p>
        ) : ultimoIMCCalculado === null ? (
           <p className="text-orange-500">Não foi possível calcular o IMC. Verifique os dados de peso e altura.</p>
        ) : (
          <div className="flex flex-col items-center w-full">
             <div className="relative w-full max-w-md h-64 flex justify-center items-center"> {/* Container para o gráfico gauge */}
                <Doughnut data={dataGauge} options={optionsGauge} />
                {/* Exibir o valor do IMC e a faixa no centro do gauge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
                   <p className="text-2xl font-bold">{ultimoIMCCalculado}</p>
                   <p className="text-sm text-gray-600">{faixaIMCUltimoRegistro}</p>
                </div>
             </div>
             <div className="mt-4 w-full">
                 <h4 className="text-lg font-semibold">Faixas de IMC:</h4>
                 <ul className="text-sm text-gray-700">
                    <li>Abaixo do peso: IMC &lt; 18.5</li>
                    <li>Peso normal: IMC 18.5 - 24.9</li>
                    <li>Sobrepeso: IMC 25 - 29.9</li>
                    <li>Obesidade Grau 1: IMC 30 - 34.9</li>
                    <li>Obesidade Grau 2: IMC 35 - 39.9</li>
                    <li>Obesidade Grau 3 (Mórbida): IMC &ge; 40</li>
                 </ul>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}