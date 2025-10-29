"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react"; // Importa o hook useSession
import ViewSwitcher from "./components/ViewSwitcher";
import Header from "@/app/_components/header";
import { toast } from "@/app/_hooks/use-toast";
import { Loader2 } from "lucide-react";
import ExameLineChart from "./components/ExameLineChart";
import { Input } from "@/app/_components/ui/input";
import { ExamesGrid } from "./components/ExamesGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { ExameTypeFilter } from "./components/ExameTypeFilter";
import type { Exame, ResultadoExame, Profissional, UnidadeDeSaude } from "@prisma/client";

export type ExameCompleto = Exame & {
    profissional: Profissional | null;
    unidades: UnidadeDeSaude | null;
    resultados: ResultadoExame[];
};

type ExameGraficos = Exame & {
    resultados: ResultadoExame[];
};

type ChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: (number | typeof NaN)[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
        spanGaps: boolean;
    }[];
};

export default function ExamesPage() {
    const { data: session, status } = useSession(); // Usa o hook para obter a sessão
    const [examesGraficosData, setExamesGraficosData] = useState<ExameGraficos[]>([]);
    const [examesListaData, setExamesListaData] = useState<ExameCompleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'list' | 'charts'>('list');
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedListTypes, setSelectedListTypes] = useState<string[]>([]);
    const [selectedChartType, setSelectedChartType] = useState<'Urina' | 'Sangue'>('Sangue');
    const [selectedChartComponents, setSelectedChartComponents] = useState<string[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

    useEffect(() => {
        // Não faz nada enquanto a sessão está carregando
        if (status === 'loading') return;

        // Se o usuário não estiver autenticado, exibe um erro e para.
        if (status === 'unauthenticated') {
            toast({ title: "Você precisa estar logado para ver seus exames.", variant: "destructive" });
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            const userId = session?.user?.id;

            // Garante que temos um userId antes de fazer a chamada
            if (!userId) {
                toast({ title: "Não foi possível obter a identificação do usuário.", variant: "destructive" });
                setLoading(false);
                return;
            }

            const viewUrl = currentView === 'list' ? "/api/exames" : "/api/exames/graficos";
            // CORREÇÃO: Adiciona o userId como um query parameter na URL
            const url = `${viewUrl}?userId=${userId}`;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`A resposta da API para ${url} não foi OK`);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error("A resposta da API não é um array");
                if (currentView === 'list') {
                    setExamesListaData(data as ExameCompleto[]);
                } else {
                    setExamesGraficosData(data as ExameGraficos[]);
                }
            } catch (error) {
                toast({ title: `Erro ao carregar dados de ${url}`, variant: "destructive" });
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentView, session, status]); // Adiciona a sessão e o status como dependências

    const listFilterOptions = useMemo(() => 
        Array.from(new Set(examesListaData.map(e => e.tipo).filter((t): t is string => !!t))).sort(), 
        [examesListaData]
    );

    const chartComponentOptions = useMemo(() => {
        if (currentView !== 'charts' || !selectedChartType) return [];
        const componentNames = examesGraficosData
            .filter(exame => exame.tipo === selectedChartType)
            .flatMap(exame => exame.resultados?.map(res => res.nome) || []);
        return Array.from(new Set(componentNames.filter(Boolean))).sort();
    }, [examesGraficosData, currentView, selectedChartType]);

    useEffect(() => {
        if (currentView === 'list' && listFilterOptions.length > 0 && selectedListTypes.length === 0) {
            setSelectedListTypes(listFilterOptions);
        }
    }, [currentView, listFilterOptions, selectedListTypes.length]);
    
    useEffect(() => {
        if (chartComponentOptions.length > 0 && selectedChartComponents.length === 0) {
            setSelectedChartComponents(chartComponentOptions);
        }
    }, [chartComponentOptions, selectedChartComponents.length]);

    const filteredListExams = useMemo(() => {
        if (currentView !== 'list') return [];
        return examesListaData.filter(exame => {
            const examDate = new Date(exame.dataExame);
            if (isNaN(examDate.getTime())) return false;
            const start = startDate ? new Date(startDate).getTime() : -Infinity;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
            if (examDate.getTime() < start || examDate.getTime() > end) return false;
            if (selectedListTypes.length > 0 && (!exame.tipo || !selectedListTypes.includes(exame.tipo))) return false;
            return true;
        });
    }, [examesListaData, selectedListTypes, startDate, endDate, currentView]);

    useEffect(() => {
        if (currentView !== 'charts' || !selectedChartType || examesGraficosData.length === 0 || selectedChartComponents.length === 0) {
            setChartData(null);
            return;
        }

        const relevantExams = examesGraficosData.filter(exame => {
            if (exame.tipo !== selectedChartType) return false;
            const examDate = new Date(exame.dataExame);
            if (isNaN(examDate.getTime())) return false;
            const start = startDate ? new Date(startDate).getTime() : -Infinity;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
            return examDate.getTime() >= start && examDate.getTime() <= end;
        });

        const processedData: { [componentName: string]: { dates: string[], values: number[] } } = {};
        relevantExams.forEach(exame => {
            exame.resultados?.forEach(resultado => {
                if (resultado.nome && selectedChartComponents.includes(resultado.nome)) {
                    const numericValue = parseFloat(resultado.valor);
                    if (!isNaN(numericValue)) {
                        if (!processedData[resultado.nome]) processedData[resultado.nome] = { dates: [], values: [] };
                        const dateStr = new Date(exame.dataExame).toISOString().split('T')[0];
                        processedData[resultado.nome].dates.push(dateStr);
                        processedData[resultado.nome].values.push(numericValue);
                    }
                }
            });
        });

        const allDates = Array.from(new Set(Object.values(processedData).flatMap(data => data.dates))).sort();
        if (allDates.length === 0) {
            setChartData(null);
            return;
        }

        setChartData({
            labels: allDates.map(date => new Date(date + 'T00:00:00').toLocaleDateString()),
            datasets: Object.entries(processedData).map(([componentName, data], index) => ({
                label: componentName,
                data: allDates.map(date => data.dates.includes(date) ? data.values[data.dates.indexOf(date)] : NaN),
                borderColor: `hsl(${index * 60 % 360}, 70%, 50%)`,
                backgroundColor: `hsla(${index * 60 % 360}, 70%, 50%, 0.2)`,
                tension: 0.1,
                spanGaps: true,
            })),
        });

    }, [currentView, examesGraficosData, selectedChartType, selectedChartComponents, startDate, endDate]);

    const handleDeleteClick = (examId: string) => {
        setExamToDelete(examId);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!examToDelete) return;
        try {
            const res = await fetch(`/api/exames/${examToDelete}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Falha ao excluir");
            toast({ title: "Exame excluído com sucesso!", variant: "default" });
            setExamesListaData(prev => prev.filter(exame => exame.id !== examToDelete));
            setExamesGraficosData(prev => prev.filter(exame => exame.id !== examToDelete));
        } catch {
            toast({ title: "Erro ao excluir exame", variant: "destructive" });
        } finally {
            setIsConfirmDeleteDialogOpen(false);
            setExamToDelete(null);
        }
    };
    
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 space-y-6 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <h1 className="text-2xl font-bold mb-4 md:mb-0">Meus Exames</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/exames/novo"><Button className="w-auto">Novo Exame</Button></Link>
                        <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
                    <div className="flex items-end gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data Inicial</label>
                            <Input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data Final</label>
                            <Input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
                        </div>
                    </div>

                    {currentView === 'list' && listFilterOptions.length > 0 && (
                        <ExameTypeFilter
                            allTypes={listFilterOptions}
                            selectedTypes={selectedListTypes}
                            onTypeChange={setSelectedListTypes}
                        />
                    )}

                    {currentView === 'charts' && (
                        <div className="flex items-end gap-4">
                             <div className="flex items-center gap-2 rounded-md border bg-gray-50 p-2">
                               <Button variant={selectedChartType === 'Sangue' ? 'default' : 'outline'} onClick={() => setSelectedChartType('Sangue')}>Sangue</Button>
                               <Button variant={selectedChartType === 'Urina' ? 'default' : 'outline'} onClick={() => setSelectedChartType('Urina')}>Urina</Button>
                             </div>
                            {selectedChartType && chartComponentOptions.length > 0 && (
                                <ExameTypeFilter
                                    allTypes={chartComponentOptions}
                                    selectedTypes={selectedChartComponents}
                                    onTypeChange={setSelectedChartComponents}
                                />
                            )}
                        </div>
                    )}
                </div>

                {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <>
                        {currentView === 'list' && (
                            <ExamesGrid exames={filteredListExams} onDeleteClick={handleDeleteClick} />
                        )}

                        {currentView === 'charts' && (
                            !selectedChartType ? <p className="text-center text-gray-500 py-10">Selecione &quot;Sangue&quot; ou &quot;Urina&quot; para ver o gráfico.</p> : (
                            chartData && chartData.datasets.length > 0 ? <ExameLineChart data={chartData} title={`Evolução dos Resultados (${selectedChartType})`} /> :
                            <p className="text-center text-gray-500 py-10">Nenhum dado encontrado para os filtros selecionados.</p>
                        ))}
                    </>
                )}
            </main>
            
            <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita e excluirá permanentemente o exame.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
