'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/app/_hooks/use-toast";
import { ChevronLeftIcon } from "lucide-react";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/_components/ui/card";
import BotaoEditarConsulta from "../components/buttoneditConsulta";
import AnexoUploader from "../components/AnexoUploader";
import AnexosList from "../components/AnexosList";
import ConsultaOrigemCard from "../components/ConsultaOrigemCard";
import DetalhesConsultaCard from "../components/DetalhesConsultaCard";
import EventosVinculadosCard from "../components/EventosVinculadosCard";
import AnotacoesCard from "../components/AnotacoesCard";
import { ConsultaData } from "../types";

const ConsultaPage = () => {
  const params = useParams();
  const router = useRouter();
  const consultaId = params.id as string;

  const [consulta, setConsulta] = useState<ConsultaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novaAnotacaoContent, setNovaAnotacaoContent] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchConsulta = useCallback(async () => {
    if (!consultaId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/consultas/${consultaId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar consulta.");
      }
      const data: ConsultaData = await response.json();
      setConsulta(data);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast({ title: `Erro ao carregar dados: ${message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [consultaId]);

  useEffect(() => {
    fetchConsulta();
  }, [fetchConsulta]);

  const handleAdicionarAnotacao = async () => {
    if (!novaAnotacaoContent.trim() || !consulta) return;
    try {
      const response = await fetch('/api/consultas/anotacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultaId: consulta.id, anotacao: novaAnotacaoContent }),
      });
      if (!response.ok) {
        throw new Error(await response.json().then(d => d.error) || 'Falha ao adicionar anotação.');
      }
      toast({ title: "Anotação adicionada com sucesso!" });
      setNovaAnotacaoContent("");
      fetchConsulta();
    } catch (err) {
      toast({ title: `Erro: ${(err as Error).message}`, variant: "destructive" });
    }
  };

  const handleDeleteAnexo = async (anexoId: string) => {
    if (!consulta) return;
    if (!window.confirm("Tem certeza que deseja apagar este anexo?")) return;

    try {
      const response = await fetch(`/api/consultas/${consulta.id}/anexos/${anexoId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao apagar o anexo.');
      }
      toast({ title: "Anexo apagado com sucesso!" });
      fetchConsulta();
    } catch (err) {
      // CORREÇÃO: Utiliza a variável 'err' para mostrar um erro mais detalhado.
      toast({ title: `Erro ao apagar anexo: ${(err as Error).message}`, variant: "destructive" });
    }
  };

  const handleDeleteConsulta = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao apagar a consulta.');
      }
      toast({ title: "Consulta apagada com sucesso!" });
      router.push("/consulta");
    } catch (err) {
      toast({ title: `Erro: ${(err as Error).message}`, variant: "destructive" });
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center"><h1 className="text-xl text-red-600">Erro: {error}</h1></div>;
  if (!consulta) return <div className="p-8 text-center"><h1>Consulta não encontrada</h1></div>;

  const isRetorno = !!consulta.consultaOrigem;
  const examesParaMostrar = isRetorno ? consulta.consultaOrigem?.Exame || [] : consulta.Exame;

  return (
    <div>
      <Header />
      <div className="relative w-full px-5 py-6">
        <Button size="icon" variant="secondary" className="absolute left-5 top-6" onClick={() => router.back()}>
          <ChevronLeftIcon />
        </Button>
        <div className="absolute right-5 top-6 flex gap-2">
          <BotaoEditarConsulta consultaId={consulta.id} />
          <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} disabled={deleting}>Apagar</Button>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader><CardTitle>Confirmar Exclusão</CardTitle></CardHeader>
            <CardContent className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteConsulta} disabled={deleting}>
                {deleting ? "Apagando..." : "Confirmar"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="container mx-auto px-5 py-6 space-y-6">
        {isRetorno && consulta.consultaOrigem && <ConsultaOrigemCard consultaOrigem={consulta.consultaOrigem} />}
        
        <DetalhesConsultaCard 
          tipo={consulta.tipo}
          data={consulta.data}
          unidade={consulta.unidade}
          profissional={consulta.profissional}
          motivo={consulta.motivo}
        />

        <AnexosList anexos={consulta.anexos || []} onDeleteAnexo={handleDeleteAnexo} />

        <Card>
          <CardHeader><CardTitle>Adicionar Novo Anexo</CardTitle></CardHeader>
          <CardContent><AnexoUploader consultaId={consulta.id} onUploadSuccess={fetchConsulta} /></CardContent>
        </Card>

        <EventosVinculadosCard 
          isRetorno={isRetorno}
          exames={examesParaMostrar}
          retornos={consulta.consultasDeRetorno || []}
        />

        <AnotacoesCard 
          anotacoes={consulta.Anotacoes}
          novaAnotacaoContent={novaAnotacaoContent}
          setNovaAnotacaoContent={setNovaAnotacaoContent}
          handleAdicionarAnotacao={handleAdicionarAnotacao}
        />
      </main>
    </div>
  );
};

export default ConsultaPage;
