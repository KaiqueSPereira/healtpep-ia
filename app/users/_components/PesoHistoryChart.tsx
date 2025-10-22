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

// ATUALIZAÇÃO: Campos que não são usados diretamente neste componente tornam-se opcionais
interface PesoRegistro {
  id: string;
  userId?: string; // Opcional
  peso: string;
  data: string;
  createdAt?: string; // Opcional
  updatedAt?: string; // Opcional
}

interface PesoHistoryChartProps {
  userId?: string;
  historicoPeso?: PesoRegistro[] | null;
  loading?: boolean;
  error?: string | null;
  onDataChange?: () => void;
}

export default function PesoHistoryChart({ 
  userId, 
  historicoPeso, 
  loading = false, 
  error = null, 
  onDataChange = () => {}
}: PesoHistoryChartProps) {
  const [novoPeso, setNovoPeso] = useState('');
  const [novaDataPeso, setNovaDataPeso] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const formatarDataGrafico = (dataString: string): string => {
    try {
      const date = new Date(dataString);
      date.setUTCHours(0, 0, 0, 0);
      if (isNaN(date.getTime())) return "Inválido";
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
      return dataString;
    }
  };
  
  const handleAddPeso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPeso || !novaDataPeso || !userId || isSaving) {
      toast({ variant: "destructive", title: "Atenção", description: "Preencha o peso e a data corretamente." });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/pacientes/dashboard/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ peso: novoPeso, data: novaDataPeso }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro ao adicionar peso'); }
      onDataChange();
      setNovoPeso('');
      setNovaDataPeso('');
      toast({ title: "Sucesso!", description: "Registro de peso adicionado." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message || "Não foi possível adicionar o registro." });
    } finally {
      setIsSaving(false);
    }
  };

  const safeHistoricoPeso = Array.isArray(historicoPeso) ? historicoPeso : [];
  const sortedHistoricoPeso = [...safeHistoricoPeso].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const datas = sortedHistoricoPeso.map(registro => formatarDataGrafico(registro.data));
  const pesos = sortedHistoricoPeso.map(registro => parseFloat(registro.peso));
  const minPeso = pesos.length > 0 ? Math.min(...pesos.filter(p => !isNaN(p))) : 0;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos.filter(p => !isNaN(p))) : 100;
  const dadosGraficoChartJS = { labels: datas, datasets: [{ label: 'Peso (kg)', data: pesos, borderColor: 'rgb(136, 132, 216)', backgroundColor: 'rgba(136, 132, 216, 0.5)', tension: 0.1 }] };
  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' as const } }, scales: { x: { title: { display: true, text: 'Data' } }, y: { title: { display: true, text: 'Peso (kg)' }, min: minPeso > 10 ? minPeso - 5 : 0, max: maxPeso > 0 ? maxPeso + 5 : 100 } } };

  return (
    <Card className="border-none">
      <CardHeader><CardTitle>Histórico de Peso</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        {userId && (
            <form onSubmit={handleAddPeso} className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1"><Label htmlFor="novoPeso">Peso (kg):</Label><Input id="novoPeso" type="number" step="0.1" placeholder="Ex: 75.5" value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} disabled={isSaving} /></div>
              <div className="flex-1"><Label htmlFor="novaDataPeso">Data:</Label><Input id="novaDataPeso" type="date" value={novaDataPeso} onChange={(e) => setNovaDataPeso(e.target.value)} disabled={isSaving} /></div>
              <Button type="submit" disabled={isSaving || loading} className="w-full sm:w-auto">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Adicionar</Button>
            </form>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : safeHistoricoPeso.length === 0 ? (
          <p className="text-center text-muted-foreground pt-4">Nenhum registro de peso encontrado.</p>
        ) : (
          <div className="w-full mt-4"><Line data={dadosGraficoChartJS} options={chartOptions} /></div>
        )}
      </CardContent>
    </Card>
  );
}
