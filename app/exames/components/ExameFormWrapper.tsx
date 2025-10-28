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
// CORREÇÃO: Usa o tipo Consulta do arquivo de tipos centralizado e remove o tipo antigo
import {
  Consulta,
  Profissional,
  CondicaoSaude,
  ResultadoExame,
  Exame
} from "@/app/_components/types"; 
import { ExamDetailsForm } from "./ExamDetailForm";
import { UnidadeDeSaude } from "@prisma/client";

// CORREÇÃO: Usa o tipo Consulta enriquecido
type ExameComRelacoes = Exame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: UnidadeDeSaude | null;
  consulta?: Consulta | null; 
  condicaoSaude?: CondicaoSaude | null;
};

type ApiExameResult = {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia?: string;
};

type AnaliseApiResponse = {
  resultados: ApiExameResult[];
  anotacao: string | null;
};

export function ExameFormWrapper({
  existingExamData,
}: {
  existingExamData?: ExameComRelacoes | null;
}) {
  // CORREÇÃO: Usa o tipo Consulta para o estado
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [unidades, setUnidades] = useState<UnidadeDeSaude[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeDeSaude | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]);
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);

  const [tipo, setTipo] = useState<string>("");
  const [dataExame, setDataExame] = useState<string>("");
  const [horaExame, setHoraExame] = useState<string>("");
  const [anotacao, setAnotacao] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [exameResultados, setExameResultados] = useState<Partial<ResultadoExame>[]>([]);

  const [selectorsKey, setSelectorsKey] = useState(0);

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [consultasRes, condicoesRes, unidadesRes] = await Promise.all([
          fetch(`/api/consultas`),
          fetch(`/api/condicoessaude`),
          fetch(`/api/unidadesaude`),
        ]);

        if (consultasRes.ok) {
          const data = await consultasRes.json();
          setConsultas(Array.isArray(data) ? data : data.consultas || []);
        }
        if (condicoesRes.ok) {
          const data = await condicoesRes.json();
          setCondicoesSaude(Array.isArray(data) ? data : data.condicoes || []);
        }
        if (unidadesRes.ok) {
          const data = await unidadesRes.json();
          setUnidades(Array.isArray(data) ? data : data.unidades || []);
        }
      } catch {
        toast({ title: "Erro ao carregar dados iniciais.", variant: "destructive" });
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    if (!selectedUnidade?.id) {
      setProfissionais([]);
      return;
    }
    
    const fetchProfissionais = async () => {
      try {
        const res = await fetch(`/api/profissionais?unidadeId=${selectedUnidade.id}`);
        if(res.ok) {
          const data = await res.json();
          setProfissionais(Array.isArray(data) ? data : []);
        }
      } catch {
        toast({ title: "Erro ao buscar profissionais.", variant: "destructive" });
      }
    }

    fetchProfissionais();
  }, [selectedUnidade]);

  useEffect(() => {
    if (existingExamData) {
      setTipo(existingExamData.tipo || "");
      const dataUtc = new Date(existingExamData.dataExame);
      if (!isNaN(dataUtc.getTime())) {
        const ano = dataUtc.getFullYear();
        const mes = (dataUtc.getMonth() + 1).toString().padStart(2, '0');
        const dia = dataUtc.getDate().toString().padStart(2, '0');
        setDataExame(`${ano}-${mes}-${dia}`);

        const horas = dataUtc.getHours().toString().padStart(2, '0');
        const minutos = dataUtc.getMinutes().toString().padStart(2, '0');
        setHoraExame(`${horas}:${minutos}`);
      }

      setAnotacao(existingExamData.anotacao || "");
      setExameResultados(existingExamData.resultados || []);
      setSelectedConsulta(existingExamData.consulta || null);
      setSelectedProfissional(existingExamData.profissional || null);
      setSelectedUnidade(existingExamData.unidades || null);
      setSelectedCondicao(existingExamData.condicaoSaude || null);

      setSelectorsKey((prevKey) => prevKey + 1);
    }
  }, [existingExamData]);

  const handleAddExame = () => {
    setExameResultados((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", valor: "" },
    ]);
  };

  const handleRemoveExame = (index: number) => {
    setExameResultados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExameChange = (
    index: number,
    field: keyof ResultadoExame,
    value: string,
  ) => {
    setExameResultados((prev) => {
      const novosResultados = [...prev];
      const item = novosResultados[index] as ResultadoExame;
      (item[field] as string) = value;
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
      toast({ title: "Por favor, selecione um arquivo primeiro.", variant: "destructive" });
      return;
    }
    if (!tipo) {
      toast({ title: "Por favor, selecione o tipo de exame primeiro.", variant: "destructive" });
      return;
    }

    setLoadingAnalysis(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("tipo", tipo);

    try {
      const res = await fetch("/api/exames/analise", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        toast({ title: "Erro ao analisar arquivo", description: errorData.error, variant: "destructive" });
        return;
      }

      const data: AnaliseApiResponse = await res.json();
      setExameResultados(data.resultados.map((res) => ({ ...res, id: crypto.randomUUID(), referencia: res.valorReferencia })) || []);
      setAnotacao(data.anotacao || "");
      toast({ title: "Análise concluída com sucesso!" });

    } catch {
      toast({ title: "Ocorreu um erro inesperado durante a análise.", variant: "destructive" });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSubmit = async () => {
    setLoadingSubmit(true);
    const [ano, mes, dia] = dataExame.split('-').map(Number);
    const [horas, minutos] = horaExame.split(':').map(Number);
    const dataIso = new Date(ano, mes - 1, dia, horas, minutos).toISOString();

    const endpoint = existingExamData ? `/api/exames/${existingExamData.id}` : "/api/exames";
    const method = existingExamData ? "PUT" : "POST";

    const body = new FormData();
    if (userId) body.append("userId", userId);
    if (selectedProfissional?.id) body.append("profissionalId", selectedProfissional.id);
    if (selectedUnidade?.id) body.append("unidadesId", selectedUnidade.id);
    if (selectedConsulta?.id) body.append("consultaId", selectedConsulta.id);
    if (selectedCondicao?.id) body.append("condicaoSaudeId", selectedCondicao.id);
    body.append("anotacao", anotacao);
    body.append("dataExame", dataIso);
    body.append("tipo", tipo);
    if (exameResultados.length > 0) {
        body.append("resultados", JSON.stringify(exameResultados));
    }
    if (selectedFile && !existingExamData) {
        body.append("file", selectedFile);
    }
    
    try {
        const res = await fetch(endpoint, { method, body });
        if (res.ok) {
            toast({ title: `Exame ${existingExamData ? 'atualizado' : 'cadastrado'} com sucesso!` });
            router.push("/exames");
        } else {
            const errorData = await res.json();
            toast({ title: "Erro ao salvar o exame", description: errorData.error, variant: "destructive" });
        }
    } catch {
        toast({ title: "Ocorreu um erro de rede.", variant: "destructive" });
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
            unidades={unidades}
            selectedUnidade={selectedUnidade}
            onUnidadeSelect={setSelectedUnidade}
            profissionais={profissionais}
            selectedProfissional={selectedProfissional}
            onProfissionalSelect={setSelectedProfissional}
            condicoesSaude={condicoesSaude}
            selectedCondicao={selectedCondicao}
            onCondicaoChange={setSelectedCondicao}
            dataExame={dataExame}
            onDataExameChange={setDataExame}
            horaExame={horaExame}
            onHoraExameChange={setHoraExame}
            tipo={tipo}
            onTipoChange={setTipo}
            selectorsKey={selectorsKey}
          />
          <div>
            <Label>Anotação</Label>
            <Textarea value={anotacao} onChange={(e) => setAnotacao(e.target.value)} />
          </div>
          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <div className="flex items-center space-x-2">
              <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={!!existingExamData} />
              <Button onClick={handleAnalyzeFile} disabled={!selectedFile || loadingAnalysis || !!existingExamData} type="button">
                {loadingAnalysis ? "Analisando..." : "Analisar Arquivo"}
              </Button>
            </div>
            {selectedFile && !existingExamData && <p className="mt-1 text-sm text-muted-foreground">Arquivo: {selectedFile.name}</p>}
            {existingExamData?.nomeArquivo && <p className="mt-1 text-sm text-muted-foreground">Arquivo: {existingExamData.nomeArquivo}</p>}
          </div>
          {["Sangue", "Urina"].includes(tipo) && (
            <TabelaExames exames={exameResultados} onAddExame={handleAddExame} onRemoveExame={handleRemoveExame} onExameChange={handleExameChange} />
          )}
          
          <Button
            type="submit"
            disabled={loadingSubmit}
            className="w-full"
          >
            {loadingSubmit ? (existingExamData ? "Atualizando..." : "Enviando...") : (existingExamData ? "Atualizar Exame" : "Cadastrar Exame")}
          </Button>
        </form>
      </main>
    </>
  );
}
