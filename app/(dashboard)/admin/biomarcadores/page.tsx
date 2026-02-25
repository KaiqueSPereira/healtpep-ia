'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { CurationTools } from './_components/CurationTools';
import { BiomarkersDataTable, BiomarkerData } from './_components/BiomarkersDataTable';
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Button } from '@/app/_components/ui/button';
import { ColumnFiltersState } from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_components/ui/dialog';

interface CategorizedBiomarkers {
  [category: string]: string[];
}

const BiomarkerManagerPage = () => {
  const [categorized, setCategorized] = useState<CategorizedBiomarkers>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // State for the diagnostic tool
  const [orphanMarkers, setOrphanMarkers] = useState<string[]>([]);
  const [isOrphanDialogOpen, setIsOrphanDialogOpen] = useState(false);
  const [isCheckingOrphans, setIsCheckingOrphans] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!isRefetch) setLoading(true);
    setError(null);
    try {
      // Using the new unified API endpoint
      const res = await fetch('/api/exames/biomarcadores');
      if (!res.ok) throw new Error('Falha ao carregar os dados dos biomarcadores.');
      const allData = await res.json();
      setCategorized(allData);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast({ title: 'Erro ao Carregar Dados', description: errorMessage, variant: 'destructive' });
    } finally {
      if (!isRefetch) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOrphanCheck = async () => {
    setIsCheckingOrphans(true);
    try {
      // Using the new unified API endpoint with query parameter
      const res = await fetch('/api/exames/biomarcadores?action=diagnose');
      if (!res.ok) throw new Error('A resposta da API de diagnóstico não foi bem-sucedida.');
      const data = await res.json();
      setOrphanMarkers(data);
      setIsOrphanDialogOpen(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro no Diagnóstico', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCheckingOrphans(false);
    }
  };

  const handleCreatePendingRules = async () => {
    if (orphanMarkers.length === 0) return;
    setIsCreating(true);
    try {
      // Using the new unified API endpoint
      const res = await fetch('/api/exames/biomarcadores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: orphanMarkers }),
      });

      if (!res.ok) throw new Error('Falha ao criar regras pendentes.');
      
      toast({
          title: 'Sucesso!',
          description: `${orphanMarkers.length} biomarcador(es) foram adicionados à fila de pendentes.`,
          variant: 'default'
      });

      setIsOrphanDialogOpen(false);
      await fetchData(true); // Refetch all data
      handleFilterPending(); // Focus on the pending filter
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro ao Criar Regras', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const tableData = useMemo<BiomarkerData[]>(() => {
    return Object.entries(categorized).flatMap(([category, names]) => 
      names.map(name => ({ name, category }))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [categorized]);

  const allBiomarkerNames = useMemo(() => 
    [...new Set(Object.values(categorized).flat())].sort(), 
  [categorized]);

  const pendingCount = categorized['Pendente']?.length || 0;

  const handleFilterPending = () => {
    setColumnFilters(prev => {
        const newFilters = prev.filter(f => f.id !== 'category');
        return [...newFilters, { id: 'category', value: 'Pendente' }];
    });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center"><AlertTriangle className="mx-auto mb-2"/>{error}</div>;
  }

  const categoryOptions = Object.keys(categorized).filter(c => c !== 'Pendente').sort();

  return (
    <main className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
        <h1 className="text-3xl font-bold">Gerenciador de Biomarcadores</h1>
        <Button onClick={handleOrphanCheck} disabled={isCheckingOrphans} variant="outline" className="mt-4 md:mt-0">
            {isCheckingOrphans ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            Verificar Marcadores Órfãos
        </Button>
      </div>
      <p className="text-muted-foreground mb-8">Ferramentas para organizar, categorizar e unificar os dados de biomarcadores.</p>

      {pendingCount > 0 && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Biomarcadores Pendentes!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <p>Você tem {pendingCount} biomarcador(es) para categorizar.</p>
            <Button onClick={handleFilterPending} variant="secondary">Ver Pendentes</Button>
          </AlertDescription>
        </Alert>
      )}

      <CurationTools 
        categories={categoryOptions}
        allBiomarkers={allBiomarkerNames}
        onCuration={() => fetchData(true)}
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Todos os Biomarcadores</CardTitle>
          </CardHeader>
          <CardContent>
            <BiomarkersDataTable 
              data={tableData} 
              categories={categoryOptions}
              onActionComplete={() => fetchData(true)}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOrphanDialogOpen} onOpenChange={setIsOrphanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diagnóstico de Marcadores Órfãos</DialogTitle>
            <DialogDescription>
              Estes marcadores existem em exames mas não possuem regra de categorização. Use o botão abaixo para criá-los como &apos;Pendente&apos; e iniciar a curadoria.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 max-h-60 overflow-y-auto rounded-md border p-4">
            {orphanMarkers.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {orphanMarkers.map(marker => <li key={marker}>{marker}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-center text-green-600 font-medium flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4"/> Nenhum marcador órfão encontrado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrphanDialogOpen(false)}>Fechar</Button>
            {orphanMarkers.length > 0 && (
                <Button onClick={handleCreatePendingRules} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Criar Regras Pendentes
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
};

export default BiomarkerManagerPage;
