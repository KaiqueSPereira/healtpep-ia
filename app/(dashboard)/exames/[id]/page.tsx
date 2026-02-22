'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Exame, ResultadoExame, Profissional, UnidadeDeSaude, Consultas, Endereco, AnexoExame } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Pencil, BrainCircuit, RefreshCw, Paperclip, Info, Calendar, Stethoscope, FlaskConical, Link as LinkIcon, Building, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/app/_stores/authStore";
import AnexosDialog from "../components/AnexosDialog";

type UnidadeComEndereco = UnidadeDeSaude & {
  endereco: Endereco | null;
};

type ExameComDetalhes = Exame & {
  resultados: ResultadoExame[];
  unidades: UnidadeComEndereco | null;
  profissional: Profissional | null;
  profissionalExecutante: Profissional | null;
  laudoFinalizado?: boolean;
  consulta: (Consultas & {
    profissional: Profissional | null;
    unidade: UnidadeDeSaude | null;
  }) | null;
  anexos?: AnexoExame[];
  _count?: { anexos: number };
};

// Lógica de status corrigida e mais robusta
const getStatus = (resultados: ResultadoExame[], laudoFinalizado: boolean | null | undefined, anotacao: string | null | undefined) => {
  if (resultados && resultados.length > 0) {
    const hasAbnormal = resultados.some(item => {
      if (item.valor && typeof item.valor === 'string' && item.referencia && typeof item.referencia === 'string') {
        try {
          const valorNum = parseFloat(item.valor.replace(',', '.'));
          const partesRef = item.referencia.split('-').map(v => parseFloat(v.trim().replace(',', '.')));
          if (partesRef.length === 2 && !isNaN(valorNum) && !isNaN(partesRef[0]) && !isNaN(partesRef[1])) {
            return valorNum < partesRef[0] || valorNum > partesRef[1];
          }
        } catch (e) { 
          console.error("Erro ao analisar valor do exame para status:", e);
          return false; 
        }
      }
      return false;
    });
    if (hasAbnormal) return { text: 'Alterado', color: 'bg-red-100', textColor: 'text-red-800' };
    return { text: 'Normal', color: 'bg-green-100', textColor: 'text-green-800' };
  }

  if (laudoFinalizado && anotacao && anotacao.trim() !== '') {
    return { text: 'Laudo Disponível', color: 'bg-blue-100', textColor: 'text-blue-800' };
  }

  return { text: 'Sem Resultados', color: 'bg-gray-100', textColor: 'text-gray-800' };
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
            setExame(updatedExam);
            stopPolling();
          }
        } catch (pollError) {
          console.error("Erro durante a verificação:", pollError);
          stopPolling();
        }
      }, 5000);
    } catch (err) {
      setError("Não foi possível iniciar a análise de IA.");
      setIsPolling(false);
    }
  }, [id, session, isPolling, stopPolling]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("ID do exame não fornecido.");
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
        if (examData && !examData.analiseIA && (examData.resultados?.length > 0 || examData.laudoFinalizado)) {
          triggerAnalysis();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    };
    fetchExameDetails();
    return () => stopPolling();
  }, [id, triggerAnalysis, stopPolling]);

  const handleRefreshAnalysis = () => {
    if (confirm("Tem certeza que deseja solicitar uma nova análise? A análise atual será substituída.")) {
      setExame(prev => prev ? { ...prev, analiseIA: null } : null);
      triggerAnalysis();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    const isUnauthorized = error.toLowerCase().includes('não autorizado') || error.toLowerCase().includes('acesso negado');
    return (
      <div className="flex flex-col items-center justify-center text-center h-[80vh] p-12">
        <Image
          src={isUnauthorized ? "/unauthorized-no-bg.png" : "/Exam-notfound.png"}
          alt={isUnauthorized ? "Acesso não autorizado" : "Erro ao carregar exame"}
          width={250}
          height={250}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold">{isUnauthorized ? "Acesso Negado" : "Ocorreu um Erro"}</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">Voltar</Button>
      </div>
    );
  }

  if (!exame) {
    return (
       <div className="flex flex-col items-center justify-center text-center h-[80vh] p-12">
        <Image
          src="/Exam-notfound.png"
          alt="Nenhum exame encontrado"
          width={250}
          height={250}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold">Exame Não Encontrado</h2>
        <p className="text-muted-foreground mt-2">
          Não foi possível encontrar um exame com o ID fornecido.
        </p>
         <Button variant="outline" onClick={() => router.back()} className="mt-6">Voltar</Button>
      </div>
    );
  }

  const formatarData = (data?: Date | string | null) => data ? new Date(data).toLocaleDateString("pt-BR") : "N/A";
  const formatarDataComHora = (data?: Date | string | null) => data ? `${new Date(data).toLocaleDateString("pt-BR")} - ${new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "N/A";
  
  const hasAnexos = exame._count ? exame._count.anexos > 0 : false;
  const status = getStatus(exame.resultados, exame.laudoFinalizado, exame.anotacao);
  const isReportBased = !exame.resultados || exame.resultados.length === 0 && exame.laudoFinalizado && exame.anotacao;

  return (
    <div className="h-full w-full overflow-y-auto bg-muted/20">
      <main className="px-4 py-6 md:px-10 lg:px-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Exame de {exame.nome}</h1>
          <Button variant="outline" size="sm" asChild><Link href={`/exames/${id}/editar`}><Pencil className="mr-1 h-4 w-4" /> Editar</Link></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Destaques do Exame</CardTitle></CardHeader>
              <CardContent><span className={`px-3 py-1 text-sm font-semibold rounded-full ${status.color} ${status.textColor}`}>{status.text}</span></CardContent>
            </Card>

            {isReportBased && exame.anotacao && (
              <Card>
                 <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Laudo do Exame</CardTitle></CardHeader>
                 <CardContent className="text-sm"><p className="whitespace-pre-wrap text-foreground/90">{exame.anotacao}</p></CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center"><BrainCircuit className="mr-2 h-5 w-5 text-primary" /> Análise da IA</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleRefreshAnalysis} disabled={isPolling} className="h-7 w-7"><RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} /></Button>
              </CardHeader>
              <CardContent className="text-sm min-h-[80px]">
                {exame.analiseIA ? <p className="whitespace-pre-wrap text-foreground/90">{exame.analiseIA}</p> : <div className="flex items-center text-muted-foreground"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div><span>Análise em processamento...</span></div>}
              </CardContent>
            </Card>

            {exame.resultados && exame.resultados.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center"><FlaskConical className="mr-2 h-5 w-5 text-primary" /> Resultados Laboratoriais</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="border p-2 text-left font-semibold">Nome</th>
                        <th className="border p-2 text-left font-semibold">Valor</th>
                        <th className="border p-2 text-left font-semibold">Unidade</th>
                        <th className="border p-2 text-left font-semibold">Referência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exame.resultados.map((item) => {
                        let foraDoIntervalo = false;
                        if (item.valor && typeof item.valor === 'string' && item.referencia && typeof item.referencia === 'string') {
                           try {
                            const valorNum = parseFloat(item.valor.replace(',', '.'));
                            const partesRef = item.referencia.split('-').map(v => parseFloat(v.trim().replace(',', '.')));
                            if (partesRef.length === 2 && !isNaN(valorNum) && !isNaN(partesRef[0]) && !isNaN(partesRef[1])) {
                                foraDoIntervalo = valorNum < partesRef[0] || valorNum > partesRef[1];
                            }
                           } catch(e) { 
                                console.error("Erro ao analisar valor do exame na tabela:", e);
                                foraDoIntervalo = false; 
                           }
                        }
                        return (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="border p-2">{item.nome || 'N/A'}</td>
                            <td className={`border p-2 font-medium`}>
                              <div className="flex items-center">
                                {foraDoIntervalo && <span className="h-2 w-2 rounded-full bg-destructive mr-2 shrink-0 animate-pulse"></span>}
                                <span>{item.valor || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="border p-2 text-muted-foreground">{item.unidade || 'N/A'}</td>
                            <td className="border p-2 text-muted-foreground">{item.referencia || 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                 <div className="flex"><Calendar className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="font-semibold mr-1.5">Data:</span> {formatarData(exame.dataExame)}</div>
                 <div className="flex"><Stethoscope className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="font-semibold mr-1.5">Profissional:</span> {exame.profissional?.nome || 'N/A'}</div>
                 {exame.profissionalExecutante && <div className="flex"><Stethoscope className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="font-semibold mr-1.5">Executante:</span> {exame.profissionalExecutante.nome}</div>}
                 {exame.unidades && <div className="flex"><Building className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="font-semibold mr-1.5">Unidade:</span> {exame.unidades.nome}</div>}
              </CardContent>
            </Card>

            {exame.consulta && (
              <Card>
                <CardHeader><CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary" /> Consulta Relacionada</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Tipo:</strong> {exame.consulta.tipo || 'N/A'}</p>
                  <p><strong>Data:</strong> {formatarDataComHora(exame.consulta.data)}</p>
                  {exame.consulta.motivo && <p><strong>Queixas:</strong> {exame.consulta.motivo}</p>}
                   <Button variant="secondary" size="sm" className="mt-3" asChild><Link href={`/consulta/${exame.consulta.id}`}>Ver Consulta</Link></Button>
                </CardContent>
              </Card>
            )}
            
            {hasAnexos && (
              <Card>
                <CardHeader><CardTitle className="flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary"/> Anexos</CardTitle></CardHeader>
                <CardContent>
                  <Button onClick={() => setIsAnexosDialogOpen(true)} variant="outline" className="w-full">
                    Ver Anexos ({exame._count?.anexos})
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="pt-8">
          <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </div>
      </main>

      <AnexosDialog open={isAnexosDialogOpen} onOpenChange={setIsAnexosDialogOpen} examId={id} />
    </div>
  );
}
