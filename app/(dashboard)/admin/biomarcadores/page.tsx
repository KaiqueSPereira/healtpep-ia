'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Input } from '@/app/_components/ui/input';
import { Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { CurationTools } from './_components/CurationTools';

interface CategorizedBiomarkers {
  [category: string]: string[];
}

const BiomarkerManagerPage = () => {
  const [pending, setPending] = useState<string[]>([]);
  const [categorized, setCategorized] = useState<CategorizedBiomarkers>({});
  const [allBiomarkerNames, setAllBiomarkerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetBiomarker, setTargetBiomarker] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

  const { toast } = useToast();

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!isRefetch) setLoading(true);
    setError(null);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch('/api/exames/biomarcadores/pendentes'),
        fetch('/api/exames/biomarcadores/all'),
      ]);

      if (!pendingRes.ok || !allRes.ok) {
        throw new Error('Falha ao carregar os dados dos biomarcadores.');
      }

      const pendingData = await pendingRes.json();
      const allData = await allRes.json();

      setPending(pendingData.sort());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Pendente, ...rest } = allData;
      setCategorized(rest);

      const allNames = [...new Set([...pendingData, ...Object.values(allData).flat()])].sort();
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

  const handleCategorize = async (biomarkerName: string, category: string) => {
    if (!category) {
        toast({ title: 'Ação Requerida', description: 'Por favor, selecione ou crie uma categoria.', variant: 'destructive' });
        return;
    }
    
    setUpdating(true);
    setTargetBiomarker(biomarkerName);

    try {
        const res = await fetch('/api/exames/biomarcadores/categorize', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ biomarkerName, newCategory: category }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Falha ao atualizar o biomarcador.');

        toast({ title: 'Sucesso!', description: `'${biomarkerName}' foi categorizado como '${category}'.` });
        
        setTargetBiomarker(null);
        setSelectedCategory('');
        setNewCategory('');
        fetchData(true);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
        toast({ title: 'Erro na Atualização', description: errorMessage, variant: 'destructive' });
    } finally {
        setUpdating(false);
    }
  };

  const categoryOptions = Object.keys(categorized).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center"><AlertTriangle className="mx-auto mb-2"/>{error}</div>;
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Gerenciador de Biomarcadores</h1>
      <p className="text-muted-foreground mb-8">Ferramentas para organizar, categorizar e unificar os dados de biomarcadores.</p>

      <CurationTools 
        categories={categoryOptions}
        allBiomarkers={allBiomarkerNames}
        onCuration={() => fetchData(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><AlertTriangle className="text-yellow-500 mr-2"/> Biomarcadores Pendentes</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-gray-500 flex items-center"><CheckCircle className="text-green-500 mr-2"/>Nenhum biomarcador pendente.</p>
            ) : (
              <div className="space-y-4">
                {pending.map(biomarker => (
                  <div key={biomarker} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="font-semibold text-lg">{biomarker}</p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Select onValueChange={setSelectedCategory}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Ou crie uma nova" onChange={e => setNewCategory(e.target.value)} />
                        <Button onClick={() => handleCategorize(biomarker, newCategory || selectedCategory)} disabled={updating && targetBiomarker === biomarker} className="flex-shrink-0">
                           {updating && targetBiomarker === biomarker ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Salvar'}
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Biomarcadores Categorizados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
                {Object.entries(categorized).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, biomarkers]) => (
                    <div key={category}>
                        <h3 className="font-bold text-xl cursor-pointer flex items-center" onClick={() => toggleCategory(category)}>
                           {expandedCategories[category] ? <ChevronDown className="mr-2"/> : <ChevronRight className="mr-2"/>} 
                           {category} <span className="ml-2 text-sm text-gray-500">({biomarkers.length})</span>
                        </h3>
                        {expandedCategories[category] && (
                            <div className="pl-6 mt-2 space-y-2">
                                {biomarkers.map(biomarker => (
                                    <div key={biomarker} className="p-2 border-b dark:border-gray-700 flex justify-between items-center">
                                        <span>{biomarker}</span>
                                        <Select onValueChange={(newCat) => handleCategorize(biomarker, newCat)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Mover para..." /></SelectTrigger>
                                            <SelectContent>{categoryOptions.filter(c => c !== category).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default BiomarkerManagerPage;
