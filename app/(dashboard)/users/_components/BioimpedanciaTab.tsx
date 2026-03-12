'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Zap, Loader2, ServerCrash, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import AddBioimpedanciaDialog from './AddBioimpedanciaDialog';
import BioimpedanciaActions from './BioimpedanciaActions';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';

interface Anexo {
  id: string;
  nomeArquivo: string;
  mimetype: string;
}

interface BioimpedanceRecord {
  id: string;
  data: string;
  gorduraCorporal?: number | null;
  gorduraVisceral?: number | null;
  massaMuscular?: number | null;
  aguaCorporal?: number | null;
  massaOssea?: number | null;
  taxaMetabolica?: number | null; 
  idadeCorporal?: number | null;
  anexos: Anexo[];
}

interface BioimpedanciaTabProps {
  userId: string;
}

const BioimpedanciaTab = ({ userId }: BioimpedanciaTabProps) => {
  const [data, setData] = useState<BioimpedanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}/bioimpedancias`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de bioimpedância.');
      }
      const result = await response.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId, fetchData]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
        const response = await fetch(`/api/users/${userId}/bioimpedancias/report`);
        if (!response.ok) {
            throw new Error('Não foi possível gerar o relatório. Verifique se existem dados de bioimpedância.');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_bioimpedancia_${userId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: "Relatório gerado com sucesso!" });
    } catch (error) {
        toast({ title: "Erro ao gerar relatório", description: (error instanceof Error) ? error.message : 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
        setIsGeneratingReport(false);
    }
  };

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-destructive">
          <ServerCrash className="h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return <p className="text-muted-foreground text-center py-4">Nenhum resultado de bioimpedância registrado.</p>;
    }

    return (
      <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>% Gordura</TableHead>
                <TableHead>G. Visceral</TableHead>
                <TableHead>M. Muscular</TableHead>
                <TableHead>% Água</TableHead>
                <TableHead>M. Óssea</TableHead>
                <TableHead>TMB</TableHead>
                <TableHead>Id. Corporal</TableHead>
                <TableHead>Ações</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(b => (
            <TableRow key={b.id}>
              <TableCell>{formatDate(b.data)}</TableCell>
              <TableCell>{b.gorduraCorporal ? `${b.gorduraCorporal.toFixed(1)}%` : '-'}</TableCell>
              <TableCell>{b.gorduraVisceral ? b.gorduraVisceral.toFixed(1) : '-'}</TableCell>
              <TableCell>{b.massaMuscular ? `${b.massaMuscular.toFixed(1)} kg` : '-'}</TableCell>
              <TableCell>{b.aguaCorporal ? `${b.aguaCorporal.toFixed(1)}%` : '-'}</TableCell>
              <TableCell>{b.massaOssea ? `${b.massaOssea.toFixed(1)} kg` : '-'}</TableCell>
              <TableCell>{b.taxaMetabolica ? b.taxaMetabolica.toFixed(0) : '-'}</TableCell>
              <TableCell>{b.idadeCorporal || '-'}</TableCell>
              <TableCell>
                <BioimpedanciaActions record={b} onSuccess={fetchData} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" />
          Bioimpedância
        </CardTitle>
        <div className="flex items-center gap-2">
            <Button onClick={handleGenerateReport} variant="outline" size="sm" disabled={isGeneratingReport || data.length === 0}>
                {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Gerar Relatório
            </Button>
            <AddBioimpedanciaDialog userId={userId} onSuccess={fetchData} />
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default BioimpedanciaTab;
