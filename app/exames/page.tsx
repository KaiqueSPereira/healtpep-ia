"use client";

import { useCallback,useEffect, useState, useMemo } from "react"; // Importe useMemo
import ViewSwitcher from "./components/ViewSwitcher";
import Header from "@/app/_components/header";
import { toast } from "@/app/_hooks/use-toast";
import { Loader2 } from "lucide-react";
import ExameLineChart from "./components/ExameLineChart";
import { Input } from "@/app/_components/ui/input";
import ExameTypeFilter from "./components/ExameTypeFilter";
import { ExameGrid } from "./components/ExamesGrid";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { ChartData, ExameCompleto, ExameGraficos } from "../_components/types";


export default function ExamesPage() {
  const [examesGraficosData, setExamesGraficosData] = useState<ExameGraficos[]>([]); // State for graphics API data
  const [examesListaData, setExamesListaData] = useState<ExameCompleto[]>([]); // State for full exams API data
  const [exames, setExames] = useState<Array<ExameGraficos | ExameCompleto>>([]); // State for raw data based on currentView
  // const [filteredExames, setFilteredExames] = useState<Array<ExameGraficos | ExameCompleto>>([]); // Remova este estado, usaremos useMemo

  const [loading, setLoading] = useState(true);
  const [selectedExameTypes, setSelectedExameTypes] = useState<string[]>([]);
  const [selectedResultNames, setSelectedResultNames] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'charts'>('charts');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);


  // Fetch data based on currentView
  useEffect(() => {
    setLoading(true);
    if (currentView === 'charts') {
      if (examesGraficosData.length > 0) { // Use cached data if available
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
          setExamesGraficosData(data);
          setExames(data); // Update raw data state
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
        .then((res) => res.json()) // Consider if this endpoint should also return decrypted data for the list view
        .then((data) => {
           if (!Array.isArray(data)) {
              console.error("Full Exams API did not return an array:", data);
              toast({ title: "Erro ao carregar lista de exames", variant: "destructive", duration: 5000 });
              return;
           }
          setExamesListaData(data);
          setExames(data); // Update raw data state
         })
        .catch((error) => {
            console.error("Error fetching full exams:", error);
            toast({title: "Erro ao carregar lista de exames",variant: "destructive", duration: 5000 });
        })
        .finally(() => setLoading(false));
    }
  }, [currentView, examesGraficosData, examesListaData]); // Dependencies on currentView and cached data

  // Filter exams based on selectedExameTypes and date range using useMemo
  const filteredExames = useMemo(() => {
    let filtered = exames; // Start with the current raw data

    // Filter by exam types (only apply filter when in charts view)
    if (currentView === 'charts' && selectedExameTypes.length > 0) {
       // Need to assert type for exames to access resultados
      filtered = (filtered as ExameGraficos[]).filter(exame =>
        exame.resultados?.some(resultado =>
          selectedExameTypes.includes(resultado.nome)
        )
      );
    }

    // Filter by date range (apply filter in both views)
    if (startDate || endDate) {
      filtered = filtered.filter(exame => {
        const examDate = new Date(exame.dataExame).getTime();
        const start = startDate ? new Date(startDate).getTime() : -Infinity;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        return examDate >= start && examDate <= end;
      });
    }

    return filtered;
  }, [exames, selectedExameTypes, startDate, endDate, currentView]); // Depend on states that affect filtering


  // Generate chart data based on filteredExames and selectedResultNames
  useEffect(() => {
    // Only generate chart data in charts view and if there's filtered data and selected results
    if (currentView === 'list' || !filteredExames.length || selectedResultNames.length === 0) {
      setChartData(null);
      return;
    }

    console.log("Generating chart data...");
    console.log("filteredExames:", filteredExames);
    console.log("selectedResultNames:", selectedResultNames);

    const processedData: { [resultName: string]: { dates: string[], values: number[] } } = {};

    // Ensure filteredExames has the correct type structure for charts
    const filteredExamesForCharts = filteredExames as ExameGraficos[];

    filteredExamesForCharts.forEach(exame => {
      exame.resultados?.forEach(resultado => {
        if (selectedResultNames.includes(resultado.nome)) {
          const numericValue = parseFloat(resultado.valor);
          if (!isNaN(numericValue)) {
             if (!processedData[resultado.nome]) {
                processedData[resultado.nome] = { dates: [], values: [] };
              }
            processedData[resultado.nome].dates.push(new Date(exame.dataExame).toLocaleDateString());
            processedData[resultado.nome].values.push(numericValue);
          }
        }
      });
    });

    console.log("processedData:", processedData);

    const allDates = Object.values(processedData).flatMap(data => data.dates)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());


      const chartDatasets = Object.entries(processedData).map(([resultName, data], index) => ({
        label: resultName,
        data: allDates.map(date => {
          const dataIndex = data.dates.indexOf(date);
          return dataIndex > -1 ? data.values[dataIndex] : 0;
        }) as number[], // Afirme o tipo como number[]
        borderColor: `hsl(${index * 50}, 70%, 50%)`,
        backgroundColor: `hsl(${index * 50}, 70%, 70%, 0.2)`,
        tension: 0.1,
        spanGaps: true,
      }));


    setChartData({
      labels: allDates,
      datasets: chartDatasets,
    });

  }, [filteredExames, selectedResultNames, currentView]); // Depend on currentView and states that affect chart data

  const handleSelectTypes = useCallback((selectedTypes: string[]) => {
    setSelectedExameTypes(selectedTypes);
  }, [setSelectedExameTypes]);

  const handleSelectResultsForChart = useCallback((selectedResults: string[]) => {
    setSelectedResultNames(selectedResults);
  }, [setSelectedResultNames]);

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
        // Remove the deleted exam from both cached states
        setExamesGraficosData(prev => prev.filter(exame => exame.id !== examToDelete));
        setExamesListaData(prev => prev.filter(exame => exame.id !== examToDelete));
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
        {/* Main Content */}
        {/* Keep the original padding for main */}
        <main className={`flex-1 space-y-6 p-4 md:p-6`}>
          {/* Title and ViewSwitcher */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <h1 className="text-2xl font-bold mb-2 md:mb-0">Meus Exames</h1>
             <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
          </div>


          {currentView === 'charts' && (
            <> {/* Add Fragment here */}
              <div className="flex flex-wrap gap-4 items-center mb-6">
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

                  <ExameTypeFilter
                     exames={examesGraficosData}
                      onSelectTypes={handleSelectTypes} // Use a callback envolvida
                       onSelectResultsForChart={handleSelectResultsForChart} // Use a callback envolvida
                  />
              </div>

              {/* Chart Area with negative margins */}
              {chartData && chartData.datasets.length > 0 && selectedResultNames.length > 0 ? (
                 <div className="w-full h-80 md:h-120 -mx-4 md:-mx-6"> {/* Added negative horizontal margins */}
                   <ExameLineChart data={chartData} title="Evolução dos Resultados" />
                 </div>
              ) : (
                  <div className="w-full h-96 flex items-center justify-center text-gray-500">
                       {selectedResultNames.length === 0 ? "Selecione resultados para visualizar o gráfico." : "Nenhum dado de exame encontrado para os filtros selecionados."}
                   </div>
              )}
            </> // Close Fragment here
          )}

          {/* Filters Area (only in list view) */}
          {currentView === 'list' && (
              <div className="flex flex-wrap gap-4 items-center mb-6">
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
              </div>
          )}


          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* No need for a separate conditional render for chart here */}
              {currentView === 'list' && (
                // Display the list of exams using ExameGrid
                 <div className="w-full">
                    {/* Ensure filteredExames has the correct type structure for the list */}
                    <ExameGrid exames={filteredExames as ExameCompleto[]} onDeleteClick={handleDeleteClick} />
                 </div>
              )}
            </>
          )}
        </main>
      </div>
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
