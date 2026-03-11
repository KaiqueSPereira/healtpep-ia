'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/app/_components/ui/button';
import { Trash2, Edit } from 'lucide-react';
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

interface RegistrosDetalhadosTableProps {
  userId: string;
  registros: PesoRegistro[];
  altura: number | null;
  onDataChange: () => void;
}

const RegistrosDetalhadosTable = ({ userId, registros, altura, onDataChange }: RegistrosDetalhadosTableProps) => {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<PesoRegistro | null>(null);

  const sortedHistory = useMemo(() => {
    if (!registros) return [];
    return [...registros].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [registros]);

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
    <div className="bg-card p-6 rounded-lg">
      <h4 className="font-semibold mb-3 text-lg">Registros Detalhados</h4>
      <div className="overflow-y-auto max-h-[260px] relative pr-2">
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
              sortedHistory.map(item => (
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

export default RegistrosDetalhadosTable;