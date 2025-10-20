"use client";

import { useState } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Loader2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PesoRegistro {
  id: string;
  userId: string;
  peso: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

interface PesoHistoryChartProps {
  userId: string;
  historicoPeso: PesoRegistro[];
  loading: boolean;
  error: string | null;
  onDataChange: () => void; // Callback para notificar o pai que os dados mudaram
}

export default function PesoHistoryChart({ userId, historicoPeso, loading, error, onDataChange }: PesoHistoryChartProps) {
  const [novoPeso, setNovoPeso] = useState('');
  const [novaDataPeso, setNovaDataPeso] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const formatarDataGrafico = (dataString: string): string => {
    try {
      const date = new Date(dataString);
      // Adiciona verificação para datas inválidas que podem vir da descriptografia
      if (isNaN(date.getTime())) return "Inválido";
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  };
  
  const handleAddPeso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPeso || !novaDataPeso || !userId || isSaving) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Preencha o peso e a data corretamente.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/pacientes/dashboard/${userId}`, { // URL da API corrigida
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ // Corpo da requisição corrigido
          peso: novoPeso,
          data: novaDataPeso,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar peso');
      }

      onDataChange(); // Notifica o componente pai para recarregar os dados

      setNovoPeso('');
      setNovaDataPeso('');

      toast({
        title: "Sucesso!",
        description: "Registro de peso adicionado. O gráfico será atualizado.",
      });

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Não foi possível adicionar o registro de peso.",
      });
      console.error('Add peso error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedHistoricoPeso = [...historicoPeso].sort((a, b) => {
    const dateA = new Date(a.data);
    const dateB = new Date(b.data);
    // Trata datas inválidas colocando-as no final
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    return dateA.getTime() - dateB.getTime();
  });

  const datas = sortedHistoricoPeso.map(registro => formatarDataGrafico(registro.data));
  const pesos = sortedHistoricoPeso.map(registro => parseFloat(registro.peso)).filter(peso => !isNaN(peso));
  
  const minPeso = pesos.length > 0 ? Math.min(...pesos) : 0;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos) : 100;

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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Data' },
      },
      y: {
        title: { display: true, text: 'Peso (kg)' },
        suggestedMin: minPeso > 10 ? minPeso - 5 : 0,
        suggestedMax: maxPeso + 5,
      },
    },
  };

  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Histórico de Peso</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">

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
          <Button type="submit" disabled={isSaving || loading} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Adicionar
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : historicoPeso.length === 0 ? (
          <p className="text-center text-muted-foreground pt-4">Nenhum registro de peso encontrado.</p>
        ) : (
          <div className="w-full mt-4"> 
            <Line data={dadosGraficoChartJS} options={chartOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
