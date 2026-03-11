'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Zap, Loader2, ServerCrash, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Button } from '@/app/_components/ui/button';
import AddBioimpedanciaDialog from './AddBioimpedanciaDialog';

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
  taxaMetabolica?: number | null; // Corrigido de metabolismoBasal
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
        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>% Gordura</TableHead><TableHead>M. Muscular</TableHead><TableHead>Idade Corporal</TableHead><TableHead>Anexos</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map(b => (
            <TableRow key={b.id}>
              <TableCell>{formatDate(b.data)}</TableCell>
              <TableCell>{b.gorduraCorporal ? `${b.gorduraCorporal.toFixed(1)}%` : '-'}</TableCell>
              <TableCell>{b.massaMuscular ? `${b.massaMuscular.toFixed(1)} kg` : '-'}</TableCell>
              <TableCell>{b.idadeCorporal || '-'}</TableCell>
              <TableCell>
                {b.anexos && b.anexos.length > 0 ? (
                    <Button variant="outline" size="sm" asChild>
                        {/* O link de download precisará de uma API específica no futuro */}
                        <a href={`/api/bioimpedancias/anexos/${b.anexos[0].id}`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            {b.anexos[0].nomeArquivo.substring(0, 15)}...
                        </a>
                    </Button>
                ) : '-'}
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
        <AddBioimpedanciaDialog userId={userId} onSuccess={fetchData} />
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default BioimpedanciaTab;
