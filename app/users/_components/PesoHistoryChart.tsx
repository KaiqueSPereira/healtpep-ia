// app/users/_components/PesoHistoryChart.tsx
"use client";

import { useState, useEffect, useCallback } from 'react'; // Importado useCallback
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Loader2 } from 'lucide-react';
// Importa componentes necessários diretamente da Chart.js e react-chartjs-2
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js'; // Importado ChartOptions
import { Line } from 'react-chartjs-2'; // Importa o componente Line

// Registra os componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


interface PesoRegistro {
  id: string;
  userId: string;
  peso: string; // Peso descriptografado (string)
  data: string; // Data descriptografada (string)
  createdAt: string;
  updatedAt: string;
}

interface PesoHistoryChartProps {
  userId: string;
  userHeight: number | null; // Altura do usuário em metros
}

// ... funções auxiliares calcularIMC, formatarDataGrafico, determinarFaixaIMC existentes ...
const calcularIMC = (peso: number, altura: number): string | null => {
  if (altura <= 0 || peso <= 0) return null;
  const imc = peso / (altura * altura);
  return imc.toFixed(2);
};

const formatarDataGrafico = (dataString: string): string => {
  try {
    const date = new Date(dataString);
    return date.toLocaleDateString();
  } catch {
    return dataString;
  }
};

const determinarFaixaIMC = (imc: number): string => {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc >= 18.5 && imc < 25) return 'Peso normal';
  if (imc >= 25 && imc < 30) return 'Sobrepeso';
  if (imc >= 30 && imc < 35) return 'Obesidade Grau 1';
  if (imc >= 35 && imc < 40) return 'Obesidade Grau 2';
  return 'Obesidade Grau 3 (Mórbida)';
};


export default function PesoHistoryChart({ userId, userHeight }: PesoHistoryChartProps) {
  const [historicoPeso, setHistoricoPeso] = useState<PesoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaDataPeso, setNovaDataPeso] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // ... função fetchHistoricoPeso existente ...
  const fetchHistoricoPeso = useCallback(async () => { // Envolvido com useCallback
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
        description: "Não foi possível carregar o histórico de peso.",
      });
      console.error('Fetch histórico peso error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]); // Dependências de fetchHistoricoPeso


  useEffect(() => {
    fetchHistoricoPeso();
  }, [fetchHistoricoPeso]); // Dependência de useEffect agora é a função memorizada


  // ... função handleAddPeso existente ...
  const handleAddPeso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPeso || !novaDataPeso || !userId || isSaving) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Preencha o peso e a data.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/pesos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          peso: novoPeso,
          data: novaDataPeso, // Espera formato YYYY-MM-DD do input[date]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar peso');
      }

      await response.json();
      fetchHistoricoPeso(); // Refetch para atualizar gráfico

      setNovoPeso(''); // Limpa o campo de peso
      setNovaDataPeso(''); // Limpa o campo de data

      toast({
        title: "Sucesso!",
        description: "Registro de peso adicionado.",
      });

    } catch (err: unknown) {
      setError('Erro inesperado ao adicionar peso');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o registro de peso.",
      });
      console.error('Add peso error:', err);
    } finally {
      setIsSaving(false);
    }
  };


  // Preparar dados para o gráfico no formato do Chart.js
  const datas = historicoPeso.map(registro => formatarDataGrafico(registro.data));
  const pesos = historicoPeso.map(registro => parseFloat(registro.peso)).filter(peso => !isNaN(peso));

  const imcs = historicoPeso
    .map(registro => {
      const pesoNumerico = parseFloat(registro.peso);
      return userHeight !== null && !isNaN(pesoNumerico) ? parseFloat(calcularIMC(pesoNumerico, userHeight) || 'NaN') : NaN;
    })
    .filter(imc => !isNaN(imc));

  // === Calcular suggestedMin e suggestedMax para o eixo Y do peso ===
  const minPeso = pesos.length > 0 ? Math.min(...pesos) : 0;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos) : 140; // Default max if no data

  // Adiciona uma margem (ex: 5% da variação total)
  const margem = (maxPeso - minPeso) * 0.05; // 5% de margem

  const suggestedMinPeso = minPeso - margem;
  // Garante que suggestedMin não seja negativo
  const finalSuggestedMinPesoCalculated = suggestedMinPeso < 0 ? 0 : suggestedMinPeso;


  // === Obter o último registro de peso e calcular o IMC e faixa correspondente ===
  const ultimoRegistro = historicoPeso.length > 0 ? historicoPeso[historicoPeso.length - 1] : null;
  const ultimoIMCCalculado = ultimoRegistro && userHeight !== null
    ? calcularIMC(parseFloat(ultimoRegistro.peso), userHeight)
    : null;
  const faixaIMCUltimoRegistro = ultimoIMCCalculado !== null
    ? determinarFaixaIMC(parseFloat(ultimoIMCCalculado))
    : null;


  const dadosGraficoChartJS = {
    labels: datas,
    datasets: [
      {
        label: 'Peso (kg)',
        data: pesos,
        borderColor: 'rgb(136, 132, 216)',
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
        tension: 0.1,
      },
       ...(userHeight !== null && imcs.length > 0 ? [{
           label: 'IMC',
           data: imcs,
           borderColor: 'rgb(130, 202, 157)',
           backgroundColor: 'rgba(130, 202, 157, 0.5)',
           tension: 0.1,
           // yAxisID: 'y1', // Pode precisar de eixo Y separado dependendo dos valores de peso e IMC
       }] : []),
    ],
  };

    // Opções do gráfico (adaptadas do seu ExameLineChart)
    const chartOptions: ChartOptions<'line'> = { // Tipagem corrigida
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const, // Adicionado 'as const' para tipagem mais estrita
        },
        title: {
          display: true,
          text: 'Histórico de Peso e IMC',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Data',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Peso (kg)',
          },
          suggestedMin: finalSuggestedMinPesoCalculated,
          suggestedMax: maxPeso + margem,
           // Se tiver linha de IMC com eixo Y separado:
          // y1: {
          //   type: 'linear' as const, // Use 'linear' type cast
          //   display: true,
          //   position: 'right' as const, // Use 'right' position cast
          //   title: {
          //     display: true,
          //     text: 'IMC',
          //   },
          //   grid: {
          //     drawOnChartArea: false, // Não desenha grid para este eixo sobre a área do gráfico
          //   },
          //   suggestedMin: ..., // Adicionar min/max para o eixo IMC se usar
          //   suggestedMax: ...,
          // },
        },
      },
    };


  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Histórico de Peso</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">

        {/* Formulário para adicionar novo peso */}
        <form onSubmit={handleAddPeso} className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <Label htmlFor="novoPeso">Peso (kg):</Label>
            <Input
              id="novoPeso"
              type="number"
              step="0.1"
              placeholder="Ex: 75.5"
              value={novoPeso}
              onChange={(e) => setNovoPeso(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="novaDataPeso">Data:</Label>
            <Input
              id="novaDataPeso"
              type="date"
              value={novaDataPeso}
              onChange={(e) => setNovaDataPeso(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Adicionar
          </Button>
        </form>

        {/* Exibição do gráfico ou mensagens */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : historicoPeso.length === 0 ? (
          <p>Nenhum registro de peso encontrado.</p>
        ) : (
          // Container para o gráfico e informações de IMC
          <div className="flex flex-col items-center w-full">
            {/* === USANDO CHART.JS DIRETAMENTE === */}
             <div className="w-full"> {/* Container para controlar o tamanho do gráfico */}
               <Line data={dadosGraficoChartJS} options={chartOptions} />
             </div>


            {/* Informações de IMC (opcional) */}
             {userHeight !== null && ultimoRegistro && (
                <div className="mt-4 w-full">
                    <h4 className="text-lg font-semibold">Último Registro:</h4>
                    <p>Peso: {parseFloat(ultimoRegistro.peso).toFixed(2)} kg</p>
                    {ultimoIMCCalculado !== null && (
                        <>
                            <p>IMC: {ultimoIMCCalculado}</p>
                            <p>Faixa de IMC: {faixaIMCUltimoRegistro}</p>
                        </>
                    )}
                    <h4 className="text-lg font-semibold mt-4">Faixas de IMC:</h4> {/* Mantido o título das faixas */}
                    <ul className="text-sm text-gray-700">
                       <li>Abaixo do peso: IMC &lt; 18.5</li>
                       <li>Peso normal: IMC 18.5 - 24.9</li>
                       <li>Sobrepeso: IMC 25 - 29.9</li>
                       <li>Obesidade Grau 1: IMC 30 - 34.9</li>
                       <li>Obesidade Grau 2: IMC 35 - 39.9</li>
                       <li>Obesidade Grau 3 (Mórbida): IMC &ge; 40</li>
                    </ul>
                </div>
             )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
