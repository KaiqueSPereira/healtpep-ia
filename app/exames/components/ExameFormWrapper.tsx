"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/_stores/authStore";
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
  CondicaoSaude,
  ResultadoExame,
  Exame
} from "@/app/_components/types"; 
import { ExamDetailsForm } from "./ExamDetailForm";
import { UnidadeDeSaude } from "@prisma/client";

// Tipos atualizados para incluir anexos
type Anexo = {
  id: string;
  nomeArquivo: string;
};

type ExameComRelacoes = Exame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: UnidadeDeSaude | null;
  consulta?: Consulta | null; 
  condicaoSaude?: CondicaoSaude | null;
  anexos?: Anexo[]; // Adicionado
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [exameResultados, setExameResultados] = useState<Partial<ResultadoExame>[]>([]);

  const [selectorsKey, setSelectorsKey] = useState(0);

  const router = useRouter();
  const { session } = useAuthStore();
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
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(prev => [...prev, ...files]); // Append new files
  };

  const handleAnalyzeFile = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Por favor, selecione um ou mais arquivos.", variant: "destructive" });
      return;
    }
    if (!tipo) {
      toast({ title: "Por favor, selecione o tipo de exame primeiro.", variant: "destructive" });
      return;
    }

    setLoadingAnalysis(true);
    let analysisSuccessCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", tipo);

      try {
        const res = await fetch("/api/exames/analise", { method: "POST", body: formData });
        if (!res.ok) {
          const errorData = await res.json();
          toast({
            title: `Erro ao analisar o arquivo ${file.name}`,
            description: errorData.error,
            variant: "destructive",
          });
          continue; 
        }

        const data: AnaliseApiResponse = await res.json();
        
        if (data.resultados) {
          setExameResultados(prev => [
            ...prev,
            ...data.resultados.map((res) => ({ ...res, id: crypto.randomUUID(), referencia: res.valorReferencia }))
          ]);
        }
        if (data.anotacao) {
          setAnotacao(prev => 
            prev 
            ? `${prev}\n\n--- ANÁLISE DE ${file.name} ---\n${data.anotacao}` 
            : `--- ANÁLISE DE ${file.name} ---\n${data.anotacao}`
          );
        }
        analysisSuccessCount++;
      } catch (error) {
        toast({
          title: `Erro ao processar o arquivo ${file.name}`,
          description: "Verifique sua conexão ou o formato do arquivo.",
          variant: "destructive",
        });
      }
    }
    
    if (analysisSuccessCount > 0) {
        setSelectedFiles([]);
        toast({ title: `Análise concluída para ${analysisSuccessCount} de ${selectedFiles.length} arquivo(s).` });
    }

    setLoadingAnalysis(false);
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
    body.append("profissionalId", selectedProfissional?.id || "null");
    body.append("unidadesId", selectedUnidade?.id || "null");
    body.append("consultaId", selectedConsulta?.id || "null");
    body.append("condicaoSaudeId", selectedCondicao?.id || "null");
    body.append("anotacao", anotacao);
    body.append("dataExame", dataIso);
    body.append("tipo", tipo);
    
    if (exameResultados.length > 0) {
        body.append("resultados", JSON.stringify(exameResultados));
    }
    
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(file => {
          body.append(`files`, file);
      });
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
              <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} multiple />
              <Button onClick={handleAnalyzeFile} disabled={selectedFiles.length === 0 || loadingAnalysis} type="button">
                {loadingAnalysis ? "Analisando..." : "Analisar Arquivo(s)"}
              </Button>
            </div>
             {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium text-muted-foreground">Novos arquivos a serem enviados:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-muted-foreground">{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Mostra os arquivos já existentes se nenhum novo foi selecionado */}
            {existingExamData?.anexos && existingExamData.anexos.length > 0 && selectedFiles.length === 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium text-muted-foreground">Arquivos atuais:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {existingExamData.anexos.map((anexo) => (
                    <li key={anexo.id} className="text-muted-foreground">{anexo.nomeArquivo}</li>
                  ))}
                </ul>
              </div>
            )}
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
