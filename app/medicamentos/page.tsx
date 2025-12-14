'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PlusCircle, Search, Trash2, Edit, Loader2, Pill, Droplet, SprayCan as Spray, Syringe, AlertTriangle } from 'lucide-react';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_components/ui/dialog';
import MedicamentoForm from './components/MedicamentoForm';
import MedicamentoDetails from './components/MedicamentoDetails';
import { MedicamentoComRelacoes, CondicaoSaude, Profissional, Consulta } from '@/app/_components/types';
import { toast } from '@/app/_hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { Badge } from '@/app/_components/ui/badge';

// Tipos para a resposta da API de Interação
interface Interaction {
    medicamentoA: string;
    medicamentoB: string;
    gravidade: string;
    descricao: string;
}

export default function MedicamentosPage() {
  const { data: session } = useSession();
  const [medicamentos, setMedicamentos] = useState<MedicamentoComRelacoes[]>([]);
  const [condicoes, setCondicoes] = useState<CondicaoSaude[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoComRelacoes | null>(null);
  const [medicamentoToDelete, setMedicamentoToDelete] = useState<string | null>(null);

  // Estados para a verificação de interação
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [interactionMessage, setInteractionMessage] = useState<string>('');

  const fetchMedicamentos = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const [medicamentosRes, condicoesRes, profissionaisRes, consultasRes] = await Promise.all([
        fetch(`/api/medicamentos`),
        fetch(`/api/condicoessaude`),
        fetch(`/api/profissionais`),
        fetch(`/api/consultas`)
      ]);

      if (!medicamentosRes.ok) throw new Error('Falha ao carregar medicamentos');
      if (!condicoesRes.ok) throw new Error('Falha ao carregar condições de saúde');
      if (!profissionaisRes.ok) throw new Error('Falha ao carregar profissionais');
      if (!consultasRes.ok) throw new Error('Falha ao carregar consultas');

      const medicamentosData = await medicamentosRes.json();
      const condicoesData = await condicoesRes.json();
      const profissionaisData = await profissionaisRes.json();
      const consultasData = await consultasRes.json();

      setMedicamentos(Array.isArray(medicamentosData) ? medicamentosData : []);
      setCondicoes(Array.isArray(condicoesData) ? condicoesData : []);
      setProfissionais(Array.isArray(profissionaisData) ? profissionaisData : []);
      setConsultas(Array.isArray(consultasData) ? consultasData : []);

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

  const handleCheckInteractions = async () => {
    setIsInteractionModalOpen(true);
    setIsCheckingInteractions(true);
    setInteractions([]);
    setDisclaimer('');
    setInteractionMessage('');

    try {
        const response = await fetch('/api/medicamentos/interactions');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Falha ao verificar interações.');
        }

        setInteractions(data.interactions || []);
        setDisclaimer(data.disclaimer || '');
        setInteractionMessage(data.message || '');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        setInteractionMessage(errorMessage);
    } finally {
        setIsCheckingInteractions(false);
    }
  };

  const filteredMedicamentos = useMemo(() => {
    return medicamentos.filter(m =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.principioAtivo && m.principioAtivo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [medicamentos, searchTerm]);

  const getFormaIcon = (forma: string | null | undefined) => {
    const formaLower = forma?.toLowerCase() || '';
    if (formaLower.includes('comprimido') || formaLower.includes('cápsula') || formaLower.includes('drágea')) {
        return <Pill className="h-5 w-5 text-muted-foreground" />;
    }
    if (formaLower.includes('gota') || formaLower.includes('colírio')) {
        return <Droplet className="h-5 w-5 text-muted-foreground" />;
    }
    if (formaLower.includes('spray') || formaLower.includes('aerossol')) {
        return <Spray className="h-5 w-5 text-muted-foreground" />;
    }
    if (formaLower.includes('injetável') || formaLower.includes('injeção')) {
        return <Syringe className="h-5 w-5 text-muted-foreground" />;
    }
    return <Pill className="h-5 w-5 text-muted-foreground" />;
  };

  const renderMedicamentoCard = (medicamento: MedicamentoComRelacoes) => {
    const formaIcon = getFormaIcon(medicamento.forma);
    return (
      <div key={medicamento.id} className="bg-card text-card-foreground shadow rounded-lg p-3 flex flex-col justify-between hover:shadow-lg transition-shadow border">
          <div className="flex-grow cursor-pointer" onClick={() => handleViewDetails(medicamento)}>
              <div className="flex items-start gap-3">
                  <div className="mt-1">{formaIcon}</div>
                  <div className="flex-grow">
                      <h3 className="font-bold text-md leading-tight">{medicamento.nome}</h3>
                      <span className={`mt-1.5 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${medicamento.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                          {medicamento.status}
                      </span>
                  </div>
              </div>
          </div>
          <div className="flex justify-end gap-1 mt-3">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleAddOrEdit(medicamento)}>
                  <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteConfirmation(medicamento.id)}>
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
      </div>
    );
  }

  const ativosCount = useMemo(() => medicamentos.filter(m => m.status === 'Ativo').length, [medicamentos]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 gap-2">
            <h1 className="text-3xl font-bold text-foreground">Meus Medicamentos</h1>
            <div className="flex gap-2">
                <Button onClick={handleCheckInteractions} disabled={ativosCount < 1} variant="outline">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Verificar Interações
                </Button>
                <Button onClick={() => handleAddOrEdit()}> <PlusCircle className="mr-2 h-4 w-4" /> Adicionar </Button>
            </div>
          </div>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMedicamentos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedicamentos.map(renderMedicamentoCard)}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum medicamento encontrado.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modais */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMedicamento ? 'Editar Medicamento' : 'Adicionar Novo Medicamento'}</DialogTitle>
          </DialogHeader>
          <MedicamentoForm medicamento={selectedMedicamento} onSave={handleSave} condicoes={condicoes} profissionais={profissionais} consultas={consultas} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Medicamento</DialogTitle>
            <DialogDescription>Informações completas sobre o medicamento &quot;{selectedMedicamento?.nome}&quot;.</DialogDescription>
          </DialogHeader>
          {selectedMedicamento && <MedicamentoDetails medicamento={selectedMedicamento} />}
        </DialogContent>
      </Dialog>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá deletar permanentemente o medicamento do seu histórico.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Verificação de Interação (limpo, sem debug) */}
        <Dialog open={isInteractionModalOpen} onOpenChange={setIsInteractionModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Verificador de Interação Medicamentosa</DialogTitle>
                    <DialogDescription>Verificando interações entre seus medicamentos ativos.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isCheckingInteractions ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div>
                            {interactionMessage && !interactions.length && <p className="text-center text-muted-foreground mb-4">{interactionMessage}</p>}

                            {interactions.length > 0 ? (
                                <div className="space-y-4">
                                    {interactions.map((interaction, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-lg text-foreground">{interaction.medicamentoA} + {interaction.medicamentoB}</h3>
                                                <Badge variant={interaction.gravidade.toLowerCase() === 'high' ? 'destructive' : 'secondary'}>{interaction.gravidade}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">{interaction.descricao}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center h-40 flex flex-col justify-center items-center">
                                   <p className="text-lg font-semibold text-green-600">Nenhuma interação encontrada</p>
                                   <p className="text-sm text-muted-foreground mt-2">Não foram encontradas interações significativas entre seus medicamentos ativos.</p>
                                </div>
                            )}
                            
                            {disclaimer && <p className="text-xs text-muted-foreground mt-6 italic">{disclaimer}</p>}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInteractionModalOpen(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
