'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";

// Interface para os registros de histórico
interface PesoRegistro {
  id: string;
  data: string;
  gorduraCorporal?: string | null;
  massaMuscular?: string | null;
  idadeCorporal?: string | null;
  // outros campos podem estar presentes, mas não são usados aqui
}

interface BioimpedanciaTabProps {
  historico: PesoRegistro[];
}

const BioimpedanciaTab = ({ historico }: BioimpedanciaTabProps) => {
  // Filtra o histórico para exibir apenas registros com dados de bioimpedância
  const bioimpedancias = useMemo(() => {
    if (!historico) return [];
    return historico
      .filter(d => d.gorduraCorporal != null || d.massaMuscular != null || d.idadeCorporal != null)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [historico]);

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Zap className="mr-2" /> Bioimpedância</CardTitle>
      </CardHeader>
      <CardContent>
        {bioimpedancias.length > 0 ? (
          <Table>
             <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>% Gordura</TableHead><TableHead>Massa Muscular</TableHead><TableHead>Idade Corporal</TableHead></TableRow></TableHeader>
             <TableBody>
              {bioimpedancias.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{formatDate(b.data)}</TableCell>
                  <TableCell>{b.gorduraCorporal ? `${b.gorduraCorporal}%` : '-'}</TableCell>
                  <TableCell>{b.massaMuscular ? `${b.massaMuscular} kg` : '-'}</TableCell>
                  <TableCell>{b.idadeCorporal || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <p className="text-muted-foreground text-center py-4">Nenhum resultado de bioimpedância registrado.</p>}
      </CardContent>
    </Card>
  );
};

export default BioimpedanciaTab;
