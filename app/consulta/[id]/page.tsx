'use client'; // Marcando como Client Component

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
import { useState, useEffect, useCallback } from "react"; // CORREÇÃO: Adicionado useCallback
import { toast } from "@/app/_hooks/use-toast";
import { useParams, useRouter } from "next/navigation";

import { Exame, Profissional, Unidade } from "@/app/_components/types"; 
import { AnexoConsulta, CondicaoSaude } from "@prisma/client";
import AnexoUploader from "../components/AnexoUploader";
import AnexosList from "../components/AnexosList";

// Tipagens locais para evitar complexidade desnecessária no estado
interface Anotacao {
    id: string;
    anotacao: string;
    createdAt: Date;
}

interface ConsultaData {
    id: string;
    tipo: string;
    data: string;
    motivo: string | null;
    unidade: Unidade | null;
    profissional: Profissional | null;
    Anotacoes: Anotacao[];
    Exame: Exame[];
    tratamento: CondicaoSaude | null;
    anexos: AnexoConsulta[];
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

  // CORREÇÃO: A função foi envolvida em useCallback para estabilizá-la
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

  // CORREÇÃO: `fetchConsulta` foi adicionada como dependência
  useEffect(() => {
    if (consultaId) {
      fetchConsulta();
    }
  }, [consultaId, fetchConsulta]);

  const handleDeleteAnexo = async (anexoId: string) => {
    if (window.confirm("Tem certeza que deseja apagar este anexo?")) {
        try {
            const response = await fetch(`/api/consultas/${consultaId}/anexos/${anexoId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(await response.text() || 'Falha ao apagar o anexo.');
            toast({ title: "Anexo apagado com sucesso!" });
            fetchConsulta(); // Re-busca os dados para atualizar a lista
        } catch (err) { // CORREÇÃO: removido ':any'
            const message = (err as Error).message;
            toast({ title: "Erro ao apagar anexo", description: message, variant: "destructive" });
        }
    }
  };

  const handleDeleteConsulta = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, { method: "DELETE" });
      // CORREÇÃO: Gestão de erro melhorada, usando .text() para segurança
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Falha ao apagar a consulta.");
      }
      toast({ title: "Consulta apagada com sucesso!" });
      router.push("/consulta");
    } catch (err) { // CORREÇÃO: removido ':any'
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
            <CardContent><ul>{consulta.Exame.map((exame) => (<li key={exame.id}><Link href={`/exames/${exame.id}`} className="text-blue-500 hover:underline">{exame.tipo} - {new Date(exame.dataExame).toLocaleDateString()}</Link></li>))}</ul></CardContent>
          </Card>
        )}

        {/* Seção de Anotações (Simplificado para visualização) */}
        {consulta.Anotacoes && consulta.Anotacoes.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Anotações</CardTitle></CardHeader>
            <CardContent><ul className="list-disc pl-5 space-y-2">{consulta.Anotacoes.map((anotacao) => (<li key={anotacao.id}>{anotacao.anotacao}</li>))}</ul></CardContent>
          </Card>
        )}

        {/* Adicionar Nova Anotação (Corrigido) */}
        <Card>
          <CardHeader><CardTitle>Adicionar Nova Anotação</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              placeholder="Digite sua anotação aqui..."
              value={novaAnotacaoContent}
              onChange={(e) => setNovaAnotacaoContent(e.target.value)}
            />
            <Button onClick={() => alert("Lógica para adicionar anotação a ser reimplementada.")}>
              Adicionar Anotação
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default ConsultaPage;
