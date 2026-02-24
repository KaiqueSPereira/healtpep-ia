'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import useAuthStore from "../../_stores/authStore";
import { Loader2 } from "lucide-react";
import ExameLineChart from "./components/ExameLineChart";
import { ExamesGrid } from "./components/ExamesGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { ExameSidebar } from "./components/ExameSidebar";
import type { Exame, ResultadoExame, Profissional, UnidadeDeSaude } from "@prisma/client";
import { useToast } from "../../_hooks/use-toast";

export type ExameCompleto = Exame & {
    profissional: Profissional | null;
    unidades: UnidadeDeSaude | null;
    resultados: ResultadoExame[];
    _count?: { anexos: number };
};

type ExameGraficos = {
    id: string;
    dataExame: Date;
    tipo: string;
    resultados: { id: string; nome: string; valor: string; categoria: string; }[];
};

type ChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: (number | null)[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
        spanGaps: boolean;
        borderWidth: number;
        pointRadius: number;
        pointHoverRadius: number;
        pointBackgroundColor: string;
    }[];
};

const parseExameValue = (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    const strValue = String(value).trim().toUpperCase();
    if (strValue === 'POSITIVO' || strValue === 'PRESENTE' || strValue === 'REAGENTE') return 1;
    if (strValue === 'NEGATIVO' || strValue === 'AUSENTE' || strValue === 'NÃO REAGENTE') return 0;
    let cleanedValue = strValue.replace(/<|>/g, '').replace(/,/g, '.');
    if (cleanedValue.indexOf('.') !== cleanedValue.lastIndexOf('.')) {
        cleanedValue = cleanedValue.replace(/\.(?=\d{3})/g, '');
    }
    const numericValue = parseFloat(cleanedValue);
    return isNaN(numericValue) ? null : numericValue;
};

const CHART_COLORS = [
    '#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f',
    '#00a950', '#58595b', '#8549ba', '#0099cc', '#ff6666', '#ffc266',
    '#66ff66', '#66c2ff', '#c266ff'
];

const EXAMES_PER_PAGE = 10;

export default function ExamesPage() {
    const { session, status } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [examesGraficosData, setExamesGraficosData] = useState<ExameGraficos[]>([]);
    const [examesListaData, setExamesListaData] = useState<ExameCompleto[]>([]);
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [currentView, setCurrentView] = useState<'list' | 'charts'>('list');
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
    const [listStatusFilter, setListStatusFilter] = useState<'todos' | 'agendados' | 'realizados' | 'pendentes'>('todos');
    const [selectedChartCategory, setSelectedChartCategory] = useState<string>('Todos');
    const [selectedChartComponents, setSelectedChartComponents] = useState<string[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchExames = useCallback(async (pageNum: number) => {
        if (status === 'unauthenticated') {
            toast({ title: "Você precisa estar logado para ver seus exames.", variant: "destructive" });
            return;
        }
        const userId = session?.user?.id;
        if (!userId) {
            toast({ title: "Não foi possível obter a identificação do usuário.", variant: "destructive" });
            return;
        }

        const url = `/api/exames?userId=${userId}&page=${pageNum}&limit=${EXAMES_PER_PAGE}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`A resposta da API para ${url} não foi OK`);
            const data = await res.json();
            
            if (!data.exames || !Array.isArray(data.exames)) throw new Error("A resposta da API não contém um array de exames");

            setExamesListaData(prev => pageNum === 1 ? data.exames : [...prev, ...data.exames]);
            setHasMore(data.page < data.totalPages);
            setPage(pageNum);

        } catch (error) {
            toast({ title: `Erro ao carregar dados de exames`, variant: "destructive" });
            console.error(error);
        } 
    }, [session?.user?.id, status, toast]);

    const fetchMoreExames = useCallback(() => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        fetchExames(page + 1).finally(() => setIsFetchingMore(false));
    }, [isFetchingMore, hasMore, fetchExames, page]);

    useEffect(() => {
        setInitialLoading(true);
        if (currentView === 'list') {
            setExamesListaData([]);
            fetchExames(1).finally(() => setInitialLoading(false));
        } else {
            const fetchChartData = async () => {
                 const userId = session?.user?.id;
                 if (!userId) return;
                 const url = `/api/exames/graficos?userId=${userId}`;
                 try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`A resposta da API para ${url} não foi OK`);
                    const data = await res.json();
                    if (!Array.isArray(data)) throw new Error("A resposta da API não é um array");
                    setExamesGraficosData(data as ExameGraficos[]);
                 } catch (error) {
                    toast({ title: `Erro ao carregar dados de ${url}`, variant: "destructive" });
                 } finally {
                    setInitialLoading(false);
                 }
            };
            fetchChartData();
        }
    }, [currentView, session?.user?.id, fetchExames, toast]);

    const examTypeOptions = useMemo(() => {
        const listTypes = examesListaData.map(e => e.tipo).filter(Boolean);
        const chartTypes = examesGraficosData.map(e => e.tipo).filter(Boolean);
        return Array.from(new Set([...listTypes, ...chartTypes] as string[])).sort();
    }, [examesListaData, examesGraficosData]);

    const chartCategoryOptions = useMemo(() => {
        if (currentView !== 'charts') return [];
        const categories = new Set<string>();
        examesGraficosData
            .filter(exame => exame.tipo === 'Exames Laboratoriais')
            .flatMap(exame => exame.resultados?.map(res => res.categoria) || [])
            .forEach(category => {
                if (category) categories.add(category);
            });
        
        const sortedCategories = Array.from(categories).sort();
        return ['Todos', ...sortedCategories];
    }, [examesGraficosData, currentView]);

    const chartComponentOptions = useMemo(() => {
        if (currentView !== 'charts') return [];
        const componentNames = examesGraficosData
            .filter(exame => exame.tipo === 'Exames Laboratoriais')
            .flatMap(exame => exame.resultados || [])
            .filter(res => selectedChartCategory === 'Todos' || res.categoria === selectedChartCategory)
            .map(res => res.nome)
            .filter((name): name is string => !!name && name !== 'Desconhecido');

        return Array.from(new Set(componentNames)).sort();
    }, [examesGraficosData, currentView, selectedChartCategory]);

    useEffect(() => {
        if (currentView === 'charts') {
            const newSelectedComponents = chartComponentOptions.filter(comp => selectedChartComponents.includes(comp));
            if(newSelectedComponents.length === 0 && chartComponentOptions.length > 0) {
                 setSelectedChartComponents(chartComponentOptions);
            } else {
                 setSelectedChartComponents(newSelectedComponents);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartComponentOptions, currentView, selectedChartCategory]);

    const { examesAgendados, examesRealizados, examesPendentes } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const agendados: ExameCompleto[] = [];
        const realizados: ExameCompleto[] = [];
        const pendentes: ExameCompleto[] = [];
        examesListaData.forEach(exame => {
            if (!exame.dataExame) {
                pendentes.push(exame);
                return;
            }
            const examDate = new Date(exame.dataExame);
            if (isNaN(examDate.getTime())) {
                pendentes.push(exame);
            } else if (examDate >= today) {
                agendados.push(exame);
            } else {
                realizados.push(exame);
            }
        });
        return { examesAgendados: agendados, examesRealizados: realizados, examesPendentes: pendentes };
    }, [examesListaData]);

    const filterExams = useCallback((exames: (ExameCompleto | ExameGraficos)[]) => {
        return exames.filter(exame => {
            if (exame.dataExame) {
                const examDate = new Date(exame.dataExame);
                if (!isNaN(examDate.getTime())) {
                    const start = startDate ? new Date(startDate).getTime() : -Infinity;
                    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
                    if (examDate.getTime() < start || examDate.getTime() > end) return false;
                }
            }
            if (selectedExamTypes.length > 0 && (!exame.tipo || !selectedExamTypes.includes(exame.tipo))) return false;
            return true;
        });
    }, [startDate, endDate, selectedExamTypes]);
    
    const filteredAgendados = useMemo(() => filterExams(examesAgendados).filter(exame => new Date(exame.dataExame as Date) >= new Date(new Date().setHours(0,0,0,0))), [examesAgendados, filterExams]);
    const filteredRealizados = useMemo(() => filterExams(examesRealizados).filter(exame => new Date(exame.dataExame as Date) < new Date(new Date().setHours(0,0,0,0))), [examesRealizados, filterExams]);
    const filteredPendentes = useMemo(() => filterExams(examesPendentes).filter(exame => !exame.dataExame), [examesPendentes, filterExams]);

    useEffect(() => {
        if (currentView !== 'charts' || selectedChartComponents.length === 0) {
            setChartData(null);
            return;
        }

        const relevantExams = filterExams(examesGraficosData).filter(exame => exame.tipo === 'Exames Laboratoriais');

        const componentData = new Map<string, Map<string, number>>();

        relevantExams.forEach(exame => {
            const dateStr = new Date(exame.dataExame as Date).toISOString().split('T')[0];
            (exame as ExameGraficos).resultados?.forEach(resultado => {
                const displayName = resultado.nome;
                if (displayName !== 'Desconhecido' && selectedChartComponents.includes(displayName)) {
                    const numericValue = parseExameValue(resultado.valor);
                    if (numericValue !== null) {
                        if (!componentData.has(displayName)) {
                            componentData.set(displayName, new Map());
                        }
                        componentData.get(displayName)!.set(dateStr, numericValue);
                    }
                }
            });
        });

        const allDates = Array.from(new Set(Array.from(componentData.values()).flatMap(dateMap => Array.from(dateMap.keys())))).sort();
        if (allDates.length === 0) {
            setChartData(null);
            return;
        }

        const finalChartData: ChartData = {
            labels: allDates.map(date => new Date(date + 'T00:00:00Z').toLocaleDateString('pt-BR')),
            datasets: Array.from(componentData.entries()).map(([componentName, dateMap], index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return {
                    label: componentName,
                    data: allDates.map(date => dateMap.get(date) ?? null),
                    borderColor: color,
                    backgroundColor: `${color}33`,
                    tension: 0.4,
                    spanGaps: true,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: color,
                };
            }),
        };
        setChartData(finalChartData);

    }, [currentView, examesGraficosData, selectedChartComponents, filterExams]);

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

    const handleChartCategoryChange = (category: string) => {
        setSelectedChartCategory(category);
    };


    return (
        <div className="flex flex-1">
            <ExameSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                currentView={currentView}
                onViewChange={setCurrentView}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                examTypeOptions={examTypeOptions}
                selectedExamTypes={selectedExamTypes}
                onExamTypeChange={setSelectedExamTypes}
                listStatusFilter={listStatusFilter}
                onListStatusFilterChange={setListStatusFilter}
                chartCategoryOptions={chartCategoryOptions}
                selectedChartCategory={selectedChartCategory}
                onChartCategoryChange={handleChartCategoryChange}
                chartComponentOptions={chartComponentOptions}
                selectedChartComponents={selectedChartComponents}
                onChartComponentChange={setSelectedChartComponents}
            />
            <main className="flex-1 overflow-y-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Resultados</h1>

                {initialLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {currentView === 'list' && (() => {
                            const agendadosView = (listStatusFilter === 'todos' || listStatusFilter === 'agendados') && filteredAgendados.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold mb-4">Exames Agendados</h2>
                                    <ExamesGrid exames={filteredAgendados as ExameCompleto[]} onDeleteClick={handleDeleteClick} fetchMoreExames={fetchMoreExames} hasMore={hasMore} isFetchingMore={isFetchingMore} />
                                </div>
                            );
                            const realizadosView = (listStatusFilter === 'todos' || listStatusFilter === 'realizados') && filteredRealizados.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold mb-4">Exames Realizados</h2>
                                    <ExamesGrid exames={filteredRealizados as ExameCompleto[]} onDeleteClick={handleDeleteClick} fetchMoreExames={fetchMoreExames} hasMore={hasMore} isFetchingMore={isFetchingMore} />
                                </div>
                            );
                            const pendentesView = (listStatusFilter === 'todos' || listStatusFilter === 'pendentes') && filteredPendentes.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold mb-4">Exames Pendentes</h2>
                                    <ExamesGrid exames={filteredPendentes as ExameCompleto[]} onDeleteClick={handleDeleteClick} fetchMoreExames={fetchMoreExames} hasMore={hasMore} isFetchingMore={isFetchingMore} />
                                </div>
                            );

                            if (agendadosView || realizadosView || pendentesView) {
                                return <>{agendadosView}{realizadosView}{pendentesView}</>;
                            }

                            return <p className="text-center text-gray-500 py-10">Nenhum exame encontrado para os filtros selecionados.</p>;
                        })()}

                        {currentView === 'charts' && (chartData && chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
                            <ExameLineChart data={chartData} title={`Evolução: ${selectedChartCategory === 'Todos' ? 'Resultados Gerais' : selectedChartCategory}`} />
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado encontrado para os filtros selecionados.</p>
                        ))}
                    </>
                )}
            </main>
            <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita e excluirá permanentemente o exame.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
