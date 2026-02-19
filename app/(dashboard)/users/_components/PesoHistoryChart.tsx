"use client";

import { useState } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const PesoHistoryChartContent = dynamic(() => import('./PesoHistoryChartContent'), {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível adicionar o registro.";
      toast({ variant: "destructive", title: "Erro", description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const safeHistoricoPeso = Array.isArray(historicoPeso) ? historicoPeso : [];
  
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
          <PesoHistoryChartContent historicoPeso={safeHistoricoPeso} />
        )}
      </CardContent>
    </Card>
  );
}
