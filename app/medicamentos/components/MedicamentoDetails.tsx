
"use client";

import { useState, useEffect } from 'react';
import { MedicamentoComRelacoes } from "@/app/_components/types";
import { DialogHeader, DialogTitle, DialogDescription } from "@/app/_components/ui/dialog";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { ExternalLink, Loader2, Pill, AlertCircle } from 'lucide-react';
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface MedicamentoDetailsProps {
    medicamento: MedicamentoComRelacoes;
    onEdit: (medicamento: MedicamentoComRelacoes) => void; // Função para mudar para o modo de edição
}

export default function MedicamentoDetails({ medicamento, onEdit }: MedicamentoDetailsProps) {
    const [adverseReactions, setAdverseReactions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reseta o estado sempre que o medicamento mudar
        setAdverseReactions([]);
        setError(null);
        setIsLoading(false);

        if (medicamento && medicamento.principioAtivo) {
            const fetchEffects = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/medicamentos/effects?principioAtivo=${encodeURIComponent(medicamento.principioAtivo!)}`);
                    if (!response.ok) {
                        throw new Error('Não foi possível buscar os efeitos colaterais.');
                    }
                    const data = await response.json();
                    if (data.adverse_reactions && data.adverse_reactions.length > 0) {
                        setAdverseReactions(data.adverse_reactions);
                    } else {
                        setAdverseReactions(["Nenhuma informação de efeito colateral encontrada para esta substância."]);
                    }
                } catch (err) {
                    const message = (err as Error).message;
                    setError(message);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchEffects();
        }
    }, [medicamento]);

    return (
        <div>
            <DialogHeader>
                <DialogTitle className="text-2xl">{medicamento.nome}</DialogTitle>
                {medicamento.principioAtivo && (
                    <DialogDescription>Princípio Ativo: {medicamento.principioAtivo}</DialogDescription>
                )}
            </DialogHeader>

            <div className="my-4 grid grid-cols-2 gap-4">
                {medicamento.linkBula && (
                    <a href={medicamento.linkBula} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full" variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver Bula Oficial (PDF)
                        </Button>
                    </a>
                )}
                <Button className="w-full" onClick={() => onEdit(medicamento)}>
                    Editar Informações
                </Button>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold">Possíveis Efeitos Colaterais</h3>
                <div className="border rounded-lg p-3 min-h-[150px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-destructive">
                            <AlertCircle className="h-6 w-6 mb-2" />
                            <p className="text-center">{error}</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[200px] w-full">
                           <div className="text-sm text-muted-foreground space-y-2">
                             {adverseReactions.map((reaction, index) => (
                                <p key={index}>{reaction}</p>
                             ))}
                           </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
