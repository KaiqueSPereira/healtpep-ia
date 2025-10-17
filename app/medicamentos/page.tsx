
"use client";

import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import MedicamentoForm from "./components/MedicamentoForm";
import MedicamentoDetails from "./components/MedicamentoDetails"; // NOVO: Importa o componente de detalhes
import { toast } from "@/app/_hooks/use-toast";
import { PlusCircle, Loader2, Archive, User2, Stethoscope, HeartPulse, CalendarDays, BellRing, Pill, CalendarOff, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { calculateRemainingDays } from "./helpers/calculateRemainingDays";
import { MedicamentoComRelacoes, Profissional, Tratamento } from "@/app/_components/types";

interface Interaction {
    drug: string;
    interaction: string;
}

type ViewMode = 'details' | 'form'; // NOVO: Define os modos de visualização do Dialog

export default function MedicamentosPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoComRelacoes | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('form'); // NOVO: Estado para controlar a visualização
    
    const [medicamentos, setMedicamentos] = useState<MedicamentoComRelacoes[]>([]);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
    const [loading, setLoading] = useState(true);

    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [checkingInteractions, setCheckingInteractions] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const responses = await Promise.all([
                fetch('/api/medicamentos'),
                fetch('/api/profissionais'),
                fetch('/api/tratamentos')
            ]);

            for (const res of responses) {
                if (!res.ok) {
                    const errorBody = await res.text();
                    throw new Error(`Falha ao carregar dados da API: ${res.status} ${res.statusText}. Resposta: ${errorBody}`);
                }
            }

            const [medicamentosData, profissionaisData, tratamentosData] = await Promise.all(
                responses.map(res => res.json())
            );

            setMedicamentos(Array.isArray(medicamentosData) ? medicamentosData : []);
            setProfissionais(Array.isArray(profissionaisData) ? profissionaisData : []);
            setTratamentos(Array.isArray(tratamentosData) ? tratamentosData : []);

        } catch (error) {
            const message = (error as Error).message;
            toast({ title: "Erro ao carregar dados", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData() }, []);

    useEffect(() => {
        const checkInteractions = async () => {
            const activeMeds = medicamentos.filter(med => med.status === 'ATIVO' && med.principioAtivo);
            if (activeMeds.length < 2) {
                setInteractions([]);
                return;
            }
            setCheckingInteractions(true);
            try {
                const principiosAtivos = [...new Set(activeMeds.map(med => med.principioAtivo).filter(Boolean as any))];
                if (principiosAtivos.length < 2) return;

                const response = await fetch('/api/medicamentos/interactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ principiosAtivos })
                });
                if (!response.ok) return;

                const data = await response.json();
                if (data.interactions) setInteractions(data.interactions);

            } catch (error) {
                console.error("Erro ao verificar interações:", error);
            } finally {
                setCheckingInteractions(false);
            }
        };
        if (medicamentos.length > 0) checkInteractions();
    }, [medicamentos]);

    // --- FUNÇÕES DE MANIPULAÇÃO ATUALIZADAS ---
    const handleFormSubmit = () => {
        setIsDialogOpen(false);
        fetchData();
    };

    const handleAddClick = () => {
        setSelectedMedicamento(null);
        setViewMode('form');
        setIsDialogOpen(true);
    };

    const handleCardClick = (medicamento: MedicamentoComRelacoes) => {
        setSelectedMedicamento(medicamento);
        setViewMode('details'); // Abre primeiro nos detalhes
        setIsDialogOpen(true);
    };

    const handleSwitchToEdit = (medicamento: MedicamentoComRelacoes) => {
        setSelectedMedicamento(medicamento); // Garante que o medicamento está selecionado
        setViewMode('form'); // Muda para o modo formulário
    };

    const onDialogChange = (open: boolean) => {
        if (!open) setSelectedMedicamento(null);
        setIsDialogOpen(open);
    };

    // Determina o título do Dialog com base no modo e se é edição
    const getDialogTitle = () => {
        if (viewMode === 'form') {
            return selectedMedicamento ? 'Editar Medicamento' : 'Adicionar Medicamento';
        }
        return 'Detalhes do Medicamento'; // Título para o modo 'details'
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 space-y-6 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <h1 className="text-2xl font-bold mb-4 md:mb-0">Meus Medicamentos</h1>
                    <Button onClick={handleAddClick} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
                </div>

                {/* --- DIALOG ATUALIZADO PARA RENDERIZAÇÃO CONDICIONAL --- */}
                <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
                    <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                        {viewMode === 'details' && selectedMedicamento ? (
                            <MedicamentoDetails medicamento={selectedMedicamento} onEdit={handleSwitchToEdit} />
                        ) : (
                            <MedicamentoForm
                                medicamento={selectedMedicamento}
                                onFormSubmit={handleFormSubmit}
                                profissionais={profissionais}
                                tratamentos={tratamentos}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                
                {interactions.length > 0 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Alerta de Interação Medicamentosa</AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                            <p>Atenção: Foram detectadas possíveis interações entre seus medicamentos ativos. É importante discutir essa combinação com seu médico ou farmacêutico.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                {interactions.map((interaction, index) => (
                                    <li key={index}>
                                        <span className="font-semibold">{interaction.drug}: </span> 
                                        {interaction.interaction.length > 300 ? `${interaction.interaction.substring(0, 300)}...` : interaction.interaction}
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
                {checkingInteractions && (
                     <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Verificando interações...</div>
                )}

                <div className="border rounded-lg p-4 mt-6">
                    {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                    medicamentos.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {medicamentos.map(med => {
                                const diasRestantes = calculateRemainingDays({ ...med, dataInicio: new Date(med.dataInicio), createdAt: new Date(med.createdAt), updatedAt: new Date(med.updatedAt), dataFim: med.dataFim ? new Date(med.dataFim) : null });
                                return (
                                    <div key={med.id} onClick={() => handleCardClick(med)} className="cursor-pointer border rounded-lg p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:border-primary">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg pr-2">{med.nome}</h3>
                                                <Badge className={`${med.status === 'ATIVO' ? 'bg-green-100 text-green-800' : med.status === 'SUSPENSO' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{med.status}</Badge>
                                            </div>
                                            {med.posologia && <p className="text-sm text-muted-foreground mb-4">{med.posologia}</p>}
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {med.forma && <Badge variant="outline"><Pill className="mr-1 h-3 w-3" />{med.forma}</Badge>}
                                                {med.linkBula && <a href={med.linkBula} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Badge variant="secondary"><ExternalLink className="mr-1 h-3 w-3" />Bula</Badge></a>}
                                                <Badge variant="outline"><CalendarDays className="mr-1 h-3 w-3" />Início: {new Date(med.dataInicio).toLocaleDateString()}</Badge>
                                                {med.dataFim && <Badge variant="outline"><CalendarOff className="mr-1 h-3 w-3" />Fim: {new Date(med.dataFim).toLocaleDateString()}</Badge>}
                                                {med.estoque !== null && med.estoque > 0 && <Badge variant="outline" className={med.estoque <= 1 ? "text-red-600 border-red-300" : ""}><Archive className="mr-1 h-3 w-3" />{med.estoque} {med.estoque === 1 ? 'caixa' : 'caixas'}</Badge>}
                                                {diasRestantes !== null && (
                                                    <Badge variant={diasRestantes <= 7 ? "destructive" : "secondary"}>
                                                        <BellRing className="mr-1 h-3 w-3" />
                                                        Dura + {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {(med.profissional || med.consulta || med.tratamento) && (
                                            <div className="mt-4 border-t pt-3 space-y-2 text-sm text-muted-foreground">
                                                {med.profissional && (<div className="flex items-center"><User2 className="mr-2 h-4 w-4 shrink-0" /><span>Prescrito por <strong>{med.profissional.nome}</strong></span></div>)}
                                                {med.consulta && (<div className="flex items-center"><Stethoscope className="mr-2 h-4 w-4 shrink-0" /><span>Consulta de <strong>{new Date(med.consulta.data).toLocaleDateString()}</strong></span></div>)}
                                                {med.tratamento && (<div className="flex items-center"><HeartPulse className="mr-2 h-4 w-4 shrink-0" /><span>Do tratamento <strong>{med.tratamento.nome}</strong></span></div>)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-center text-gray-500 py-10">Nenhum medicamento adicionado ainda.</p>}
                </div>
            </main>
        </div>
    );
}
