"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import ViewSwitcher from "./components/ViewSwitcher";
import Header from "@/app/_components/header";
import { toast } from "@/app/_hooks/use-toast";
import { Loader2 } from "lucide-react";
import ExameLineChart from "./components/ExameLineChart";
import { Input } from "@/app/_components/ui/input";
import ExameTypeFilter from "./components/ExameTypeFilter";
import { ExameGrid } from "./components/ExamesGrid";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { ChartData, ExameCompleto, ExameGraficos} from "../_components/types"; // Importe Resultado
import Link from "next/link";
import { Button } from "@/app/_components/ui/button"; // Importe Button

// Assumindo que ExameTypeFilterProps está definida em ../_components/types
// import { ExameTypeFilterProps } from "../_components/types";


export default function ExamesPage() {
  const [examesGraficosData, setExamesGraficosData] = useState<ExameGraficos[]>([]); // State for graphics API data
  const [examesListaData, setExamesListaData] = useState<ExameCompleto[]>([]); // State for full exams API data
  const [exames, setExames] = useState<Array<ExameGraficos | ExameCompleto>>([]); // State for raw data based on currentView

  const [loading, setLoading] = useState(true);
  const [selectedExameTypes, setSelectedExameTypes] = useState<string[]>([]); // Tipos de exame selecionados (Urina, Sangue, etc.)
  const [selectedResultNames, setSelectedResultNames] = useState<string[]>([]); // Nomes de resultados selecionados (Glicose, etc.)
  const [currentView, setCurrentView] = useState<'list' | 'charts'>('charts');

  // Novos estados para dados de gráficos separados por tipo de exame e tipo de gráfico selecionado
  const [chartDataUrina, setChartDataUrina] = useState<ChartData | null>(null);
  const [chartDataSangue, setChartDataSangue] = useState<ChartData | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<'Urina' | 'Sangue' | null>(null); // Estado para o tipo de gráfico selecionado

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);


  // === NOVO useEffect para inicializar os filtros com base nos dados carregados ===
  useEffect(() => {
    let allNames: string[] = [];
    if (currentView === 'charts' && examesGraficosData.length > 0) {
       // Extrai nomes de resultados para gráficos
       allNames = Array.from(new Set(examesGraficosData.flatMap(exame =>
          exame.resultados?.map(resultado => resultado.nome) || []
        ))).sort();
        // No modo gráfico, inicializa ambos selectedExameTypes e selectedResultNames com os nomes dos resultados
        if (JSON.stringify(selectedExameTypes) !== JSON.stringify(allNames)) {
            setSelectedExameTypes(allNames);
        }
        if (JSON.stringify(selectedResultNames) !== JSON.stringify(allNames)) {
            setSelectedResultNames(allNames);
        }
    } else if (currentView === 'list' && examesListaData.length > 0) {
       // Extrai tipos de exame para a lista
        allNames = Array.from(new Set(examesListaData.map(exame => exame.tipo).filter((tipo): tipo is string => tipo !== undefined))).sort();
        // No modo lista, inicializa apenas selectedExameTypes com os tipos de exame
        if (JSON.stringify(selectedExameTypes) !== JSON.stringify(allNames)) {
             setSelectedExameTypes(allNames);
         }
        // No modo lista, talvez você queira garantir que selectedResultNames esteja vazio ao mudar de view
        if (selectedResultNames.length > 0) {
             setSelectedResultNames([]);
        }
    } else if (examesGraficosData.length === 0 && examesListaData.length === 0) {
        // Se não há dados em nenhuma view, limpa os filtros
        if (selectedExameTypes.length > 0) setSelectedExameTypes([]);
        if (selectedResultNames.length > 0) setSelectedResultNames([]);
    }


  }, [currentView, examesGraficosData, examesListaData, selectedExameTypes, selectedResultNames]); // Adicionadas dependências ausentes



  // === Handlers para seleção de filtros (simplificados) ===
  const handleSelectTypes = useCallback((selectedTypes: string[]) => {
    setSelectedExameTypes(selectedTypes);
  }, []); 
  const handleSelectResultsForChart = useCallback((selectedResults: string[]) => {
    setSelectedResultNames(selectedResults);
  }, []); 

  // === useEffect ORIGINAL para buscar dados ===
  useEffect(() => {
    setLoading(true);
    if (currentView === 'charts') {
      if (examesGraficosData.length > 0) { 
        setExames(examesGraficosData);
        setLoading(false);
        return;
      }
      fetch("/api/exames/graficos")
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) {
             console.error("Graphics API did not return an array:", data);
             toast({ title: "Erro ao carregar dados para gráficos", variant: "destructive", duration: 5000 });
             return;
          }
          // Assume que a API de gráficos retorna dados que podem ser asseridos como ExameGraficos[]
          // E que a propriedade 'tipo' está presente aqui (após modificação manual da interface)
          setExamesGraficosData(data as ExameGraficos[]);
          // Não defina 'exames' aqui. O novo useEffect se encarregará de sincronizar 'exames' com os dados corretos
          // setExames(data as ExameGraficos[]); // REMOVA ESTA LINHA
        })
        .catch((error) => {
           console.error("Error fetching graphics exams:", error);
           toast({ title: "Erro ao carregar dados para gráficos", variant: "destructive", duration: 5000 });
        })
        .finally(() => setLoading(false));
    } else { // currentView === 'list'
       if (examesListaData.length > 0) { // Use cached data if available
         setExames(examesListaData);
         setLoading(false);
         return;
       }
      fetch("/api/exames") // Fetch from the full exams API
        .then((res) => res.json())
        .then((data) => {
           if (!Array.isArray(data)) {
              console.error("Full Exams API did not return an array:", data);
              toast({ title: "Erro ao carregar lista de exames", variant: "destructive", duration: 5000 });
              return;
           }
           // Assume que a API completa retorna dados que podem ser asseridos como ExameCompleto[]
          setExamesListaData(data as ExameCompleto[]);
          // Não defina 'exames' aqui. O novo useEffect se encarregará de sincronizar 'exames' com os dados corretos
          // setExames(data as ExameCompleto[]); // REMOVA ESTA LINHA
         })
        .catch((error) => {
            console.error("Error fetching full exams:", error);
            toast({title: "Erro ao carregar lista de exames",variant: "destructive", duration: 5000 });
        })
        .finally(() => setLoading(false));
    }
  }, [currentView, examesGraficosData, examesListaData]); // Dependencies on currentView and cached data


  // === useEffect para SINCRONIZAR 'exames' com os dados corretos quando eles mudam ===
  useEffect(() => {
      if (currentView === 'charts') {
          setExames(examesGraficosData);
      } else { // currentView === 'list'
          setExames(examesListaData);
      }
  }, [currentView, examesGraficosData, examesListaData]); // Depende da view e dos dados das APIs


  // === useMemo ORIGINAL para filtrar exames ===
  const filteredExames = useMemo(() => {
    let filtered = exames; // Start with the current raw data

    // Filter by exam types (apply filter in both views based on the type)
    if (selectedExameTypes.length > 0) {
      if (currentView === 'charts') {
        // Filtrar ExameGraficos por nomes de resultado (mantido a lógica original para gráficos)
         filtered = (filtered as ExameGraficos[]).filter(exame =>
          exame.resultados?.some(resultado =>
            selectedExameTypes.includes(resultado.nome)
          )
        );
      } else { // currentView === 'list'
        // Filtrar ExameCompleto por propriedade 'tipo'
         filtered = (filtered as ExameCompleto[]).filter(exame =>
           exame.tipo ? selectedExameTypes.includes(exame.tipo) : false
         );
      }
    }

    // Filter by date range (apply filter in both views)
    if (startDate || endDate) {
      filtered = filtered.filter(exame => {
        // Criar um objeto Date a partir de exame.dataExame (funciona para string e Date)
        const examDate = new Date(exame.dataExame);

        // Verificar se a data é válida antes de obter o timestamp
        if (isNaN(examDate.getTime())) {
          return false; // Ignorar exames com data inválida
        }

        const examTimestamp = examDate.getTime();
        const start = startDate ? new Date(startDate).getTime() : -Infinity;
        const end = endDate ? new Date(endDate).getTime() : Infinity;

        return examTimestamp >= start && examTimestamp <= end;
      });
    }

    return filtered;
  }, [exames, selectedExameTypes, startDate, endDate, currentView]); // Depend on states that affect filtering


  // === useEffect ORIGINAL para gerar dados de gráfico ===
  useEffect(() => {
    // Only generate chart data in charts view and if there's filtered data and selected results AND a chart type is selected
    // Removido a verificação !filteredExames.length para permitir que o gráfico limpe se os filtros removerem todos os dados
    if (currentView === 'list' || selectedResultNames.length === 0 || selectedChartType === null) {
      setChartDataUrina(null);
      setChartDataSangue(null);
      return;
    }

    console.log("Generating chart data for:", selectedChartType);
    console.log("filteredExames (for charts):", filteredExames);
    console.log("selectedResultNames:", selectedResultNames);

    // Ensure filteredExames has the correct type structure for charts and has 'tipo' property
    // Assumimos que filteredExames neste ponto é ExameGraficos[] com a propriedade 'tipo'
    const filteredExamesForChartsWithTipo = filteredExames as ExameGraficos[];

    // Filtrar exames pelo tipo de gráfico selecionado
    const relevantExams = filteredExamesForChartsWithTipo.filter(exame => exame.tipo === selectedChartType);


    // Função auxiliar para processar dados de um tipo específico de exame
    const processExamsForChart = (exams: ExameGraficos[]): ChartData | null => {
      const processedData: { [resultName: string]: { dates: string[], values: number[] } } = {};

      exams.forEach(exame => {
        exame.resultados?.forEach(resultado => {
          if (selectedResultNames.includes(resultado.nome)) {
            const numericValue = parseFloat(resultado.valor);
            if (!isNaN(numericValue)) {
               if (!processedData[resultado.nome]) {
                  processedData[resultado.nome] = { dates: [], values: [] };
                }
              // Use toISOString().split('T')[0] para formato YYYY-MM-DD para ordenação consistente
              processedData[resultado.nome].dates.push(new Date(exame.dataExame).toISOString().split('T')[0]);
              processedData[resultado.nome].values.push(numericValue);
            }
          }
        });
      });

      // Ordenar as datas como strings ISO para ordenação cronológica correta
      const allDates = Object.values(processedData).flatMap(data => data.dates)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort(); // Ordenação padrão de string funciona para YYYY-MM-DD

      const chartDatasets = Object.entries(processedData).map(([resultName, data], index) => ({
        label: resultName,
        data: allDates.map(date => {
          const dataIndex = data.dates.indexOf(date);
          return dataIndex > -1 ? data.values[dataIndex] : 0;
        }) as number[],
        borderColor: `hsl(${index * 50 % 360}, 70%, 50%)`, // Usar módulo 360 para cores
        backgroundColor: `hsl(${index * 50 % 360}, 70%, 70%, 0.2)`,
        tension: 0.1,
        spanGaps: true,
      }));

      if (allDates.length === 0 || chartDatasets.length === 0) {
          return null;
      }

      return {
        labels: allDates.map(date => new Date(date + 'T00:00:00').toLocaleDateString()), // Formatar para exibição, garantindo fuso horário
        datasets: chartDatasets,
      } as ChartData; // Afirmar o tipo
    };

    // Gerar dados APENAS para o tipo de gráfico selecionado
    if (selectedChartType === 'Urina') {
        setChartDataUrina(processExamsForChart(relevantExams));
        setChartDataSangue(null); // Garantir que o outro estado seja null
    } else if (selectedChartType === 'Sangue') {
        setChartDataSangue(processExamsForChart(relevantExams));
        setChartDataUrina(null); // Garantir que o outro estado seja null
    } else { // selectedChartType === null
       setChartDataUrina(null);
       setChartDataSangue(null);
    }


  }, [filteredExames, selectedResultNames, currentView, selectedChartType]); // Depend on currentView and states that affect chart data


  // === Handlers para exclusão ===
  const handleDeleteClick = (examId: string) => {
    setExamToDelete(examId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;

    try {
      const res = await fetch(`/api/exames/${examToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Exame excluído com sucesso!", variant: "default", duration: 5000 });
        // Remove o exame excluído dos estados de dados em cache
        setExamesGraficosData(prev => prev.filter(exame => exame.id !== examToDelete));
        setExamesListaData(prev => prev.filter(exame => exame.id !== examToDelete));
        // Força a atualização do estado 'exames' para que filteredExames seja recalculado
        // Esta linha pode ser removida se o novo useEffect de sincronização for suficiente
        // setExames(prev => prev.filter(exame => exame.id !== examToDelete));
      } else {
        toast({ title: "Erro ao excluir exame", variant: "destructive", duration: 5000 });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({ title: "Erro inesperado ao excluir exame", variant: "destructive", duration: 5000 });
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <main className={`flex-1 space-y-6 p-4 md:p-6`}>
          {/* Title and ViewSwitcher */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <h1 className="text-2xl font-bold mb-2 md:mb-0">Meus Exames</h1>
            <div className="flex items-center gap-4 md:gap-6">
            <Link href="/exames/novo">
                <Button className="w-auto">Novo Exame</Button>
              </Link>
             <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
            </div>
          </div>


          {/* Filters Area (shared between charts and list view) */}
           <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6"> {/* Ajustado para flexbox */}
               {/* Date Filter Inputs */}
                <div className="flex gap-4 items-center">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data Inicial</label>
                    <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full" />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data Final</label>
                    <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full" />
                  </div>
                </div>

               {currentView === 'charts' && (
                 <>
                    {/* Botões para selecionar tipo de gráfico (apenas no modo gráfico) */}
                    <div className="flex gap-2">
                       <Button
                         variant={selectedChartType === 'Urina' ? 'default' : 'outline'}
                         onClick={() => {setSelectedChartType('Urina'); setSelectedResultNames([]);}} // Limpar resultados ao mudar tipo
                       >
                         Urina
                       </Button>
                       <Button
                         variant={selectedChartType === 'Sangue' ? 'default' : 'outline'}
                         onClick={() => {setSelectedChartType('Sangue'); setSelectedResultNames([]);}} // Limpar resultados ao mudar tipo
                       >
                         Sangue
                       </Button>
                    </div>

                    {/* Filtro de Tipo/Resultado de Exame (renderizado apenas no modo gráfico e se um tipo estiver selecionado) */}
                     {selectedChartType && (
                        <ExameTypeFilter
                           // Passa os dados de gráfico para este filtro (para obter nomes de resultados)
                           exames={examesGraficosData}
                            onSelectTypes={handleSelectTypes} // Usa o callback simplificado
                            onSelectResultsForChart={handleSelectResultsForChart} // Usa o callback simplificado
                            // selectedResultsForChart e selectedExameTypeForChart não são mais props no filtro
                            // porque o filtro gerencia seus próprios estados de seleção localmente.
                            // Certifique-se de que ExameTypeFilterProps não espera mais essas props.
                            // selectedResultsForChart={selectedResultNames} // REMOVA ESTA LINHA
                            // selectedExameTypeForChart={selectedChartType} // REMOVA ESTA LINHA
                        />
                     )}
                 </>
               )}

              {currentView === 'list' && (
                <>
                 {/* Filtro de Tipo de Exame para a Lista (apenas no modo lista) */}
                  <ExameTypeFilter
                     exames={examesListaData} // Usa dados da lista para este filtro
                      onSelectTypes={handleSelectTypes} // Usa o callback simplificado
                      onSelectResultsForChart={() => {}} // Não relevante para a lista, use um no-op
                      // selectedResultsForChart e selectedExameTypeForChart não são mais props no filtro
                      // selectedResultsForChart={[]} // REMOVA ESTA LINHA
                  />
                </>
              )}
          </div>


          {/* Chart Area */}
          {currentView === 'charts' && (
            <>
              {loading ? (
                 <div className="flex h-96 items-center justify-center">
                   <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 </div>
              ) : (
                <>
                   {/* Renderizar Gráfico de Urina se selecionado e houver dados e resultados */}
                  {selectedChartType === 'Urina' && chartDataUrina && chartDataUrina.datasets.length > 0 && selectedResultNames.length > 0 ? (
                    <div className="w-full -mx-4 md:-mx-6"> {/* Removed height classes */}
                      <ExameLineChart data={chartDataUrina} title="Evolução dos Resultados (Urina)" />
                    </div>
                  ) : (
                      // Mensagem específica para Urina se selecionado, sem dados ou resultados selecionados (e não carregando)
                      currentView === 'charts' && selectedChartType === 'Urina' && !loading && (
                         selectedResultNames.length === 0 ? (
                           <div className="w-full flex items-center justify-center text-gray-500" style={{ height: '24rem' }}> {/* Added back a height for message div */}
                                Selecione resultados para visualizar o gráfico de Urina.
                            </div>
                         ) : (
                           <div className="w-full h-96 flex items-center justify-center text-gray-500">
                                Nenhum dado de exame de Urina encontrado para os filtros selecionados.
                            </div>
                         )
                      )
                  )}

                  {/* Renderizar Gráfico de Sangue se selecionado e houver dados e resultados */}
                  {selectedChartType === 'Sangue' && chartDataSangue && chartDataSangue.datasets.length > 0 && selectedResultNames.length > 0 && (
                      <div className="w-full -mx-4 md:-mx-6"> {/* Removed height classes */}
                        <ExameLineChart data={chartDataSangue} title="Evolução dos Resultados (Sangue)" />
                      </div>
                  )}
                   {/* Mensagem específica para Sangue se selecionado, sem dados ou resultados selecionados (e não carregando) */}
                   {currentView === 'charts' && selectedChartType === 'Sangue' && !loading && (
                      selectedResultNames.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-gray-500" style={{ height: '24rem' }}> {/* Added back a height for message div */}
                             Selecione resultados para visualizar o gráfico de Sangue.
                         </div>
                      ) : (
                        <div className="w-full h-96 flex items-center justify-center text-gray-500">
                             Nenhum dado de exame de Sangue encontrado para os filtros selecionados.
                         </div>
                      )
                   )}

                 {/* Mensagem se nenhum tipo de gráfico selecionado (e não carregando) */}
                {currentView === 'charts' && selectedChartType === null && !loading && (
                   <div className="w-full flex items-center justify-center text-gray-500" style={{ height: '24rem' }}> {/* Added back a height for message div */}
                       Selecione um tipo de exame (Urina ou Sangue) para visualizar o gráfico.
                   </div>
                )}

                </>
              )}
            </>
          )}


          {/* List Area */}
          {currentView === 'list' && (
            <>
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                // Display the list of exams using ExameGrid
                 <div className="w-full">
                    {/* Ensure filteredExames has the correct type structure for the list */}
                    {/* Exibir mensagem se não houver exames filtrados na lista */}
                    {filteredExames.length === 0 && !loading ? (
                       <div className="w-full h-48 flex items-center justify-center text-gray-500">
                            Nenhum exame encontrado para os filtros selecionados.
                        </div>
                    ) : (
                       <ExameGrid exames={filteredExames as ExameCompleto[]} onDeleteClick={handleDeleteClick} />
                    )}
                 </div>
              )}
            </>
          )}
        </main> {/* Fechamento da tag main */}
      </div> {/* Fechamento da div flex-1 */}
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este exame.
            </AlertDialogDescription>
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
