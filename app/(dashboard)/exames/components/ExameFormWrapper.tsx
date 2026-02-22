'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/_stores/authStore";
import TabelaExames from "./TabelaExames";
import { Button } from "../../../_components/ui/button";
import { Input } from "../../../_components/ui/input";
import { Label } from "../../../_components/ui/label";
import { Textarea } from "../../../_components/ui/textarea";
import { Switch } from "../../../_components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { toast } from "../../../_hooks/use-toast";
import {
  Consulta,
  Profissional,
  CondicaoSaude,
  ResultadoExame,
  Exame
} from "@/app/_components/types"; 
import { UnidadeDeSaude } from "@prisma/client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../_components/ui/select";
import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/(dashboard)/consulta/components/menuconsultas";
import MenuCondicoes from "@/app/(dashboard)/condicoes/_Components/MenuCondicoes";

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
  laudoFinalizado?: boolean;
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
  const [laudoFinalizado, setLaudoFinalizado] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [exameResultados, setExameResultados] = useState<Partial<ResultadoExame>[]>([]);
  const [selectorsKey, setSelectorsKey] = useState(0);

  const router = useRouter();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const handleConsultaSelect = (consulta: Consulta | null) => {
    setSelectedConsulta(consulta);
  };

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

  useEffect(() => {
    if (selectedConsulta) {
      setSelectedUnidade(selectedConsulta.unidade || null);
      setSelectedProfissional(selectedConsulta.profissional || null);
      setSelectedCondicao(selectedConsulta.condicaoSaude || null);
    } 
    setSelectorsKey(prev => prev + 1);
  }, [selectedConsulta]);

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
      setLaudoFinalizado(existingExamData.laudoFinalizado || false);
      
      if (existingExamData.consulta) {
        setSelectedConsulta(existingExamData.consulta);
      } else {
        setSelectedUnidade(existingExamData.unidades || null); 
        setSelectedProfissional(existingExamData.profissional || null); 
        setSelectedCondicao(existingExamData.condicaoSaude || null);
        setSelectorsKey(prev => prev + 1);
      }
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
    if (selectedFiles.length === 0 || !tipo) return;

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
          toast({ title: `Erro ao analisar ${file.name}`, description: errorData.error, variant: "destructive" });
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
        toast({ title: `Erro ao processar ${file.name}`, description: "Verifique a conexão.", variant: "destructive" });
      }
    }
    
    if (analysisSuccessCount > 0) {
        toast({ title: `Análise concluída para ${analysisSuccessCount} de ${selectedFiles.length} arquivo(s).` });
    }

    setLoadingAnalysis(false);
  };

 const handleSubmit = async () => {
    if (!tipo) {
      toast({ title: "O tipo de exame é obrigatório.", variant: "destructive" });
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

    const endpoint = existingExamData ? `/api/exames/${existingExamData.id}` : "/api/exames";
    const method = existingExamData ? "PUT" : "POST";

    if (userId) body.append("userId", userId);

    body.append("nome", tipo);
    body.append("tipo", tipo);
    body.append("anotacao", anotacao);
    body.append("laudoFinalizado", String(laudoFinalizado));

    body.append("profissionalId", selectedProfissional?.id || "");
    body.append("profissionalExecutanteId", selectedProfissionalExecutante?.id || "");
    body.append("unidadesId", selectedUnidade?.id || "");
    body.append("consultaId", selectedConsulta?.id || "");
    body.append("condicaoSaudeId", selectedCondicao?.id || "");

    if (exameResultados.length > 0) {
      body.append("resultados", JSON.stringify(exameResultados));
    }

    selectedFiles.forEach(file => body.append(`files`, file));

    try {
      const res = await fetch(endpoint, { method, body });
      if (res.ok) {
        toast({ title: `Exame ${existingExamData ? "atualizado" : "cadastrado"}!` });
        router.push("/exames");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast({ title: "Erro ao salvar", description: errorData.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro de rede", variant: "destructive" });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="bg-background">
        <h1 className="text-3xl font-bold mb-8">
          {existingExamData ? "Editar Exame" : "Cadastrar Exame"}
        </h1>
        <form
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        >
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes do Exame</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label>Consulta Associada</Label>
                            <MenuConsultas
                                key={`consulta-selector-${selectorsKey}`}
                                consultas={consultas}
                                selectedConsulta={selectedConsulta}
                                onConsultaSelect={handleConsultaSelect}
                            />
                        </div>

                        <div>
                          <Label>Condição de Saúde</Label>
                          <MenuCondicoes
                             key={`condicao-selector-${selectorsKey}`}
                            condicoes={condicoesSaude}
                            selectedCondicao={selectedCondicao}
                            onCondicaoSelect={setSelectedCondicao}
                          />
                        </div>

                        <div>
                          <Label>Unidade de Saúde</Label>
                          <MenuUnidades
                            key={`unidade-selector-${selectorsKey}`}
                            unidades={unidades}
                            selectedUnidade={selectedUnidade}
                            onUnidadeSelect={setSelectedUnidade}
                          />
                        </div>
                        <div>
                          <Label>Profissional Solicitante</Label>
                          <MenuProfissionais
                            key={`profissional-selector-${selectorsKey}`}
                            profissionais={profissionais}
                            selectedProfissional={selectedProfissional}
                            onProfissionalSelect={setSelectedProfissional}
                            unidadeId={selectedUnidade?.id}
                          />
                        </div>

                        <div>
                          <Label>Profissional Executante</Label>
                          <MenuProfissionais
                            key={`profissional-executante-selector-${selectorsKey}`}
                            profissionais={profissionais}
                            selectedProfissional={selectedProfissionalExecutante}
                            onProfissionalSelect={setSelectedProfissionalExecutante}
                            unidadeId={selectedUnidade?.id}
                          />
                        </div>

                        <div>
                          <Label>Data e Hora do Exame</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={dataExame}
                              onChange={(e) => setDataExame(e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="time"
                              value={horaExame}
                              onChange={(e) => setHoraExame(e.target.value)}
                              className="w-auto"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Tipo de Exame *</Label>
                          <Select value={tipo} onValueChange={setTipo} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de exame" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sangue">Sangue</SelectItem>
                              <SelectItem value="Urina">Urina</SelectItem>
                              <SelectItem value="USG">USG</SelectItem>
                              <SelectItem value="Raio-X">Raio-X</SelectItem>
                              <SelectItem value="Tomografia">Tomografia</SelectItem>
                              <SelectItem value="Ressonancia">Ressonância Magnética</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Anotação / Laudo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea value={anotacao} onChange={(e) => setAnotacao(e.target.value)} />
                    </CardContent>
                </Card>
                 {["Sangue", "Urina"].includes(tipo) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TabelaExames exames={exameResultados} onAddExame={handleAddExame} onRemoveExame={handleRemoveExame} onExameChange={handleExameChange} />
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Anexos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Anexar Arquivo (PDF ou imagem)</Label>
                            <div className="flex items-center space-x-2">
                                <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} multiple />
                                <Button onClick={handleAnalyzeFile} disabled={selectedFiles.length === 0 || loadingAnalysis} type="button" size="sm">
                                    {loadingAnalysis ? "Analisando..." : "Analisar"}
                                </Button>
                            </div>
                        </div>
                        {selectedFiles.length > 0 && (
                            <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Novos arquivos:</p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {selectedFiles.map((file, index) => (
                                        <li key={index} className="text-muted-foreground">{file.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {existingExamData?.anexos && existingExamData.anexos.length > 0 && (
                            <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Arquivos atuais:</p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {existingExamData.anexos.map((anexo) => (
                                        <li key={anexo.id} className="text-muted-foreground">{anexo.nomeArquivo}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Finalização</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch
                            id="laudo-finalizado"
                            checked={laudoFinalizado}
                            onCheckedChange={setLaudoFinalizado}
                            />
                            <Label htmlFor="laudo-finalizado">Marcar Laudo como Finalizado</Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            disabled={loadingSubmit}
                            className="w-full"
                        >
                            {loadingSubmit ? (existingExamData ? "Atualizando..." : "Enviando...") : (existingExamData ? "Atualizar Exame" : "Cadastrar Exame")}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
    </div>
  );
}
