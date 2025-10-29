'use client'; 

import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import Header from "@/app/_components/header";
import BotaoEditarConsulta from "../components/buttoneditConsulta";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
import { useParams, useRouter } from "next/navigation";

import { Exame, Profissional, Unidade } from "@/app/_components/types"; 
import { AnexoConsulta, CondicaoSaude} from "@prisma/client";
import AnexoUploader from "../components/AnexoUploader";
import AnexosList from "../components/AnexosList";
import ExameItem from "@/app/exames/components/ExameItem";

interface Anotacao {
    id: string;
    anotacao: string;
    createdAt: Date;
}

type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: Unidade | null;
};

// Interface para os dados simplificados das consultas relacionadas
interface ConsultaRelacionada {
    id: string;
    data: string;
    tipo: string;
}

interface ConsultaData {
    id: string;
    tipo: string;
    data: string;
    motivo: string | null;
    unidade: Unidade | null;
    profissional: Profissional | null;
    Anotacoes: Anotacao[];
    Exame: ExameComRelacoes[]; 
    tratamento: CondicaoSaude | null;
    anexos: AnexoConsulta[];
    // Campos para as consultas relacionadas
    consultaOrigem?: ConsultaRelacionada | null;
    consultasDeRetorno?: ConsultaRelacionada[];
}

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
        toast({ title: `Erro ao carregar os dados: ${message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
  }, [consultaId]);

  useEffect(() => {
    if (consultaId) {
      fetchConsulta();
    }
  }, [consultaId, fetchConsulta]);

  // Lógica para adicionar anotação reimplementada
  const handleAdicionarAnotacao = async () => {
    if (!novaAnotacaoContent.trim() || !consulta) {
      toast({ title: "A anotação não pode estar vazia.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/consultas/anotacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultaId: consulta.id,
          anotacao: novaAnotacaoContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar anotação.');
      }

      toast({ title: "Anotação adicionada com sucesso!" });
      setNovaAnotacaoContent(""); // Limpa a textarea
      fetchConsulta(); // Recarrega os dados da consulta para mostrar a nova anotação
    } catch (err) {
      const message = (err as Error).message;
      toast({ title: `Erro ao adicionar anotação: ${message}`, variant: "destructive" });
    }
  };

  const handleDeleteAnexo = async (anexoId: string) => {
    if (window.confirm("Tem certeza que deseja apagar este anexo?")) {
        try {
            const response = await fetch(`/api/consultas/${consultaId}/anexos/${anexoId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(await response.text() || 'Falha ao apagar o anexo.');
            toast({ title: "Anexo apagado com sucesso!" });
            fetchConsulta();
        } catch (err) {
            const message = (err as Error).message;
            toast({ title: "Erro ao apagar anexo", description: message, variant: "destructive" });
        }
    }
  };

  const handleDeleteConsulta = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Falha ao apagar a consulta.");
      }
      toast({ title: "Consulta apagada com sucesso!" });
      router.push("/consulta");
    } catch (err) {
      const message = (err as Error).message;
      toast({ title: `Erro ao apagar consulta: ${message}`, variant: "destructive" });
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };
  
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center"><h1 className="text-xl text-red-600">Erro: {error}</h1></div>;
  if (!consulta) return <div className="p-8 text-center"><h1>Consulta não encontrada</h1></div>;

  return (
    <div>
      <Header />
      <div className="relative w-full px-5 py-6">
        <Button size="icon" variant="secondary" className="absolute left-5 top-6" asChild>
          <Link href="/consulta"><ChevronLeftIcon /></Link>
        </Button>
        <div className="absolute right-5 top-6 flex gap-2">
          <BotaoEditarConsulta consultaId={consulta.id} />
          <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} disabled={deleting}>Apagar</Button>
        </div>
      </div>

      {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-96"><CardHeader><CardTitle>Confirmar Exclusão</CardTitle></CardHeader><CardContent className="flex justify-end gap-4"><Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDeleteConsulta} disabled={deleting}>{deleting ? "Apagando..." : "Confirmar"}</Button></CardContent></Card>
          </div>
      )}

      <main className="container mx-auto px-5 py-6 space-y-6">

        {/* Seção de Consultas Vinculadas */}
        {(consulta.consultaOrigem || (consulta.consultasDeRetorno && consulta.consultasDeRetorno.length > 0)) && (
            <Card>
                <CardHeader><CardTitle>Consultas Vinculadas</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-sm">
                    {consulta.consultaOrigem && (
                        <Link href={`/consulta/${consulta.consultaOrigem.id}`} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                            <span>Consulta de Origem ({consulta.consultaOrigem.tipo})</span>
                            <span>{new Date(consulta.consultaOrigem.data).toLocaleDateString('pt-BR')}</span>
                        </Link>
                    )}
                    {consulta.consultasDeRetorno && consulta.consultasDeRetorno.map(retorno => (
                        <Link key={retorno.id} href={`/consulta/${retorno.id}`} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                            <span>Retorno ({retorno.tipo})</span>
                            <span>{new Date(retorno.data).toLocaleDateString('pt-BR')}</span>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        )}

        {/* Detalhes da Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{consulta.tipo}</CardTitle>
            <CardDescription>{new Date(consulta.data).toLocaleString("pt-BR", { dateStyle: 'full', timeStyle: 'short' })}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
             <p><b>Unidade:</b> {consulta.unidade?.nome || "Não informado"}</p>
             <p><b>Profissional:</b> {consulta.profissional?.nome || "Não informado"}</p>
             {consulta.motivo && <p><b>Motivo:</b> {consulta.motivo}</p>}
          </CardContent>
        </Card>
        
        {/* Seção de Anexos */}
        <AnexosList anexos={consulta.anexos || []} onDeleteAnexo={handleDeleteAnexo} />
        <Card>
            <CardHeader>
                <CardTitle>Adicionar Novo Anexo</CardTitle>
                <CardDescription>Envie documentos, atestados ou receitas.</CardDescription>
            </CardHeader>
            <CardContent>
                 <AnexoUploader consultaId={consulta.id} onUploadSuccess={fetchConsulta} />
            </CardContent>
        </Card>

        {/* Seção de Exames Relacionados */}
        {consulta.Exame && consulta.Exame.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Exames Relacionados</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consulta.Exame.map((exame) => (
                <ExameItem key={exame.id} exame={exame} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Seção de Anotações */}
        {consulta.Anotacoes && consulta.Anotacoes.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Anotações</CardTitle></CardHeader>
            <CardContent><ul className="list-disc pl-5 space-y-2">{consulta.Anotacoes.map((anotacao) => (<li key={anotacao.id}>{anotacao.anotacao}</li>))}</ul></CardContent>
          </Card>
        )}

        {/* Adicionar Nova Anotação */}
        <Card>
          <CardHeader><CardTitle>Adicionar Nova Anotação</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              placeholder="Digite sua anotação aqui..."
              value={novaAnotacaoContent}
              onChange={(e) => setNovaAnotacaoContent(e.target.value)}
            />
            <Button onClick={handleAdicionarAnotacao}>
              Adicionar Anotação
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default ConsultaPage;
