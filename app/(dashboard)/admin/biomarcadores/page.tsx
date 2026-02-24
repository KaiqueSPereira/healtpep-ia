'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { CurationTools } from './_components/CurationTools';
import { BiomarkersDataTable, BiomarkerData } from './_components/BiomarkersDataTable';
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Button } from '@/app/_components/ui/button';
import { ColumnFiltersState } from '@tanstack/react-table';

interface CategorizedBiomarkers {
  [category: string]: string[];
}

const BiomarkerManagerPage = () => {
  const [pending, setPending] = useState<string[]>([]);
  const [categorized, setCategorized] = useState<CategorizedBiomarkers>({});
  const [allBiomarkerNames, setAllBiomarkerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { toast } = useToast();

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!isRefetch) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exames/biomarcadores/all');

      if (!res.ok) {
        throw new Error('Falha ao carregar os dados dos biomarcadores.');
      }

      const allData = await res.json();

      const pendingData = allData.Pendente || [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Pendente, ...categorizedData } = allData;

      setPending(pendingData.sort());
      setCategorized(categorizedData);

      const allNames = [...new Set([...pendingData, ...Object.values(categorizedData).flat()])].sort();
      setAllBiomarkerNames(allNames as string[]);

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

  const tableData = useMemo<BiomarkerData[]>(() => {
    const pendingData: BiomarkerData[] = pending.map(name => ({ name, category: 'Pendente' }));
    const categorizedData: BiomarkerData[] = Object.entries(categorized).flatMap(([category, names]) => 
      names.map(name => ({ name, category }))
    );
    return [...pendingData, ...categorizedData].sort((a, b) => a.name.localeCompare(b.name));
  }, [pending, categorized]);

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

  const categoryOptions = Object.keys(categorized).sort();
  const pendingCount = pending.length;

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Gerenciador de Biomarcadores</h1>
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
    </main>
  );
};

export default BiomarkerManagerPage;
