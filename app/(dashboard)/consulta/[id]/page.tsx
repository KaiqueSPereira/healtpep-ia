'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/app/_hooks/use-toast';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { ChevronLeftIcon, Edit, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import AnexoPreviewModal from '../components/AnexoPreviewModal';
import { Anexo, Consulta, TimelineItem, Anotacao } from '@/app/_components/types'; 
import { HistoricoTratamentoItem, ExameComRelacoes } from '../types';
import AnexosList from '../components/AnexosList';
import AnexoUploader from '../components/AnexoUploader';
import HistoricoTratamentoCard from '../components/HistoricoTratamentoCard';
import ConsultaPageSkeleton from '../components/ConsultaPageSkeleton';
import AnotacoesCard from '../components/AnotacoesCard';

const ConsultaPage = () => {
    const router = useRouter();
    const params = useParams();
    const [consulta, setConsulta] = useState<Consulta | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddAnexo, setShowAddAnexo] = useState(false);
    const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);
    const [novaAnotacaoContent, setNovaAnotacaoContent] = useState("");

    useEffect(() => {
        const fetchConsulta = async () => {
            setLoading(true);
            try {
                if (!params.id) return;
                const response = await fetch(`/api/consultas/${params.id}`);
                if (!response.ok) throw new Error('Consulta não encontrada');
                const data = await response.json();
                setConsulta(data);
            } catch (error) {
                toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
                router.push('/consultas');
            } finally {
                setLoading(false);
            }
        };

        fetchConsulta();
    }, [params.id, router]);

    const timelineUnificada: TimelineItem[] = useMemo(() => {
        if (!consulta) return [];
        
        const historico: HistoricoTratamentoItem[] = (consulta.historicoTratamento as unknown as HistoricoTratamentoItem[]) || [];

        const consultas: TimelineItem[] = historico
            .filter(item => !!item.data)
            .map((item: HistoricoTratamentoItem) => ({
                id: item.id,
                data: item.data,
                tipo: item.tipo,
                motivo: item.motivo || 'Consulta de rotina',
                profissional: item.profissional,
                unidade: item.unidade,
                entryType: 'consulta',
                href: `/consulta/${item.id}`,
                anotacao: null, 
            }));

        const isRetorno = !!consulta.consultaOrigem;
        const examesDoContexto: ExameComRelacoes[] = (isRetorno ? consulta.consultaOrigem?.Exame || [] : consulta.Exame || []) as ExameComRelacoes[];

        const exames: TimelineItem[] = examesDoContexto
            .filter(exame => !!exame.dataExame)
            .map((exame: ExameComRelacoes) => ({
                id: exame.id,
                data: exame.dataExame!,
                tipo: exame.tipo || 'Exame',
                motivo: 'Solicitação de Exame',
                profissional: exame.profissional,
                unidade: exame.unidades,
                entryType: 'exame',
                href: `/exames/${exame.id}`,
                anotacao: exame.anotacao,
            }));

        const todosOsItens = [...consultas, ...exames];
        todosOsItens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        return todosOsItens;
    }, [consulta]);

    const handleAnexoAdicionado = (newAnexo: Anexo) => {
        if (consulta) {
            setConsulta(prev => prev ? { ...prev, anexos: [...(prev.anexos || []), newAnexo] } : null);
        }
        setShowAddAnexo(false);
    };

    const handleDeleteAnexo = async (anexoId: string) => {
        if (!consulta) return;
        try {
            const response = await fetch(`/api/consultas/${consulta.id}/anexos/${anexoId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Falha ao deletar anexo');
            }
            setConsulta(prev => prev ? { ...prev, anexos: prev.anexos?.filter(a => a.id !== anexoId) } : null);
            toast({ title: "Anexo deletado com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao deletar anexo", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleAdicionarAnotacao = async () => {
        if (!consulta || !novaAnotacaoContent.trim()) {
            toast({ title: "Anotação vazia", description: "Por favor, escreva algo antes de adicionar.", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch(`/api/consultas/${consulta.id}/anotacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anotacao: novaAnotacaoContent }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao adicionar anotação');
            }

            const novaAnotacao: Anotacao = await response.json();

            setConsulta(prev => {
                if (!prev) return null;
                const existingAnotacoes = prev.Anotacao || [];
                return {
                    ...prev,
                    Anotacao: [...existingAnotacoes, novaAnotacao],
                };
            });

            setNovaAnotacaoContent("");
            toast({ title: "Anotação adicionada com sucesso!" });

        } catch (error) {
            toast({ title: "Erro ao adicionar anotação", description: (error as Error).message, variant: "destructive" });
        }
    };

    if (loading) return <ConsultaPageSkeleton />;
    if (!consulta) return <div className="container mx-auto p-6"><h1>Consulta não encontrada</h1></div>;

    return (
        <div className="h-full flex flex-col">
            <header className="relative w-full px-5 py-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.push('/consulta')} className="absolute left-5 top-1/2 -translate-y-1/2">
                    <ChevronLeftIcon className="h-6 w-6" />
                    <span className="ml-2">Voltar</span>
                </Button>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-semibold">Detalhes da Consulta</h1>
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Button onClick={() => router.push(`/consulta/${consulta.id}/editar`)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="container mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/3 space-y-6">
                        <Tabs defaultValue="geral" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                                <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
                            </TabsList>
                            <TabsContent value="geral" className="space-y-6 pt-4">
                                <Card>
                                    <CardHeader><CardTitle>Informações da Consulta</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <p><strong>Tipo:</strong> {consulta.tipo}</p>
                                        {consulta.condicaoSaude && (
                                            <p><strong>Condição de Saúde:</strong> {consulta.condicaoSaude.nome}</p>
                                        )}
                                        <p><strong>Data:</strong> {new Date(consulta.data).toLocaleString()}</p>
                                        <p><strong>Profissional:</strong> {consulta.profissional?.nome || 'Não especificado'}</p>
                                        <p><strong>Unidade:</strong> {consulta.unidade?.nome || 'Não especificada'}</p>
                                        <p><strong>Motivo:</strong> {consulta.motivo}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Anexos</CardTitle>
                                        <Button onClick={() => setShowAddAnexo(true)} size="sm">
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Adicionar Anexo
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <AnexosList
                                            anexos={consulta.anexos || []}
                                            onAnexoClick={setSelectedAnexo}
                                            onDeleteAnexo={handleDeleteAnexo}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="anotacoes" className="pt-4">
                                <AnotacoesCard 
                                    anotacoes={consulta.Anotacao || []} 
                                    novaAnotacaoContent={novaAnotacaoContent} 
                                    setNovaAnotacaoContent={setNovaAnotacaoContent} 
                                    handleAdicionarAnotacao={handleAdicionarAnotacao} 
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="w-full lg:w-1/3 space-y-6">
                       <HistoricoTratamentoCard items={timelineUnificada} consultaAtualId={consulta.id} />
                    </div>
                </div>
            </main>
            
            {selectedAnexo && <AnexoPreviewModal anexo={selectedAnexo} onClose={() => setSelectedAnexo(null)} />} 
            {showAddAnexo && <AnexoUploader consultaId={consulta.id} onAnexoAdicionado={handleAnexoAdicionado} onClose={() => setShowAddAnexo(false)} />} 
        </div>
    );
};

export default ConsultaPage;
