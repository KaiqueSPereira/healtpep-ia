'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { AcompanhamentoCorporal, Bioimpedancia } from '@prisma/client';
import useAuthStore from '@/app/_stores/authStore';
import { useParams } from 'next/navigation';
import { Ruler, Zap, Loader2 } from 'lucide-react';
import AddMedidasDialog from './AddMedidasDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";

const MedidasCorporaisTab = () => {
  const { id: userId } = useParams();
  const { session } = useAuthStore();
  const [bioimpedancias, setBioimpedancias] = useState<Bioimpedancia[]>([]);
  const [medidas, setMedidas] = useState<AcompanhamentoCorporal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedidas = useCallback(async () => {
    if (typeof userId !== 'string') return;
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/medidas`);
      if (!response.ok) throw new Error('Falha ao buscar medidas');
      const data = await response.json();
      setBioimpedancias(data.bioimpedancias || []);
      setMedidas(data.acompanhamentos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMedidas();
  }, [fetchMedidas]);

  const canEdit = session?.user?.id === userId;

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center"><Ruler className="mr-2" /> Medidas Corporais</CardTitle>
          {canEdit && <AddMedidasDialog onDataAdded={fetchMedidas} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="medidas">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medidas"><Ruler className="mr-2 h-4 w-4" />Medidas</TabsTrigger>
              <TabsTrigger value="bioimpedancia"><Zap className="mr-2 h-4 w-4" />Bioimpedância</TabsTrigger>
            </TabsList>
            
            <TabsContent value="medidas" className="mt-4">
              {medidas.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Peso</TableHead><TableHead>Cintura</TableHead><TableHead>Quadril</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {medidas.map(m => (
                      <TableRow key={m.id}><TableCell>{formatDate(m.data)}</TableCell><TableCell>{m.peso || '-'}</TableCell><TableCell>{m.cintura || '-'}</TableCell><TableCell>{m.quadril || '-'}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground text-center py-4">Nenhuma medida corporal registrada.</p>}
            </TabsContent>

            <TabsContent value="bioimpedancia" className="mt-4">
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
            </TabsContent>

          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default MedidasCorporaisTab;
