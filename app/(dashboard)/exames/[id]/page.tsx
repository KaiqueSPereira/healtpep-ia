'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Exame, ResultadoExame, Profissional, UnidadeDeSaude, Consultas, Endereco, AnexoExame } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { Pencil, BrainCircuit, RefreshCw, Paperclip } from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/app/_stores/authStore";
import AnexosDialog from "../components/AnexosDialog";

type UnidadeComEndereco = UnidadeDeSaude & {
  endereco: Endereco | null;
};

type ExameComDetalhes = Exame & {
  resultados: ResultadoExame[];
  unidades: UnidadeComEndereco | null;
  profissional: Profissional | null;
  consulta: (Consultas & {
    profissional: Profissional | null;
    unidade: UnidadeDeSaude | null;
  }) | null;
  anexos?: AnexoExame[];
  _count?: { anexos: number };
};

export default function ExameDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { session } = useAuthStore();
  const [exame, setExame] = useState<ExameComDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnexosDialogOpen, setIsAnexosDialogOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const triggerAnalysis = useCallback(async () => {
    if (!id || !session?.user?.id || isPolling) return;

    console.log("Disparando análise de IA...");
    setIsPolling(true);

    try {
      await fetch('/api/exames/analise-completa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id, userId: session.user.id }),
      });

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/exames/${id}`, { cache: 'no-store' });
          if (!pollRes.ok) throw new Error('Falha na verificação da análise');

          const pollData = await pollRes.json();
          const updatedExam: ExameComDetalhes = pollData?.exame;

          if (updatedExam && updatedExam.analiseIA) {
            console.log("Análise de IA recebida!");
            setExame(updatedExam);
            stopPolling();
          }
        } catch (pollError) {
          console.error("Erro durante a verificação da análise:", pollError);
          stopPolling();
        }
      }, 5000);

    } catch (err) {
      console.error("Falha ao disparar a análise de IA:", err);
      setError("Não foi possível iniciar a análise de IA.");
      setIsPolling(false);
    }
  }, [id, session, isPolling, stopPolling]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchExameDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const resExame = await fetch(`/api/exames/${id}`);
        if (!resExame.ok) {
          const errorData = await resExame.json();
          throw new Error(errorData.error || 'Erro ao buscar detalhes do exame');
        }

        const dataExame = await resExame.json();
        const examData: ExameComDetalhes = dataExame?.exame;

        setExame(examData);

        if (examData && !examData.analiseIA) {
          triggerAnalysis();
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    };

    fetchExameDetails();

    return () => {
      stopPolling();
    };
  }, [id, triggerAnalysis, stopPolling]);

  const handleRefreshAnalysis = () => {
    if (confirm("Tem certeza que deseja solicitar uma nova análise? A análise atual será substituída.")) {
      setExame(prev => prev ? { ...prev, analiseIA: null } : null);
      triggerAnalysis();
    }
  };
  
  if (loading && !exame) {
    return <div className="p-4 text-center">Carregando exame...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro: {error}</div>;
  }

  if (!exame) {
    return <div className="p-4 text-center">Exame não encontrado.</div>;
  }

  const formatarData = (dataString?: Date | string | null) => {
    if (!dataString) return "Data não disponível";
    return new Date(dataString).toLocaleDateString("pt-BR");
  };

  const formatarDataComHora = (dataString?: Date | string | null) => {
    if (!dataString) return "Data não disponível";
    const date = new Date(dataString);
    const dataFormatada = date.toLocaleDateString("pt-BR");
    const horaFormatada = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${dataFormatada} - ${horaFormatada}`;
  };

  const hasAnexos = exame._count ? exame._count.anexos > 0 : false;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-6 md:px-10 lg:px-20">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Exame de {formatarData(exame.dataExame)}</h1>
              <p className="text-sm text-muted-foreground">{exame.unidades?.nome && `Unidade: ${exame.unidades.nome}`}</p>
              <p className="text-sm text-muted-foreground">{exame.profissional?.nome && `Profissional: ${exame.profissional.nome}`}</p>
              {exame.anotacao && <p className="mt-2 text-sm italic text-gray-600"><b>Anotação:</b> {exame.anotacao}</p>}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/exames/${id}/editar`}>
                <Pencil className="mr-1 h-4 w-4" /> Editar
              </Link>
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center"><BrainCircuit className="mr-2 h-5 w-5" /> Análise da IA</h2>
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
                  <span>Análise em processamento...</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Resultados</h2>
            {exame.resultados && exame.resultados.length > 0 ? (
              <table className="w-full border-collapse border text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2 text-left">Valor</th>
                    <th className="border p-2 text-left">Unidade</th>
                    <th className="border p-2 text-left">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {exame.resultados.map((item) => {
                    let foraDoIntervalo = false;
                    if (item.valor && typeof item.valor === 'string' && item.referencia && typeof item.referencia === 'string') {
                      const valorNum = parseFloat(item.valor.replace(',', '.'));
                      const partesRef = item.referencia.split('-').map(v => parseFloat(v.trim().replace(',', '.')));
                      if (partesRef.length === 2 && !isNaN(valorNum) && !isNaN(partesRef[0]) && !isNaN(partesRef[1])) {
                        foraDoIntervalo = valorNum < partesRef[0] || valorNum > partesRef[1];
                      }
                    }
                    return (
                      <tr key={item.id}>
                        <td className="border p-2">{item.nome || 'N/A'}</td>
                        <td className={`border p-2 font-medium ${foraDoIntervalo ? "text-red-500 font-bold" : ""}`}>{item.valor || 'N/A'}</td>
                        <td className="border p-2">{item.unidade || 'N/A'}</td>
                        <td className="border p-2">{item.referencia || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">Sem resultados para exibir.</p>
            )}
          </div>

          {hasAnexos && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Anexos</h2>
              <Button onClick={() => setIsAnexosDialogOpen(true)} variant="outline">
                <Paperclip className="mr-2 h-4 w-4" /> Ver Anexos ({exame._count?.anexos})
              </Button>
            </div>
          )}

          {exame.consulta && (
            <div className="rounded-md bg-muted p-4 text-sm mt-4">
              <h2 className="mb-2 text-lg font-semibold">Consulta Relacionada</h2>
              <p><strong>Tipo:</strong> {exame.consulta.tipo || 'N/A'}</p>
              <p><strong>Data:</strong> {formatarDataComHora(exame.consulta.data)}</p>
              {exame.consulta.motivo && <p><strong>Queixas:</strong> {exame.consulta.motivo}</p>}
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </main>

      <AnexosDialog open={isAnexosDialogOpen} onOpenChange={setIsAnexosDialogOpen} examId={id} />
    </div>
  );
}
