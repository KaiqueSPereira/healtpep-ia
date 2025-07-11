// app/exames/components/ExameFormWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "../../_components/header";
import TabelaExames from "./TabelaExames";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import { Textarea } from "../../_components/ui/textarea";
import { toast } from "../../_hooks/use-toast";

import {
  Consulta,
  Profissional,
  Unidade,
  Tratamento,
  ResultadoExame,
  AnaliseApiResponse, 
  ExameCompleto
} from "../../_components/types";
import { ConfirmarExameDialog } from "./ConfirmarExameDialog";
import { ExamDetailsForm } from "./ExamDetailForm";

export function  ExameFormWrapper({ existingExamData }: { existingExamData?: ExameCompleto | null }) {
  // Keep state that is shared or managed by the parent
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(
    null,
  );
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]); // Keep professionals state here as it depends on selectedUnidade
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);

  const [tipo, setTipo] = useState<string>("");
  const [dataExame, setDataExame] = useState<string>("");
  const [anotacao, setAnotacao] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [exameResultados, setExameResultados] = useState<ResultadoExame[]>([]);

  const [selectorsKey, setSelectorsKey] = useState(0);


  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Fetch consultations and treatments remain here
   useEffect(() => {
    if (!userId) return;

    fetch(`/api/consultas?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setConsultas(d.consultas || []))
      .catch(() =>
        toast({ title: "Erro ao buscar consultas", variant: "destructive", duration: 5000 }),
      );
  }, [userId]);

  useEffect(() => {
    const fetchTratamentos = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(
          `/api/tratamento?userId=${session.user.id}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar tratamentos");

        const data = await response.json();
        setTratamentos(data || []);
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
        toast({ title: "Erro ao carregar tratamentos.", variant: "destructive", duration: 5000 });
      }
    };

    fetchTratamentos();
  }, [session?.user?.id]);

   // Fetch professionals based on selected unit - Keep this here
   useEffect(() => {
        if (!selectedUnidade?.id) {
          setProfissionais([]);
          return;
        }
        fetch(`/api/unidadesaude?id=${selectedUnidade.id}`)
          .then((r) => r.json())
          .then((d) => setProfissionais(d.profissionais || []))
          .catch(() =>
            toast({ title: "Erro ao buscar profissionais", variant: "destructive", duration: 5000 }),
          );
      }, [selectedUnidade]);

    useEffect(() => {
    if (existingExamData) {
      console.log("Existing exam data received:", existingExamData);

      setTipo(existingExamData.tipo || "");
      setDataExame(existingExamData.dataExame.split('T')[0] || "");
      setAnotacao(existingExamData.anotacao || "");
      setExameResultados(existingExamData.resultados || []);
      console.log("exameResultados state after setting from existing data:", existingExamData.resultados);
      setSelectedConsulta(existingExamData.consulta || null);
      console.log("Inspecting existingExamData.consulta before setSelectedConsulta:", existingExamData.consulta);
      setSelectedProfissional(existingExamData.profissional || null);
      console.log("Value being used for setSelectedProfissional:", existingExamData.profissional);
      setSelectedUnidade(existingExamData.unidades || null);
      console.log("Value being used for setSelectedUnidade:", existingExamData.unidades);
      setSelectedTratamento(existingExamData.tratamento || null);


      setSelectorsKey(prevKey => prevKey + 1);
    }
  }, [existingExamData]);


  const handleAddExame = () => {
    setExameResultados((prev) => [
      ...(prev || []),
      {
        id: crypto.randomUUID(),
        nome: "",
        valor: "",
        unidade: "",
        referencia: "",
        outraUnidade: "",
      },
    ]);
  };

  const handleRemoveExame = (index: number) => {
    setExameResultados((prev) => (prev || []).filter((_, i) => i !== index));
  };

  const handleExameChange = (
    index: number,
    field: keyof ResultadoExame,
    value: string,
  ) => {
    setExameResultados((prev) => {
      const novosResultados = [...(prev || [])];
      novosResultados[index] = { ...novosResultados[index], [field]: value };
      console.log("exameResultados state after change:", novosResultados);
      return novosResultados;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setExameResultados([]);
    setAnotacao("");
    setTipo("");
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) {
      toast({ title: "Por favor, selecione um arquivo primeiro.", variant: "destructive", duration: 5000 });
      return;
    }

    setLoadingAnalysis(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/exames/analise", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Erro ao analisar exame:", errorData);
        toast({ title: "Erro ao analisar arquivo", description: errorData.error || "Ocorreu um erro na análise.", variant: "destructive", duration: 5000 });
        setExameResultados([]);
        setAnotacao("");
        return;
      }

      const data: AnaliseApiResponse = await res.json();

      console.log("Resposta da API /api/analise-arquivo:", data);

      if (data.resultados?.length) {
        setExameResultados(data.resultados!.map((res: ResultadoExame) => ({ // Adicione ": ResultadoExame" aqui
          ...res,
          outraUnidade: '',
          referencia: res.referencia || '',
          nome: res.nome || '',
          valor: res.valor || '',
          unidade: res.unidade || '',
        })));
        toast({ title: "Análise concluída com sucesso! Resultados extraídos.", variant: "default", duration: 5000 });
      } else {
        toast({ title: "Análise concluída, mas nenhum resultado específico encontrado.", variant: "default", duration: 5000 });
        setExameResultados([]);
      }

     if (data.anotacao !== undefined && data.anotacao !== null) {
      setAnotacao(data.anotacao ?? "");
    } else {
       setAnotacao("");
    }

    } catch (error: any) {
      console.error("Erro na chamada da API de análise:", error);
      toast({ title: "Erro inesperado na análise", description: error.message || "Ocorreu um erro inesperado durante a análise.", variant: "destructive", duration: 5000 });
       setExameResultados([]);
       setAnotacao("");
    } finally {
      setLoadingAnalysis(false);
    }
  };


  const handleSubmit = async () => {
    setLoadingSubmit(true);

    console.log("Início do handleSubmit:");
    console.log("selectedProfissional:", selectedProfissional);
    console.log("selectedUnidade:", selectedUnidade);
    console.log("selectedConsulta:", selectedConsulta);
    console.log("selectedTratamento:", selectedTratamento);
    console.log("tipo:", tipo);
    console.log("dataExame:", dataExame);
    console.log("anotacao:", anotacao);
    console.log("selectedFile:", selectedFile);
    console.log("exameResultados (antes de enviar):", exameResultados);


    const needsAnalysis = ["Urina", "Sangue"].includes(tipo);
    const analysisDoneAndResultsFound = needsAnalysis ? (exameResultados?.length > 0) : true;


    if (
      !userId ||
      !selectedProfissional?.id ||
      !selectedUnidade?.id ||
      (!existingExamData && !selectedFile) ||
      !dataExame ||
      !tipo ||
      (!selectedConsulta?.id && !selectedTratamento?.id) ||
      (needsAnalysis && !analysisDoneAndResultsFound && !existingExamData)
    ){
      console.log("Validação no handleSubmit falhou!");
      let errorMessage = "Preencha todos os campos obrigatórios.";

      if (!userId) errorMessage = "Erro de autenticação. Por favor, recarregue a página.";
      else if (!selectedProfissional?.id) errorMessage = "Por favor, selecione um profissional.";
      else if (!selectedUnidade?.id) errorMessage = "Por favor, selecione uma unidade.";
      else if (!existingExamData && !selectedFile) errorMessage = "Por favor, selecione um arquivo.";
      else if (!dataExame) errorMessage = "Por favor, preencha a data do exame.";
      else if (!tipo) errorMessage = "Por favor, selecione o tipo de exame.";
      else if (!selectedConsulta?.id && !selectedTratamento?.id) errorMessage = "Por favor, selecione uma consulta ou um tratamento.";
      else if (needsAnalysis && !analysisDoneAndResultsFound && !existingExamData) errorMessage = "Por favor, analise o arquivo e garanta que resultados foram extraídos para este tipo de exame.";


      toast({ title: errorMessage, variant: "destructive", duration: 5000 });
      setLoadingSubmit(false);
      return;
    }

    try {
      const formData = new FormData();

      if (userId) formData.append("userId", userId);
      if (selectedProfissional?.id) formData.append("profissionalId", selectedProfissional.id);
      if (selectedUnidade?.id) formData.append("unidadeId", selectedUnidade.id);
      if (selectedConsulta?.id) formData.append("consultaId", selectedConsulta.id); else formData.append("consultaId", "");
      if (selectedTratamento?.id) formData.append("tratamentoId", selectedTratamento.id); else formData.append("tratamentoId", "");
      formData.append("anotacao", anotacao);
      formData.append("dataExame", dataExame);
      if (selectedFile) formData.append("file", selectedFile);
      formData.append("tipo", tipo);


      let res;
      if (existingExamData) {
        // Update existing exam
        res = await fetch(`/api/exames/${existingExamData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            anotacao: anotacao,
            dataExame: dataExame,
            tratamentoId: selectedTratamento?.id || null,
             tipo: tipo,
             profissionalId: selectedProfissional?.id || null,
             unidadeId: selectedUnidade?.id || null,
             consultaId: selectedConsulta?.id || null,
             resultados: exameResultados.map(r => ({ // Include results for update
                 id: r.id,
                 nome: r.nome,
                 valor: r.valor,
                 unidade: r.unidade === "Outro" ? r.outraUnidade : r.unidade,
                 referencia: r.referencia,
             })),
          }),
        });
      } else {
         formData.append("tipo", tipo);

         if (needsAnalysis && exameResultados.length > 0) {
             formData.append(
                 "exames",
                 JSON.stringify(
                     exameResultados.map((resultado) => ({
                         ...resultado,
                         unidade:
                             resultado.unidade === "Outro"
                                 ? resultado.outraUnidade
                                 : resultado.unidade,
                     })),
                 ),
             );
         }

        res = await fetch("/api/exames", {
          method: "POST",
          body: formData,
        });
      }


      if (res.ok) {
        toast({ title: existingExamData ? "Exame atualizado com sucesso!" : "Exame cadastrado com sucesso!", variant: "default", duration: 5000 });
        router.push("/exames");
      } else {
        const errorData = await res.json();
        toast({ title: existingExamData ? "Erro ao atualizar o exame" : "Erro ao enviar o exame", description: errorData.error || (existingExamData ? "Ocorreu um erro ao atualizar o exame." : "Ocorreu um erro ao salvar o exame."), variant: "destructive", duration: 5000 });
        console.error("Erro do backend:", errorData);
      }
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message || "Ocorreu um erro inesperado.", variant: "destructive", duration: 5000 });
      console.error("Erro no frontend:", err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold">{existingExamData ? "Editar Exame" : "Cadastrar Exame"}</h1> {/* Dynamic title */}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}> {/* Prevent default form submission */}
           {/* Use the new ExamDetailsForm component here */}
           <ExamDetailsForm
                consultas={consultas}
                selectedConsulta={selectedConsulta}
                onConsultaSelect={setSelectedConsulta}
                selectedUnidade={selectedUnidade}
                onUnidadeSelect={setSelectedUnidade}
                profissionais={profissionais} // Pass professionals state down
                selectedProfissional={selectedProfissional}
                onProfissionalSelect={setSelectedProfissional}
                tratamentos={tratamentos} // Pass treatments state down
                selectedTratamento={selectedTratamento}
                onTratamentoSelect={setSelectedTratamento}
                dataExame={dataExame}
                onDataExameChange={setDataExame}
                tipo={tipo} // Pass the type state down
                onTipoChange={(value) => { // Add console log and update state
 console.log("Tipo changed to:", value);
 setTipo(value);
                }}
                selectorsKey={selectorsKey}
           />


          <div>
            <Label>Anotação</Label>
            <Textarea
              value={anotacao} // Use anotacao state
              onChange={(e) => setAnotacao(e.target.value)} // Update anotacao state
            />
          </div>
          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={existingExamData ? true : false} // Disable file upload when editing
              />
               <Button
                onClick={handleAnalyzeFile}
                disabled={!selectedFile || loadingAnalysis || !!existingExamData} // Disable analysis button when editing
                type="button"
              >
                {loadingAnalysis ? "Analisando..." : "Analisar Arquivo"}
              </Button>
            </div>
            {selectedFile && !existingExamData && ( // Only show selected file name for new exams
              <p className="mt-1 text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
             {existingExamData?.nomeArquivo && ( // Show existing file name when editing
                 <p className="mt-1 text-sm text-muted-foreground">
                     Arquivo existente: {existingExamData.nomeArquivo}
                 </p>
             )}
          </div>

          {["Sangue", "Urina"].includes(tipo) && (
            <>
              <TabelaExames
                exames={exameResultados || []} // Use exameResultados state
                onAddExame={handleAddExame}
                onRemoveExame={handleRemoveExame}
                onExameChange={handleExameChange}
              />
            </>
          )}

          <ConfirmarExameDialog
            loadingSubmit={loadingSubmit}
            tipo={tipo}
            dataExame={dataExame} // Use dataExame state
            selectedProfissional={selectedProfissional}
            selectedUnidade={selectedUnidade}
            anotacao={anotacao || ""} // Use anotacao state
            exames={exameResultados || []} // Use exameResultados state
            onSubmit={handleSubmit}
          >
            <Button
              disabled={
                loadingSubmit ||
                (!existingExamData && !selectedFile) || // File is required for new exams
                (["Sangue", "Urina"].includes(tipo) && !existingExamData && (!exameResultados || exameResultados.length === 0)) // Validate analysis and results only for new exams of types that need analysis
              }
              className="w-full"
            >
              {loadingSubmit ? (existingExamData ? "Atualizando..." : "Enviando...") : (existingExamData ? "Atualizar Exame" : "Cadastrar Exame")} {/* Dynamic button text */}
            </Button>
          </ConfirmarExameDialog>
        </form>
      </main>
    </>
  );
};
