'use client'; // Marcando como Client Component

import { Button } from "@/app/_components/ui/button";
// Removida a importação de Input
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
import BotaoEditarConsulta from "../components/buttoneditConsulta"; // Assumindo que este botão já existe
import { useState, useRef, useEffect } from "react";
import { toast } from "@/app/_hooks/use-toast";
import { useParams, useRouter } from "next/navigation";

import { Exame, Profissional, Unidade } from "@/app/_components/types"; // Importar tipos necessários
import { Tratamento } from "@prisma/client";

// Interface para a estrutura da Anotacao (se não puder importar de outro lugar)
interface Anotacao {
    id: string;
    anotacao: string;
    consultaId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interface para a estrutura da Consulta (ajuste conforme a API retorna)
interface ConsultaData {
    id: string;
    tipo: string;
    data: string;
    motivo: string | null;
    unidade: Unidade | null;
    profissional: Profissional | null;
    Anotacoes: Anotacao[]; // Array de Anotacoes
    Exame: Exame[];
    tratamento: Tratamento | null;
}

// Este componente é um Client Component
const ConsultaPage = () => {
  const params = useParams();
  const router = useRouter();

  const consultaId = params.id as string;

  const [consulta, setConsulta] = useState<ConsultaData | null>(null); // Tipagem ajustada
  const [loading, setLoading] = useState(true); // Estado para carregar dados da consulta
  const [deleting, setDeleting] = useState(false); // Estado para indicar que a exclusão está em andamento
  const [error, setError] = useState<string | null>(null);

  const [novaAnotacaoContent, setNovaAnotacaoContent] = useState("");
  const novaAnotacaoRef = useRef<HTMLTextAreaElement>(null);

  // State for editing existing annotations
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<string | null>(null);
  const [currentAnotacaoContent, setCurrentAnotacaoContent] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Estado para o modal de confirmação

  // Efeito para buscar os dados da consulta
  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const response = await fetch(`/api/consultas/${consultaId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao buscar consulta.");
        }

        const data: ConsultaData = await response.json(); // Tipagem ajustada
        setConsulta(data);
      } catch (err) { // Removido ': any'
        setError((err as Error).message); // Acessar message de Error
        console.error("Erro ao buscar consulta:", err);
        toast({
          title: `Erro ao carregar consulta: ${(err as Error).message}`, // Acessar message de Error
          variant: "destructive",
        });
      } finally {
        setLoading(false); // Finaliza o carregamento inicial
      }
    };

    if (consultaId) {
      fetchConsulta();
    }
  }, [consultaId, router]);

  const handleAddAnotacao = async () => {
    if (!novaAnotacaoContent.trim()) {
      toast({
        title: "A anotação não pode estar vazia.",
        variant: "destructive",
      });
      if (novaAnotacaoRef.current) {
         novaAnotacaoRef.current.focus();
      }
      return;
    }

    try {
      const response = await fetch(`/api/consultas/anotacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultaId: consultaId, anotacao: novaAnotacaoContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao adicionar anotação.");
      }

      setNovaAnotacaoContent("");
      toast({
        title: "Anotação adicionada com sucesso!",
        variant: "default", // Changed from "success" to "default"
      });

      router.refresh(); // Revalida o cache e busca os dados atualizados (incluindo a nova anotação)
      if (novaAnotacaoRef.current) {
         novaAnotacaoRef.current.focus();
      }

    } catch (err) { // Removido ': any'
      console.error("Erro ao salvar a anotação:", err);
      toast({
        title: `Erro ao salvar a anotação: ${(err as Error).message}`, // Acessar message de Error
        variant: "destructive",
      });
    }
  };

  const handleEditAnotacao = (anotacao: Anotacao) => { // Tipagem ajustada
    setEditingAnotacaoId(anotacao.id);
    setCurrentAnotacaoContent(anotacao.anotacao);
  };

  const handleCancelEdit = () => {
    setEditingAnotacaoId(null);
    setCurrentAnotacaoContent('');
  };

  const handleSaveAnotacao = async (anotacaoId: string) => {
    if (!currentAnotacaoContent.trim()) {
      toast({
        title: "A anotação não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/consultas/${consultaId}/anotacoes/${anotacaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anotacao: currentAnotacaoContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar anotação.");
      }

      setEditingAnotacaoId(null);
      setCurrentAnotacaoContent('');
      toast({ title: "Anotação salva com sucesso!", variant: "default" }); // Changed from "success" to "default"
      router.refresh(); // Revalida o cache para mostrar a anotação atualizada

    } catch (err) { // Removido ': any'
      console.error("Erro ao salvar a anotação:", err);
      toast({ title: `Erro ao salvar a anotação: ${(err as Error).message}`, variant: "destructive" }); // Acessar message de Error
    }
  };

  const handleDeleteAnotacao = async (anotacaoId: string) => {
    try {
       const response = await fetch(`/api/consultas/${consultaId}/anotacoes/${anotacaoId}`, {
         method: "DELETE",
          headers: { "Content-Type": "application/json" },
       });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar anotação.");
      }

      toast({ title: "Anotação deletada com sucesso!", variant: "default" }); // Changed from "success" to "default"
      router.refresh();

    } catch (err) {
      console.error("Erro ao deletar a anotação:", err);
      toast({ title: `Erro ao deletar a anotação: ${(err as Error).message}`, variant: "destructive" }); // Acessar message de Error
    }
  };

  // Handler para o clique no botão "Apagar Consulta" (abre o modal de confirmação)
  const handleConfirmDeleteClick = () => {
      setShowConfirmDelete(true);
  };

  // Handler para a exclusão REAL da consulta (chamado após a confirmação)
  const handleDeleteConsulta = async () => {
    setDeleting(true); // Indicar que a exclusão está em andamento
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar consulta.");
      }

      toast({ title: "Consulta deletada com sucesso!", variant: "default" });
      router.push("/consulta"); // Redirecionar para a página de listagem após a exclusão

    } catch (err) {
      console.error("Erro ao deletar a consulta:", err);
      toast({ title: `Erro ao deletar a consulta: ${(err as Error).message}`, variant: "destructive" }); // Acessar message de Error
      setDeleting(false); // Parar de indicar exclusão em caso de erro
      setShowConfirmDelete(false); // Ocultar a confirmação em caso de erro
    }
  };

  // Exibindo estados de carregamento inicial e erro ao buscar a consulta
  if (loading) {
    return <div className="p-8 text-center">Carregando consulta...</div>;
  }

  if (error) {
     return (
       <div className="p-8 text-center">
         <h1 className="text-xl text-red-600">Erro ao carregar consulta: {error}</h1>
          <Link href="/consulta">
            <Button variant="secondary" className="mt-4">Voltar para Consultas</Button>
          </Link>
       </div>
     );
   }

   // Mensagem se a consulta não for encontrada após o carregamento
   if (!consulta && !error) {
     return (
       <div className="p-8 text-center">
         <h1>Consulta não encontrada</h1>
         <Link href="/consulta">
           <Button variant="secondary" className="mt-4">Voltar para Consultas</Button>
         </Link>
       </div>
     );
   }

  return (
    <div>
      <Header />

      <div className="relative w-full px-5 py-6">
        <Button
          size="icon"
          variant="secondary"
          className="absolute left-5 top-6"
          asChild
        >
          <Link href="/consulta">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <div className="absolute right-5 top-6 flex gap-2">
          {consulta?.id && <BotaoEditarConsulta consultaId={consulta.id} />}

          <Button variant="destructive" onClick={handleConfirmDeleteClick} disabled={deleting}>
                Apagar
            </Button>
        </div>
      </div>

      {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-96">
                  <CardHeader>
                      <CardTitle>Confirmar Exclusão</CardTitle>
                      {/* Ajuste na cor da descrição para melhor visibilidade no tema escuro */}
                      <CardDescription className="text-gray-600 dark:text-gray-300">Tem certeza que deseja apagar esta consulta? Esta ação não pode ser desfeita.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => setShowConfirmDelete(false)} disabled={deleting}> {/* Desabilitar enquanto deletando */}
                          Cancelar
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteConsulta} disabled={deleting}> {/* Desabilitar enquanto deletando */}
                          {deleting ? "Apagando..." : "Confirmar Exclusão"} {/* Mudar texto do botão durante exclusão */}
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Conteúdo principal da consulta */}
      <main className="container mx-auto px-5 py-6">

        {consulta && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{consulta.tipo}</CardTitle>
            {/* Ajuste na cor da descrição da data/hora */}
            <CardDescription className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span>{new Date(consulta.data).toLocaleDateString("pt-BR")}</span>
              <span>ás</span>
              <span>{new Date(consulta.data).toLocaleTimeString("pt-BR")}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Unidade:</span>
              {/* Ajuste na cor do nome da unidade */}
              <span className="text-gray-700 dark:text-gray-300">{consulta.unidade?.nome || "Não informado"}</span>
              {consulta.unidade?.tipo && (
                /* Ajuste na cor do tipo da unidade */
                <span className="text-sm text-gray-500 dark:text-gray-400">({consulta.unidade.tipo})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Profissional:</span>
              {/* Ajuste na cor do nome do profissional */}
              <span className="text-gray-700 dark:text-gray-300">{consulta.profissional?.nome || "Não informado"}</span>
              {consulta.profissional?.especialidade && (
                /* Ajuste na cor da especialidade do profissional */
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({consulta.profissional.especialidade})
                </span>
              )}
              {consulta.profissional?.NumClasse && (
                /* Ajuste na cor do número de classe */
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Nº Classe: {consulta.profissional.NumClasse}
                </span>
              )}
            </div>
            {consulta.motivo && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{consulta.tipo === "Exame" ? "Tipo de Exame:" : "Motivo:"}</span>
                {/* Ajuste na cor do motivo */}
                <span className="text-gray-700 dark:text-gray-300">{consulta.motivo}</span>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção de Exames Relacionados */}
        {consulta?.Exame && consulta.Exame.length > 0 && ( // Verifique se consulta.Exame existe
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Exames Relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {consulta.Exame.map((exame: Exame) => ( // Tipagem ajustada
                  <li key={exame.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <Link href={`/exames/${exame.id}`} className="block hover:underline">
                      <div className="flex justify-between items-center">
                        {/* Acesse as propriedades que você espera que estejam no objeto exame */}
                        <span className="font-semibold">{exame.tipo}</span> {/* Assumindo que 'tipo' existe no Exame */}
                         {/* Se a data do exame for dataExame, use-a */}
                        {/* Ajuste na cor da data do exame */}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(exame.dataExame).toLocaleDateString("pt-BR")} {/* Usando dataExame */}
                        </span>
                      </div>
                      {/* Se a propriedade 'resultado' estiver em Exame, mostre-a */}
                       {exame.anotacao && ( // Assumindo que 'resultado' existe no Exame ou na relação Resultados (que não está incluída aqui)
                           /* Ajuste na cor do resultado do exame */
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">Resultado: {exame.anotacao}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Seção de Anotações Existentes */}
        {consulta?.Anotacoes && consulta.Anotacoes.length > 0 && ( // Verifique se consulta.Anotacoes existe
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Anotações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-4">
                {consulta.Anotacoes.map((anotacao: Anotacao) => ( // Tipagem ajustada
                  <li key={anotacao.id} className="flex flex-col">
                    {editingAnotacaoId === anotacao.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Textarea
                          value={currentAnotacaoContent}
                          onChange={(e) => setCurrentAnotacaoContent(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveAnotacao(anotacao.id)} size="sm">
                            Salvar
                          </Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        {/* Ajuste na cor do texto da anotação */}
                        <p className="text-gray-700 dark:text-gray-300">{anotacao.anotacao}</p>
                        {/* Ajuste na cor da data de criação/atualização da anotação */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Criado em:{" "}
                            {new Date(anotacao.createdAt).toLocaleDateString("pt-BR")}{" "}
                            ás{" "}
                            {new Date(anotacao.createdAt).toLocaleTimeString("pt-BR")}
                          </span>
                          <div className="flex gap-2">
                            <Button onClick={() => handleEditAnotacao(anotacao)} size="sm" variant="outline"> {/* Passar o objeto anotacao */}
                              Editar
                            </Button>
                            <Button onClick={() => handleDeleteAnotacao(anotacao.id)} size="sm" variant="destructive">
                              Apagar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* Seção para Adicionar Nova Anotação */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Adicionar Nova Anotação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              ref={novaAnotacaoRef}
              placeholder="Digite sua anotação aqui..."
              value={novaAnotacaoContent}
              onChange={(e) => setNovaAnotacaoContent(e.target.value)}
              rows={4}
              // A cor do texto do Textarea geralmente é controlada pelo próprio componente ou estilos globais.
              // Se precisar ajustar aqui, pode adicionar uma classe:
              // className="text-gray-700 dark:text-gray-300"
            />
            {/* Desabilitar botão se estiver processando ou anotação vazia */}
            <Button onClick={handleAddAnotacao} disabled={!novaAnotacaoContent.trim()}>
              Adicionar Anotação
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default ConsultaPage;
