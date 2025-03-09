"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import AgendamentoItem from "@/app/consulta/components/agendamentosItem";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades: { id: string; nome: string }[];
  consultas: Consulta[];
}

interface Consulta {
  id: string;
  data: Date;
  tipo: string;
  usuario: { nome: string };
  unidade: { nome: string };
}

interface Exame {
  id: string;
  nome: string;
  datacoleta: Date;
  tipo: string;
  usuario: { nome: string };
  unidade: { nome: string };
}

const EditarProfissionalPage = () => {
  const { profissionalId } = useParams();
  const router = useRouter();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profRes = await fetch(`/api/profissional/${profissionalId}`);

        if (!profRes.ok) {
          const error = await profRes.json();
          throw new Error(
            error.error || "Erro ao carregar dados do profissional",
          );
        }

        const profData = await profRes.json();
        setProfissional(profData);
        setConsultas(profData.consultas || []);
        setExames([]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError(
          error instanceof Error ? error.message : "Erro ao carregar dados",
        );
      } finally {
        setLoading(false);
      }
    };

    if (profissionalId) fetchData();
  }, [profissionalId]);

  const handleSave = async () => {
    try {
      if (!profissional) return;

      const res = await fetch(`/api/profissional/${profissionalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: profissional.nome,
          especialidade: profissional.especialidade,
          NumClasse: profissional.NumClasse,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar alterações");
      }

      const data = await res.json();
      setProfissional(data.data);
      alert("Profissional atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao salvar alterações",
      );
    }
  };

  const handleExameClick = (exameId: string) => {
    router.push(`/exames/${exameId}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold">Editar Profissional</h1>

        <div className="mb-8 max-w-2xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={profissional?.nome || ""}
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
                value={profissional?.especialidade || ""}
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
                value={profissional?.NumClasse || ""}
                onChange={(e) =>
                  setProfissional((prev) =>
                    prev ? { ...prev, NumClasse: e.target.value } : null,
                  )
                }
              />
            </div>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex h-full flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Últimas Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {consultas.slice(0, 5).map((consulta) => (
                    <AgendamentoItem
                      key={consulta.id}
                      consultas={{
                        id: consulta.id,
                        tipo: consulta.tipo,
                        data: consulta.data.toString(),
                        profissional: { nome: profissional?.nome || "" },
                        unidade: { nome: consulta.unidade.nome },
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex h-full flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Últimos Exames</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {exames.slice(0, 5).map((exame) => (
                    <div
                      key={exame.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-100"
                      onClick={() => handleExameClick(exame.id)}
                    >
                      <div>
                        <p className="font-medium">{exame.nome}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(exame.datacoleta).toLocaleDateString()} -{" "}
                          {exame.tipo}
                        </p>
                        <p className="text-sm text-gray-500">
                          {exame.usuario.nome}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditarProfissionalPage;
