"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import Link from "next/link";
import UnidadeSelectorMultiple from "@/app/_components/UnidadeSelectorMultiple"; // AJUSTE O CAMINHO CONFORME ONDE VOCÊ SALVOU O ARQUIVO

// Interfaces (ajustadas, mantendo apenas o necessário para esta tela)
interface UnidadeSaude {
  id: string;
  nome: string;
  tipo: string;
}

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades?: UnidadeSaude[];
}


const EditarProfissionalPage = () => {
  const { profissionalId } = useParams<{ profissionalId: string }>();
  const router = useRouter();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar o profissional. Certifique-se que o endpoint GET /api/profissional/[id]
        // inclui as unidades (`include: { unidades: true }`) para popular currentUnidades.
        const profRes = await fetch(`/api/profissional/${profissionalId}`);

        if (!profRes.ok) {
          const errorData = await profRes.json();
          throw new Error(
            errorData.error || "Erro ao carregar dados do profissional para edição",
          );
        }

        const profData: Profissional = await profRes.json();

        // Definir o estado do profissional com os dados recebidos
        setProfissional(profData);

      } catch (error: unknown) {
        console.error("Erro ao carregar dados do profissional para edição:", error);
        setError(
          error instanceof Error ? error.message : "Erro ao carregar dados desconhecido para edição",
        );
      } finally {
        setLoading(false);
      }
    };

    if (profissionalId) fetchData();
  }, [profissionalId]); // Dependência: profissionalId

  const handleSave = async () => {
    try {
      if (!profissional) return;

      // Prepara os dados para enviar no PATCH - Apenas os campos principais editáveis nesta tela
      const dataToUpdate = {
        nome: profissional.nome,
        especialidade: profissional.especialidade,
        NumClasse: profissional.NumClasse,
        // As unidades são gerenciadas pelo componente UnidadeSelectorMultiple e seus próprios endpoints API
        // Não inclua dados de unidade aqui, a menos que o PATCH endpoint principal também gerencie isso (o que não recomendamos)
      };

      const res = await fetch(`/api/profissional/${profissionalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar alterações do profissional");
      }

      alert("Profissional atualizado com sucesso!");
       // Redirecionar de volta para a página de detalhes após salvar
      router.push(`/profissionais/${profissionalId}`); // AJUSTAR PARA A ROTA DA SUA PÁGINA DE DETALHES
    } catch (error: unknown) {
      console.error("Erro ao salvar:", error);
      setError(
        error instanceof Error ? error.message : "Erro desconhecido ao salvar alterações",
      );
    }
  };


  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

   if (!profissional) return <div className="text-center py-10">Profissional não encontrado.</div>;


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
       <div className="p-4">
            {/* Botão Voltar */}
            <Button variant="secondary" asChild>
                <Link href={`/profissionais/${profissionalId}`}> {/* Volta para a página de detalhes */}
                     <ChevronLeft className="mr-2 h-4 w-4" /> Cancelar Edição
                </Link>
            </Button>
        </div>

      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold text-center">Editar Profissional</h1>

        {/* Formulário de Edição dos Dados Principais e Gerenciamento de Unidades */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            {/* Campos de Edição de Nome, Especialidade, Número de Classe */}
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={profissional.nome || ""}
                onChange={(e) =>
                  setProfissional((prev) =>
                    prev ? { ...prev, nome: e.target.value } : null,
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={profissional.especialidade || ""}
                onChange={(e) =>
                  setProfissional((prev) =>
                    prev ? { ...prev, especialidade: e.target.value } : null,
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="numClasse">Número de Classe</Label>
              <Input
                id="numClasse"
                value={profissional.NumClasse || ""}
                onChange={(e) =>
                  setProfissional((prev) =>
                    prev ? { ...prev, NumClasse: e.target.value } : null,
                  )
                }
              />
            </div>

            {/* Integração do componente de seleção/gerenciamento de unidades */}
            {/* O componente precisa do ID do profissional */}
            {/* Verificar se profissional existe antes de passar o id e as unidades */}
            {profissional && (
                 <UnidadeSelectorMultiple
                    profissionalId={profissional.id}
                    currentUnidades={profissional.unidades || []} // Passa as unidades atuais do estado local
                    // Callback para atualizar as unidades no estado local da página pai
                    onUnidadesChange={(updatedUnidades) => {
                        setProfissional(prev => {
                            if (prev) {
                                return {...prev, unidades: updatedUnidades};
                            }
                            return null;
                        });
                    }}
                 />
             )}


            <Button onClick={handleSave}>Salvar Alterações do Profissional</Button> {/* Botão para salvar dados principais */}
          </div>
        </div>

        {/* Seções de Relacionamentos (Consultas e Exames) REMOVIDAS */}

      </main>
    </div>
  );
};

export default EditarProfissionalPage;
