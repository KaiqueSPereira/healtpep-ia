'use client';

import { useState } from 'react';
import Link from 'next/link'; // Importando o componente Link
import { MedicamentoComRelacoes } from "@/app/_components/types";
import { format } from 'date-fns';
import AbastecimentoSection from './AbastecimentoSection';
import { Button } from '@/app/_components/ui/button'; // Importando o Button

interface MedicamentoDetailsProps {
    medicamento: MedicamentoComRelacoes;
}

export default function MedicamentoDetails({ medicamento: initialMedicamento }: MedicamentoDetailsProps) {
    const [medicamento, setMedicamento] = useState(initialMedicamento);

    const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
        <div className="py-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-md text-foreground">{value || 'N/A'}</p>
        </div>
    );

    // Função corrigida para aceitar o novo estoque total
    const handleAbastecimentoSuccess = (novoEstoque: number) => {
        setMedicamento(prev => ({
            ...prev,
            estoque: novoEstoque, // Apenas define o novo valor vindo do servidor
            ultimaAtualizacaoEstoque: new Date(),
        }));
    };

    return (
        <div className="p-4 bg-card text-card-foreground rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="Forma Farmacêutica" value={medicamento.forma} />
                <DetailItem label="Status" value={medicamento.status} />
                <DetailItem label="Tipo de Medicamento" value={medicamento.tipo.replace(/_/g, ' ')} />
                <DetailItem label="Data de Início" value={medicamento.dataInicio ? format(new Date(medicamento.dataInicio), 'dd/MM/yyyy') : 'N/A'} />
                {medicamento.dataFim && <DetailItem label="Data de Fim" value={format(new Date(medicamento.dataFim), 'dd/MM/yyyy')} />}
                {medicamento.linkBula && <div className="py-2"><p className="text-sm font-medium text-muted-foreground">Bula</p><a href={medicamento.linkBula} target="_blank" rel="noopener noreferrer" className="text-md text-primary hover:underline">Acessar bula</a></div>}
            </div>

            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Dosagem e Frequência</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <DetailItem label="Posologia" value={medicamento.posologia} />
                    <DetailItem label="Quantidade por Dose" value={medicamento.quantidadeDose} />
                    <DetailItem label="Frequência" value={medicamento.frequenciaNumero ? `${medicamento.frequenciaNumero} vez(es) a cada ${medicamento.frequenciaTipo}` : 'N/A'} />
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <DetailItem label="Estoque Atual" value={medicamento.estoque} /> 
                    <DetailItem label="Unidades por Caixa" value={medicamento.quantidadeCaixa} />
                    {medicamento.ultimaAtualizacaoEstoque && (
                        <DetailItem 
                            label="Última Atualização" 
                            value={format(new Date(medicamento.ultimaAtualizacaoEstoque), 'dd/MM/yyyy HH:mm')} 
                        />
                    )}
                </div>
            </div>
            
            <AbastecimentoSection 
                medicamentoId={medicamento.id} 
                onAbastecimentoSuccess={handleAbastecimentoSuccess} 
            />

            {/* Seção de "Origem e Contexto" aprimorada */}
            {(medicamento.profissional || medicamento.consulta || medicamento.condicaoSaude) &&
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold text-lg mb-2 text-foreground">Origem e Contexto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {medicamento.condicaoSaude && <DetailItem label="Tratamento para" value={medicamento.condicaoSaude.nome} />}
                        {medicamento.profissional && <DetailItem label="Profissional Responsável" value={medicamento.profissional.nome} />}
                    </div>

                    {/* Card de destaque para a consulta associada */}
                    {medicamento.consulta && (
                         <div className="mt-4 p-4 rounded-md border bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Associado à consulta de {format(new Date(medicamento.consulta.data), 'dd/MM/yyyy')}</p>
                            <p className="text-lg font-semibold text-foreground">{medicamento.consulta.motivo}</p>
                             <Link href={`/consultas/${medicamento.consulta.id}`} passHref>
                                <Button variant="outline" size="sm" className="mt-2">
                                    Ver Detalhes da Consulta
                                </Button>
                            </Link>
                         </div>
                    )}
                </div>
            }
        </div>
    );
}
