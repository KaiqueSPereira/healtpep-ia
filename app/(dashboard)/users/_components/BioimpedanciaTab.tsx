'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Bioimpedancia } from '@prisma/client';
import { useParams } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import AddBioimpedanciaDialog from './AddMedidasDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";

interface BioimpedanciaTabProps {
  canEdit: boolean;
  onDataAdded: () => void;
}

const BioimpedanciaTab = ({ canEdit, onDataAdded }: BioimpedanciaTabProps) => {
  const { id: userId } = useParams();
  const [bioimpedancias, setBioimpedancias] = useState<Bioimpedancia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBioimpedancia = useCallback(async () => {
    if (typeof userId !== 'string') return;
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`); // Rota da API corrigida
      if (!response.ok) throw new Error('Falha ao buscar dados de bioimpedância');
      const data = await response.json();
      // Filtra corretamente os dados de bioimpedância
      const bioData = data.historicoPeso?.filter((d: any) => d.gorduraCorporal != null) || [];
      setBioimpedancias(bioData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBioimpedancia();
  }, [fetchBioimpedancia]);
  
  const handleDataAdded = () => {
    fetchBioimpedancia();
    onDataAdded();
  };

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center"><Zap className="mr-2" /> Bioimpedância</CardTitle>
          {canEdit && <AddBioimpedanciaDialog onDataAdded={handleDataAdded} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {bioimpedancias.length > 0 ? (
              <Table>
                 <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>% Gordura</TableHead><TableHead>Massa Muscular</TableHead><TableHead>Idade Corporal</TableHead></TableRow></TableHeader>
                 <TableBody>
                  {bioimpedancias.map(b => (
                    <TableRow key={b.id}><TableCell>{formatDate(b.data)}</TableCell><TableCell>{b.gorduraCorporal || '-'}</TableCell><TableCell>{b.massaMuscular || '-'}</TableCell><TableCell>{b.idadeCorporal || '-'}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground text-center py-4">Nenhum resultado de bioimpedância registrado.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BioimpedanciaTab;
