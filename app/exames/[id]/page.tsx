// app/exames/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Exame } from "@/app/_components/types";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import { Pencil, BrainCircuit, RefreshCw } from "lucide-react"; // Importado o ícone de atualização
import ExamFileDialog from "../components/ExamFileDialog";
import { useSession } from "next-auth/react";

interface ExameResultadoFrontend {
  id: string;
  nome: string;
  valor: string;
  unidade: string;
  referencia?: string;
}

interface ExameComResultados extends Exame {
  resultados?: ExameResultadoFrontend[];
  analiseIA?: string | null;
}

export default function ExameDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const [exame, setExame] = useState<ExameComResultados | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false); // Estado para controlar se o polling está ativo
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para iniciar o polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log("Verificando se a análise de IA está pronta...");
        const pollRes = await fetch(`/api/exames/${id}`, { cache: 'no-store' });
        if (!pollRes.ok) throw new Error('Falha na verificação da análise');
        
        const pollData = await pollRes.json();
        const updatedExam = pollData?.exame;

        if (updatedExam && updatedExam.analiseIA) {
          console.log("Análise de IA recebida! Interrompendo a verificação.");
          setExame(updatedExam);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            setIsPolling(false);
          }
        }
      } catch (pollError) {
        console.error("Erro durante a verificação da análise:", pollError);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          setIsPolling(false);
        }
      }
    }, 5000);
  }, [id]);

  // Função para acionar a análise
  const triggerAnalysis = useCallback(async () => {
    if (!id || !session?.user?.id) return;
    try {
      console.log("Acionando análise de IA...");
      await fetch('/api/exames/analise-completa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id, userId: session.user.id }),
      });
      startPolling();
    } catch (err) {
      console.error("Falha ao acionar a análise de IA:", err);
      setError("Não foi possível iniciar a análise de IA.");
    }
  }, [id, session, startPolling]);

  // Efeito principal para buscar o exame e decidir a ação
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchExameDetails = async () => {
      try {
        setLoading(true);
        const resExame = await fetch(`/api/exames/${id}`);
        if (!resExame.ok) throw new Error(`Erro ao buscar detalhes do exame`);
        
        const dataExame = await resExame.json();
        const examData = dataExame?.exame;
        setExame(examData);

        // Se o exame não tiver análise, aciona pela primeira vez.
        if (examData && !examData.analiseIA) {
          triggerAnalysis();
        }
      } catch (err: unknown) {
          if (err instanceof Error) {
              setError(err.message);
          } else {
              setError("Ocorreu um erro inesperado.");
          }
      } finally {
        setLoading(false);
      }
    };

    fetchExameDetails();

    // Limpeza ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [id, triggerAnalysis]);

  // Função para o botão de atualizar
  const handleRefreshAnalysis = () => {
    // Limpa a análise existente para mostrar o spinner
    setExame(prev => prev ? { ...prev, analiseIA: null } : null);
    // Aciona uma nova análise
    triggerAnalysis();
  };

  if (loading && !exame) {
    return <p className="p-4 text-muted-foreground">Carregando exame...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-500">Erro: {error}</p>;
  }

  if (!exame) {
    return <p className="p-4 text-muted-foreground">Exame não encontrado.</p>;
  }

  const formatarDataConsulta = (dataString: string | undefined) => {
    if (!dataString) return "Data não disponível";
    const date = new Date(dataString);
    return `${date.toLocaleDateString("pt-BR")} - ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 md:px-10 lg:px-20">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Exame de {exame.dataExame ? new Date(exame.dataExame).toLocaleDateString("pt-BR") : "Data não disponível"}
              </h1>
              <p className="text-sm text-muted-foreground">{exame.unidades?.nome && `Unidade: ${exame.unidades.nome}`}</p>
              <p className="text-sm text-muted-foreground">{exame.profissional?.nome && `Profissional: ${exame.profissional.nome}`}</p>
              {exame.anotacao && <p className="mt-2 text-sm italic text-muted-foreground">Anotação: {exame.anotacao}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/exames/${id}/editar`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5" /> Análise da IA
              </h2>
              {/* BOTÃO DE ATUALIZAR */}
              <Button variant="ghost" size="icon" onClick={handleRefreshAnalysis} disabled={isPolling} className="h-7 w-7">
                <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="rounded-md bg-muted p-4 text-sm min-h-[80px]">
              {exame.analiseIA ? (
                <p className="whitespace-pre-wrap">{exame.analiseIA}</p>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                  <span>Análise em processamento... A página será atualizada automaticamente.</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Resultados</h2>
            {exame.resultados && exame.resultados.length > 0 ? (
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">Nome</th>
                    <th className="border p-2">Valor</th>
                    <th className="border p-2">Unidade</th>
                    <th className="border p-2">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {exame.resultados.map((item: ExameResultadoFrontend) => {
                      const valor = parseFloat(item.valor);
                      const referencia = item.referencia || "";
                      const [minRef, maxRef] = referencia.split("-").map((v: string) => parseFloat(v.trim()));
                      const foraDoIntervalo = !isNaN(minRef) && !isNaN(maxRef) && (valor < minRef || valor > maxRef);
                      return (
                        <tr key={item.id}>
                          <td className="border p-2">{item.nome}</td>
                          <td className={`border p-2 font-medium ${foraDoIntervalo ? "text-red-500" : ""}`}>{item.valor}</td>
                          <td className="border p-2">{item.unidade}</td>
                          <td className="border p-2">{item.referencia}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm">Sem dados de resultados.</p>
            )}
          </div>

          {exame.nomeArquivo && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Arquivo Anexo</h2>
              <ExamFileDialog examId={id} hasFile={!!exame.nomeArquivo} />
            </div>
          )}

          {exame.consulta && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <h2 className="mb-2 text-lg font-semibold">Consulta Relacionada</h2>
              <p><strong>Tipo:</strong> {exame.consulta.tipo}</p>
              <p><strong>Data:</strong> {formatarDataConsulta(exame.consulta.data)}</p>
              {exame.consulta.queixas && <p><strong>Queixas:</strong> {exame.consulta.queixas}</p>}
              {exame.consulta.profissional?.nome && <p><strong>Profissional da Consulta:</strong> {exame.consulta.profissional.nome}</p>}
              {exame.consulta.unidade?.nome && <p><strong>Unidade da Consulta:</strong> {exame.consulta.unidade.nome}</p>}
            </div>
          )}

          <div> 
            <Button variant="destructive" onClick={() => router.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
