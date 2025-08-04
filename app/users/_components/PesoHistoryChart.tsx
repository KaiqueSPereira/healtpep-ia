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
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

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
};


export default function PesoHistoryChart({ userId, userHeight }: PesoHistoryChartProps) {
  const [historicoPeso, setHistoricoPeso] = useState<PesoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaDataPeso, setNovaDataPeso] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const formatarDataGrafico = (dataString: string): string => {
    try {
      const date = new Date(dataString);
      return date.toLocaleDateString();
    } catch {
      return dataString;
    }
  };
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

  const minPeso = pesos.length > 0 ? Math.min(...pesos) : 0;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos) : 140;


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
    ],
  };

    // Opções do gráfico (adaptadas do seu ExameLineChart)
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const, // Adicionado 'as const' para tipagem mais estrita
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
          suggestedMin: minPeso > 0 ? minPeso * 0.9 : 0, // 10% below min or 0
          suggestedMax: maxPeso * 1.1, // 10% above max
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
            
             <div className="w-full"> 
               <h3 className="text-center text-lg font-semibold mb-4">Histórico de Peso</h3>
               <Line data={dadosGraficoChartJS} options={chartOptions} />
             </div>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
