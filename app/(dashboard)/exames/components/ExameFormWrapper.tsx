'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/_stores/authStore";
import TabelaExames from "./TabelaExames";
import { Button } from "../../../_components/ui/button";
import { Input } from "../../../_components/ui/input";
import { Label } from "../../../_components/ui/label";
import { Textarea } from "../../../_components/ui/textarea";
import { toast } from "../../../_hooks/use-toast";
import {
  Consulta,
  Profissional,
  CondicaoSaude,
  ResultadoExame,
  Exame
} from "@/app/_components/types"; 
import { ExamDetailsForm } from "./ExamDetailForm";
import { UnidadeDeSaude } from "@prisma/client";


type Anexo = {
  id: string;
  nomeArquivo: string;
};

type ExameComRelacoes = Exame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  profissionalExecutante?: Profissional | null;
  unidades?: UnidadeDeSaude | null;
  consulta?: Consulta | null; 
  condicaoSaude?: CondicaoSaude | null;
  anexos?: Anexo[];
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
  const [selectedProfissionalExecutante, setSelectedProfissionalExecutante] = useState<Profissional | null>(null);
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

  // Função simplificada para apenas definir a consulta selecionada
  const handleConsultaSelect = (consulta: Consulta | null) => {
    setSelectedConsulta(consulta);
  };

  // Carrega todos os dados necessários para os menus
  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const [consultasRes, condicoesRes, unidadesRes, profissionaisRes] = await Promise.all([
          fetch(`/api/consultas`, { cache: 'no-store' }),
          fetch(`/api/condicoes`),
          fetch(`/api/unidadesaude`),
          fetch(`/api/profissionais`)
        ]);

        if (consultasRes.ok) setConsultas(await consultasRes.json());
        if (condicoesRes.ok) setCondicoesSaude(await condicoesRes.json());
        if (unidadesRes.ok) setUnidades(await unidadesRes.json());
        if (profissionaisRes.ok) setProfissionais(await profissionaisRes.json());

      } catch {
        toast({ title: "Erro ao carregar dados iniciais.", variant: "destructive" });
      }
    };
    fetchData();
  }, [userId]);

  // **USE EFFECT PARA ATUALIZAR CAMPOS COM BASE NA CONSULTA SELECIONADA**
  useEffect(() => {
    // Se uma consulta for selecionada, atualiza os campos dependentes.
    if (selectedConsulta) {
      setSelectedUnidade(selectedConsulta.unidade || null);
      setSelectedProfissional(selectedConsulta.profissional || null);
      setSelectedCondicao(selectedConsulta.condicaoSaude || null);
    } else {
      // Se a consulta for removida, não limpamos os outros campos
      // para permitir a seleção manual.
    }
    // Força a recriação dos menus para refletir o estado mais recente
    setSelectorsKey(prev => prev + 1);
  }, [selectedConsulta]);

  // Carrega os dados de um exame existente para edição
  useEffect(() => {
    if (existingExamData) {
      setTipo(existingExamData.tipo || "");
      if (existingExamData.dataExame) {
        const dataUtc = new Date(existingExamData.dataExame);
        if (!isNaN(dataUtc.getTime())) {
            const ano = dataUtc.getUTCFullYear();
            const mes = (dataUtc.getUTCMonth() + 1).toString().padStart(2, '0');
            const dia = dataUtc.getUTCDate().toString().padStart(2, '0');
            setDataExame(`${ano}-${mes}-${dia}`);

            const horas = dataUtc.getUTCHours().toString().padStart(2, '0');
            const minutos = dataUtc.getUTCMinutes().toString().padStart(2, '0');
            setHoraExame(`${horas}:${minutos}`);
        }
      }
      setAnotacao(existingExamData.anotacao || "");
      setExameResultados(existingExamData.resultados || []);
      
      // Define a consulta, o que vai acionar o useEffect acima para preencher o resto.
      // Se não houver consulta, define os outros campos individualmente.
      if (existingExamData.consulta) {
        setSelectedConsulta(existingExamData.consulta);
      } else {
        setSelectedUnidade(existingExamData.unidades || null); 
        setSelectedProfissional(existingExamData.profissional || null); 
        setSelectedCondicao(existingExamData.condicaoSaude || null);
        setSelectorsKey(prev => prev + 1);
      }
      // Define o profissional executante se ele existir
      if(existingExamData.profissionalExecutante) {
          setSelectedProfissionalExecutante(existingExamData.profissionalExecutante);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSelectedFiles(prev => [...prev, ...files]);
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
        // A LINHA PROBLEMÁTICA FOI REMOVIDA DAQUI
        toast({ title: `Análise concluída para ${analysisSuccessCount} de ${selectedFiles.length} arquivo(s).` });
    }

    setLoadingAnalysis(false);
  };

 const handleSubmit = async () => {
    if (!tipo) {
      toast({
        title: "O tipo de exame é obrigatório.",
        description: "Por favor, selecione um tipo antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setLoadingSubmit(true);

    const body = new FormData();

    if (dataExame) {
        const fullDate = new Date(dataExame + (horaExame ? 'T' + horaExame : 'T00:00:00'));
        if (!isNaN(fullDate.getTime())) {
            body.append("dataExame", fullDate.toISOString());
        }
    }

    const endpoint = existingExamData
      ? `/api/exames/${existingExamData.id}`
      : "/api/exames";
    const method = existingExamData ? "PUT" : "POST";

    if (userId) body.append("userId", userId);

    body.append("nome", tipo);
    body.append("tipo", tipo);
    body.append("anotacao", anotacao);

    body.append("profissionalId", selectedProfissional?.id || "");
    body.append("profissionalExecutanteId", selectedProfissionalExecutante?.id || "");
    body.append("unidadesId", selectedUnidade?.id || "");
    body.append("consultaId", selectedConsulta?.id || "");
    body.append("condicaoSaudeId", selectedCondicao?.id || "");

    if (exameResultados.length > 0) {
      body.append("resultados", JSON.stringify(exameResultados));
    }

    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        body.append(`files`, file);
      });
    }

    try {
      const res = await fetch(endpoint, { method, body });
      if (res.ok) {
        toast({
          title: `Exame ${existingExamData ? "atualizado" : "cadastrado"} com sucesso!`,
        });
        router.push("/exames");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast({
          title: "Erro ao salvar o exame",
          description: errorData.error || "Não foi possível salvar, verifique os dados.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Ocorreu um erro de rede.",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
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
            onConsultaSelect={handleConsultaSelect}
            unidades={unidades}
            selectedUnidade={selectedUnidade}
            onUnidadeSelect={setSelectedUnidade}
            profissionais={profissionais}
            selectedProfissional={selectedProfissional}
            onProfissionalSelect={setSelectedProfissional}
            selectedProfissionalExecutante={selectedProfissionalExecutante}
            onProfissionalExecutanteSelect={setSelectedProfissionalExecutante}
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
