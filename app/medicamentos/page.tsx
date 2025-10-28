'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PlusCircle, Search, Trash2, Edit, Loader2 } from 'lucide-react';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/_components/ui/dialog';
import MedicamentoForm from './components/MedicamentoForm';
import MedicamentoDetails from './components/MedicamentoDetails';
import { MedicamentoComRelacoes } from '@/app/_components/types';
import { toast } from '@/app/_hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";

export default function MedicamentosPage() {
  const { data: session } = useSession();
  const [medicamentos, setMedicamentos] = useState<MedicamentoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoComRelacoes | null>(null);
  const [medicamentoToDelete, setMedicamentoToDelete] = useState<string | null>(null);

  const fetchMedicamentos = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      // CORRECTED: The API endpoint structure was slightly off. It should be under /api/medicamentos not users.
      const response = await fetch(`/api/medicamentos`); 
      if (!response.ok) {
        throw new Error('Falha ao carregar medicamentos');
      }
      const data = await response.json();
      setMedicamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const handleAddOrEdit = (medicamento?: MedicamentoComRelacoes) => {
    setSelectedMedicamento(medicamento || null);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (medicamento: MedicamentoComRelacoes) => {
    setSelectedMedicamento(medicamento);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteConfirmation = (medicamentoId: string) => {
    setMedicamentoToDelete(medicamentoId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!medicamentoToDelete) return;
    try {
      const response = await fetch(`/api/medicamentos/${medicamentoToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar medicamento');
      }
      toast({ title: "Sucesso!", description: "Medicamento deletado." });
      fetchMedicamentos(); // Re-fetch data
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setMedicamentoToDelete(null);
    }
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchMedicamentos();
  };

  const filteredMedicamentos = useMemo(() => {
    return medicamentos.filter(m =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.principioAtivo && m.principioAtivo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [medicamentos, searchTerm]);

  const renderMedicamentoCard = (medicamento: MedicamentoComRelacoes) => (
    <div key={medicamento.id} className="bg-white shadow rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-bold text-lg cursor-pointer" onClick={() => handleViewDetails(medicamento)}>{medicamento.nome}</h3>
        <p className="text-sm text-gray-600">{medicamento.principioAtivo}</p>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${medicamento.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {medicamento.status}
        </span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" size="icon" onClick={() => handleAddOrEdit(medicamento)}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(medicamento.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Meus Medicamentos</h1>
            <Button onClick={() => handleAddOrEdit()}> <PlusCircle className="mr-2 h-4 w-4" /> Adicionar </Button>
          </div>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome ou princípio ativo..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredMedicamentos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedicamentos.map(renderMedicamentoCard)}
            </div>
          ) : (
            <div className="text-center py-10">
              <p>Nenhum medicamento encontrado.</p>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMedicamento ? 'Editar Medicamento' : 'Adicionar Novo Medicamento'}</DialogTitle>
          </DialogHeader>
          <MedicamentoForm
            medicamento={selectedMedicamento}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Medicamento</DialogTitle>
            <DialogDescription>Informações completas sobre o medicamento &quot;{selectedMedicamento?.nome}&quot;.</DialogDescription>
          </DialogHeader>
          {selectedMedicamento && <MedicamentoDetails medicamento={selectedMedicamento} />}
        </DialogContent>
      </Dialog>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá deletar permanentemente o medicamento do seu histórico.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
