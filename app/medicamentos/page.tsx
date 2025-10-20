
"use client";

import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import MedicamentoForm from "./components/MedicamentoForm";
import MedicamentoDetails from "./components/MedicamentoDetails";
import { toast } from "@/app/_hooks/use-toast";
import { PlusCircle, Loader2, Archive, User2, Stethoscope, HeartPulse, CalendarDays, BellRing, Pill, CalendarOff, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { calculateRemainingDays } from "./helpers/calculateRemainingDays";
import { MedicamentoComRelacoes, Profissional, CondicaoSaude } from "@/app/_components/types";

interface Interaction {
    drug: string;
    interaction: string;
}

type ViewMode = 'details' | 'form';

export default function MedicamentosPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoComRelacoes | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('form');
    
    const [medicamentos, setMedicamentos] = useState<MedicamentoComRelacoes[]>([]);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    // UPDATED: State for CondicaoSaude
    const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]);
    const [loading, setLoading] = useState(true);

    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [checkingInteractions, setCheckingInteractions] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // UPDATED: API endpoint for condicoes
            const responses = await Promise.all([
                fetch('/api/medicamentos'),
                fetch('/api/profissionais'),
                fetch('/api/condicoes')
            ]);

            for (const res of responses) {
                if (!res.ok) {
                    const errorBody = await res.text();
                    throw new Error(`Falha ao carregar dados da API: ${res.status} ${res.statusText}. Resposta: ${errorBody}`);
                }
            }

            // UPDATED: Destructuring for condicoesSaudeData
            const [medicamentosData, profissionaisData, condicoesSaudeData] = await Promise.all(
                responses.map(res => res.json())
            );

            setMedicamentos(Array.isArray(medicamentosData) ? medicamentosData : []);
            setProfissionais(Array.isArray(profissionaisData) ? profissionaisData : []);
            // UPDATED: Setting state for condicoesSaude
            setCondicoesSaude(Array.isArray(condicoesSaudeData) ? condicoesSaudeData : []);

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
        setViewMode('details');
        setIsDialogOpen(true);
    };

    const handleSwitchToEdit = (medicamento: MedicamentoComRelacoes) => {
        setSelectedMedicamento(medicamento);
        setViewMode('form');
    };

    const onDialogChange = (open: boolean) => {
        if (!open) setSelectedMedicamento(null);
        setIsDialogOpen(open);
    };

    const getDialogTitle = () => {
        if (viewMode === 'form') {
            return selectedMedicamento ? 'Editar Medicamento' : 'Adicionar Medicamento';
        }
        return 'Detalhes do Medicamento';
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 space-y-6 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <h1 className="text-2xl font-bold mb-4 md:mb-0">Meus Medicamentos</h1>
                    <Button onClick={handleAddClick} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
                    <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                        {viewMode === 'details' && selectedMedicamento ? (
                            <MedicamentoDetails medicamento={selectedMedicamento} onEdit={handleSwitchToEdit} />
                        ) : (
                            // UPDATED: Passing condicoesSaude to MedicamentoForm
                            <MedicamentoForm
                                medicamento={selectedMedicamento}
                                onFormSubmit={handleFormSubmit}
                                profissionais={profissionais}
                                condicoesSaude={condicoesSaude}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                
                {/* ... (Interaction Alert remains the same) ... */}

                <div className="border rounded-lg p-4 mt-6">
                    {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                    medicamentos.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {medicamentos.map(med => {
                                const diasRestantes = calculateRemainingDays({ ...med, dataInicio: new Date(med.dataInicio), createdAt: new Date(med.createdAt), updatedAt: new Date(med.updatedAt), dataFim: med.dataFim ? new Date(med.dataFim) : null });
                                return (
                                    <div key={med.id} onClick={() => handleCardClick(med)} className="cursor-pointer border rounded-lg p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:border-primary">
                                        <div>
                                          {/* ... (Card Header and Badges remain the same) ... */}
                                        </div>
                                        {/* UPDATED: Check and display for condicaoSaude */}
                                        {(med.profissional || med.consulta || med.condicaoSaude) && (
                                            <div className="mt-4 border-t pt-3 space-y-2 text-sm text-muted-foreground">
                                                {med.profissional && (<div className="flex items-center"><User2 className="mr-2 h-4 w-4 shrink-0" /><span>Prescrito por <strong>{med.profissional.nome}</strong></span></div>)}
                                                {med.consulta && (<div className="flex items-center"><Stethoscope className="mr-2 h-4 w-4 shrink-0" /><span>Consulta de <strong>{new Date(med.consulta.data).toLocaleDateString()}</strong></span></div>)}
                                                {med.condicaoSaude && (<div className="flex items-center"><HeartPulse className="mr-2 h-4 w-4 shrink-0" /><span>Condição de Saúde: <strong>{med.condicaoSaude.nome}</strong></span></div>)}
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
