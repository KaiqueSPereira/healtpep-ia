'use client';
import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Button } from '@/app/_components/ui/button';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import AddRegistroDialog from './AddMedidasDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import EditRegistroDialog from './EditMedidasDialog';

interface PesoRegistro {
  id: string;
  data: string;
  peso: string;
  imc?: string | null;
  cintura?: string | null;
  quadril?: string | null;
}

interface PesoHistoryChartProps {
  userId: string;
  historicoPeso: PesoRegistro[];
  altura: number | null;
  onDataChange: () => void;
}

const PesoHistoryChart = ({ userId, historicoPeso, altura, onDataChange }: PesoHistoryChartProps) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<PesoRegistro | null>(null);

  const sortedHistory = useMemo(() => {
    if (!historicoPeso) return [];
    return [...historicoPeso].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [historicoPeso]);

  const formattedHistoryForChart = useMemo(() => {
    return sortedHistory.map(item => ({
      ...item,
      data: format(parseISO(item.data), 'dd/MM'),
      peso: parseFloat(item.peso.replace(',', '.')),
    }));
  }, [sortedHistory]);

  const handleDelete = async (recordId: string) => {
    if (confirm('Tem certeza que deseja excluir este registro? Os dados de bioimpedância do mesmo dia também serão removidos.')) {
      try {
        const response = await fetch(`/api/users/${userId}/medidas/${recordId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao excluir o registro.');
        }
        onDataChange();
      } catch (error: any) {
        console.error('Erro ao excluir registro:', error);
        alert(`Erro ao excluir: ${error.message}`);
      }
    }
  };

  const handleEdit = (registro: PesoRegistro) => {
    setSelectedRegistro(registro);
    setEditDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-card p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Histórico de Peso</h3>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Registro
        </Button>
      </div>

      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={formattedHistoryForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="data" stroke="#888" fontSize={12} />
            <YAxis 
                stroke="#888" 
                fontSize={12} 
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
                contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: '#3b82f6',
                }}
            />
            <Area type="monotone" dataKey="peso" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPeso)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex-grow">
        <h4 className="font-semibold mb-3 text-lg">Registros Detalhados</h4>
        <div className="overflow-y-auto max-h-60 relative pr-2">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>IMC</TableHead>
                <TableHead>Cintura</TableHead>
                <TableHead>Quadril</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.length > 0 ? (
                sortedHistory.slice().reverse().map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{format(parseISO(item.data), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.peso} kg</TableCell>
                    <TableCell>{item.imc ? parseFloat(item.imc.replace(',', '.')).toFixed(2) : '-'}</TableCell>
                    <TableCell>{item.cintura ? `${item.cintura} cm` : '-'}</TableCell>
                    <TableCell>{item.quadril ? `${item.quadril} cm` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-4">Nenhum registro encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddRegistroDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onRegistroAdded={onDataChange}
        userId={userId}
        altura={altura}
      />

      {selectedRegistro && (
        <EditRegistroDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setEditDialogOpen}
          onRegistroUpdated={onDataChange}
          registro={selectedRegistro}
          altura={altura}
          userId={userId}
        />
      )}
    </div>
  );
};

export default PesoHistoryChart;
