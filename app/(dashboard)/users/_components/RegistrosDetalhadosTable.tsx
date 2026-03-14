'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/app/_components/ui/button';
import { Trash2, Edit, Camera, FileDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import EditRegistroDialog from './EditMedidasDialog';
import { FotosAcompanhamentoDialog } from './FotosAcompanhamentoDialog';
import { toast } from '@/app/_hooks/use-toast';

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
  const [isFotosDialogOpen, setFotosDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<PesoRegistro | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const sortedHistory = useMemo(() => {
    if (!registros) return [];
    return [...registros].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [registros]);

  const handleDelete = async (recordId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/medidas/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir o registro.');
      }
      onDataChange();
      toast({ title: 'Registro excluído com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao excluir registro:', error);
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (registro: PesoRegistro) => {
    setSelectedRegistro(registro);
    setEditDialogOpen(true);
  };
  
  const handleFotos = (registro: PesoRegistro) => {
    setSelectedRegistro(registro);
    setFotosDialogOpen(true);
  };

  const handleGenerateReport = async (period?: '1m' | '3m' | '1y') => {
    setIsGeneratingReport(true);
    try {
        let url = `/api/users/${userId}/medidas/report`;
        if (period) {
            url += `?period=${period}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Não foi possível gerar o relatório.');
        }
        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `relatorio_medidas_${userId}${period ? `_${period}` : ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(fileUrl);
        toast({ title: "Relatório gerado com sucesso!" });
    } catch (error) {
        toast({ title: "Erro ao gerar relatório", description: (error instanceof Error) ? error.message : 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
        setIsGeneratingReport(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-lg">Registros Detalhados</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isGeneratingReport || registros.length === 0}>
                {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Gerar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleGenerateReport()}>Completo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGenerateReport('1m')}>Último Mês</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGenerateReport('3m')}>Últimos 3 Meses</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGenerateReport('1y')}>Último Ano</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
                    <Button variant="ghost" size="icon" onClick={() => handleFotos(item)}><Camera className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Confirmar Exclusão</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        <>
          <EditRegistroDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setEditDialogOpen}
            onRegistroUpdated={onDataChange}
            registro={selectedRegistro}
            altura={altura}
            userId={userId}
          />
          <FotosAcompanhamentoDialog
            isOpen={isFotosDialogOpen}
            onOpenChange={setFotosDialogOpen}
            userId={userId}
            recordId={selectedRegistro.id}
          />
        </>
      )}
    </div>
  );
};

export default RegistrosDetalhadosTable;
