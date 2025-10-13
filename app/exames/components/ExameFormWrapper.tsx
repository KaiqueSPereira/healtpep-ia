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
  ExameCompleto,
  ApiExameResult,
} from "../../_components/types";
import { ConfirmarExameDialog } from "./ConfirmarExameDialog";
import { ExamDetailsForm } from "./ExamDetailForm";

export function ExameFormWrapper({
  existingExamData,
}: {
  existingExamData?: ExameCompleto | null;
}) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [selectedTratamento, setSelectedTratamento] = useState<Tratamento | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);

  const [tipo, setTipo] = useState<string>("");
  const [dataExame, setDataExame] = useState<string>("");
  const [horaExame, setHoraExame] = useState<string>("");
  const [anotacao, setAnotacao] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [exameResultados, setExameResultados] = useState<ResultadoExame[]>([]);

  const [selectorsKey, setSelectorsKey] = useState(0);

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/consultas?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setConsultas(d.consultas || []))
      .catch(() =>
        toast({
          title: "Erro ao buscar consultas",
          variant: "destructive",
          duration: 5000,
        }),
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
        toast({
          title: "Erro ao carregar tratamentos.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    fetchTratamentos();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!selectedUnidade?.id) {
      setProfissionais([]);
      return;
    }
    fetch(`/api/unidadesaude?id=${selectedUnidade.id}`)
      .then((r) => r.json())
      .then((d) => setProfissionais(d.profissionais || []))
      .catch(() =>
        toast({
          title: "Erro ao buscar profissionais",
          variant: "destructive",
          duration: 5000,
        }),
      );
  }, [selectedUnidade]);

  useEffect(() => {
    if (existingExamData) {
      setTipo(existingExamData.tipo || "");

      // CORREÇÃO: Lógica de data e hora robusta com fusos horários
      const dataUtc = new Date(existingExamData.dataExame);
      if (!isNaN(dataUtc.getTime())) {
        // Formata a data no formato YYYY-MM-DD
        const ano = dataUtc.getFullYear();
        const mes = (dataUtc.getMonth() + 1).toString().padStart(2, '0');
        const dia = dataUtc.getDate().toString().padStart(2, '0');
        setDataExame(`${ano}-${mes}-${dia}`);

        // Formata a hora no formato HH:MM
        const horas = dataUtc.getHours().toString().padStart(2, '0');
        const minutos = dataUtc.getMinutes().toString().padStart(2, '0');
        setHoraExame(`${horas}:${minutos}`);
      }

      setAnotacao(existingExamData.anotacao || "");
      setExameResultados(existingExamData.resultados || []);
      setSelectedConsulta(existingExamData.consulta || null);
      setSelectedProfissional(existingExamData.profissional || null);
      setSelectedUnidade(existingExamData.unidades || null);
      setSelectedTratamento(existingExamData.tratamento || null);

      setSelectorsKey((prevKey) => prevKey + 1);
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
      return novosResultados;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setExameResultados([]);
    setAnotacao("");
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) {
      toast({ title: "Por favor, selecione um arquivo primeiro.", variant: "destructive", duration: 5000 });
      return;
    }

    if (!tipo) {
      toast({ title: "Por favor, selecione o tipo de exame primeiro.", variant: "destructive", duration: 5000 });
      return;
    }

    setLoadingAnalysis(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("tipoExame", tipo);

    try {
      const res = await fetch("/api/exames/analise", { method: "POST", body: formData });

      if (!res.ok) {
        const errorData = await res.json();
        toast({ title: "Erro ao analisar arquivo", description: errorData.error || "Ocorreu um erro na análise.", variant: "destructive", duration: 5000 });
        setExameResultados([]);
        setAnotacao("");
        return;
      }

      const data: AnaliseApiResponse = await res.json();

      if (data.resultados?.length) {
        setExameResultados(
          data.resultados.map((res: ApiExameResult) => ({
            ...res, id: crypto.randomUUID(), outraUnidade: "", referencia: res.valorReferencia || "", nome: res.nome || "", valor: res.valor || "", unidade: res.unidade || "",
          })),
        );
        toast({ title: "Análise concluída com sucesso! Resultados extraídos.", variant: "default", duration: 5000 });
      } else {
        toast({ title: "Análise concluída. Nenhum resultado estruturado foi encontrado.", variant: "default", duration: 5000 });
        setExameResultados([]);
      }

      if (data.anotacao !== undefined && data.anotacao !== null) {
        setAnotacao(data.anotacao ?? "");
      } else {
        setAnotacao("");
      }
    } catch {
      toast({ title: "Ocorreu um erro inesperado durante a análise.", variant: "destructive", duration: 5000 });
      setExameResultados([]);
      setAnotacao("");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSubmit = async () => {
    setLoadingSubmit(true);

    // CORREÇÃO: Juntar data e hora em um objeto Date e converter para ISO string
    const [ano, mes, dia] = dataExame.split('-').map(Number);
    const [horas, minutos] = horaExame.split(':').map(Number);
    const dataLocal = new Date(ano, mes - 1, dia, horas, minutos);
    const dataIso = dataLocal.toISOString();

    const needsAnalysis = ["Urina", "Sangue"].includes(tipo);
    const analysisDoneAndResultsFound = needsAnalysis ? exameResultados?.length > 0 : true;

    if (
      !userId || !selectedProfissional?.id || !selectedUnidade?.id || (!existingExamData && !selectedFile) || !dataExame || !horaExame || !tipo || (!selectedConsulta?.id && !selectedTratamento?.id) || (needsAnalysis && !analysisDoneAndResultsFound && !existingExamData)
    ) {
      let errorMessage = "Preencha todos os campos obrigatórios.";
      if (!horaExame) errorMessage = "Por favor, preencha a hora do exame.";
      toast({ title: errorMessage, variant: "destructive", duration: 5000 });
      setLoadingSubmit(false);
      return;
    }

    try {
      if (existingExamData) {
        const res = await fetch(`/api/exames/${existingExamData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anotacao: anotacao,
            dataExame: dataIso,
            tratamentoId: selectedTratamento?.id || null,
            tipo: tipo,
            profissionalId: selectedProfissional?.id || null,
            unidadeId: selectedUnidade?.id || null,
            consultaId: selectedConsulta?.id || null,
            resultados: exameResultados.map((r) => ({
              id: r.id, nome: r.nome, valor: r.valor, unidade: r.unidade === "Outro" ? r.outraUnidade : r.unidade, referencia: r.referencia,
            })),
          }),
        });
        if (res.ok) {
          toast({ title: "Exame atualizado com sucesso!", variant: "default", duration: 5000 });
          router.push("/exames");
        } else {
          const errorData = await res.json();
          toast({ title: "Erro ao atualizar o exame", description: errorData.error || "Ocorreu um erro ao atualizar o exame.", variant: "destructive", duration: 5000 });
        }
      } else {
        const formData = new FormData();
        if (userId) formData.append("userId", userId);
        if (selectedProfissional?.id) formData.append("profissionalId", selectedProfissional.id);
        if (selectedUnidade?.id) formData.append("unidadeId", selectedUnidade.id);
        if (selectedConsulta?.id) formData.append("consultaId", selectedConsulta.id);
        if (selectedTratamento?.id) formData.append("tratamentoId", selectedTratamento.id);
        formData.append("anotacao", anotacao);
        formData.append("dataExame", dataIso);
        if (selectedFile) formData.append("file", selectedFile);
        formData.append("tipo", tipo);
        if (needsAnalysis && exameResultados.length > 0) {
          formData.append("exames", JSON.stringify(exameResultados.map((resultado) => ({ ...resultado, unidade: resultado.unidade === "Outro" ? resultado.outraUnidade : resultado.unidade, }))));
        }

        const res = await fetch("/api/exames", { method: "POST", body: formData });

        if (res.ok) {
          toast({ title: "Exame cadastrado com sucesso!", variant: "default", duration: 5000 });
          router.push("/exames");
        } else {
          const errorData = await res.json();
          toast({ title: "Erro ao enviar o exame", description: errorData.error || "Ocorreu um erro ao salvar o exame.", variant: "destructive", duration: 5000 });
        }
      }
    } catch {
        toast({ title: "Ocorreu um erro", variant: "destructive" })
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold">
          {existingExamData ? "Editar Exame" : "Cadastrar Exame"}
        </h1>
        <form
          className="space-y-6"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        >
          <ExamDetailsForm
            consultas={consultas}
            selectedConsulta={selectedConsulta}
            onConsultaSelect={setSelectedConsulta}
            selectedUnidade={selectedUnidade}
            onUnidadeSelect={setSelectedUnidade}
            profissionais={profissionais}
            selectedProfissional={selectedProfissional}
            onProfissionalSelect={setSelectedProfissional}
            tratamentos={tratamentos}
            selectedTratamento={selectedTratamento}
            onTratamentoSelect={setSelectedTratamento}
            dataExame={dataExame}
            onDataExameChange={setDataExame}
            horaExame={horaExame}
            onHoraExameChange={setHoraExame}
            tipo={tipo}
            onTipoChange={(value) => setTipo(value)}
            selectorsKey={selectorsKey}
          />
          <div>
            <Label>Anotação</Label>
            <Textarea value={anotacao} onChange={(e) => setAnotacao(e.target.value)} />
          </div>
          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <div className="flex items-center space-x-2">
              <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={existingExamData ? true : false} />
              <Button onClick={handleAnalyzeFile} disabled={!selectedFile || loadingAnalysis || !!existingExamData} type="button">
                {loadingAnalysis ? "Analisando..." : "Analisar Arquivo"}
              </Button>
            </div>
            {selectedFile && !existingExamData && <p className="mt-1 text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>}
            {existingExamData?.nomeArquivo && <p className="mt-1 text-sm text-muted-foreground">Arquivo existente: {existingExamData.nomeArquivo}</p>}
          </div>
          {["Sangue", "Urina"].includes(tipo) && (
            <>
              <TabelaExames exames={exameResultados || []} onAddExame={handleAddExame} onRemoveExame={handleRemoveExame} onExameChange={handleExameChange} />
            </>
          )}
          <ConfirmarExameDialog
            loadingSubmit={loadingSubmit}
            tipo={tipo}
            dataExame={dataExame}
            selectedProfissional={selectedProfissional}
            selectedUnidade={selectedUnidade}
            anotacao={anotacao || ""}
            exames={exameResultados || []}
            onSubmit={handleSubmit}
          >
            <Button
              disabled={loadingSubmit || (!existingExamData && !selectedFile) || (["Sangue", "Urina"].includes(tipo) && !existingExamData && (!exameResultados || exameResultados.length === 0))}
              className="w-full"
            >
              {loadingSubmit ? (existingExamData ? "Atualizando..." : "Enviando...") : (existingExamData ? "Atualizar Exame" : "Cadastrar Exame")}
            </Button>
          </ConfirmarExameDialog>
        </form>
      </main>
    </>
  );
}
