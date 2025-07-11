"use client";

import { useState, useEffect } from "react";
import { Button } from "../_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../_components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../_components/ui/dialog";
import { Loader2 } from "lucide-react";
import Header from "../_components/header";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades: { id: string; nome: string }[];
}
const ProfissionaisPage = () => {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const response = await fetch("/api/profissional");
        const data = await response.json();
        setProfissionais(data);
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfissionais();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/profissional/${id}`, { method: "DELETE" });
      setProfissionais(profissionais.filter((p) => p.id !== id));
      setSelectedProfissional(null);
    } catch (error) {
      console.error("Erro ao deletar profissional:", error);
    }
  };

  const handleCardClick = (profissionalId: string) => {
    router.push(`/profissionais/${profissionalId}`);
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <Button asChild>
            <Link href="/profissionais/novo">Adicionar Profissional</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profissionais.map((profissional) => (
              <Card
                key={profissional.id}
                className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                onClick={() => handleCardClick(profissional.id)}
              >
                <CardHeader>
                  <CardTitle className="text-red-600">
                    {profissional.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Especialidade:</strong> {profissional.especialidade}
                  </p>
                  <p>
                    <strong>Número de Classe:</strong> {profissional.NumClasse}
                  </p>
                  <p>
                    <strong>Unidade:</strong>{" "}
                    {profissional.unidades?.[0]?.nome || "Desconhecida"}
                  </p>
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          onClick={() => setSelectedProfissional(profissional)}
                        >
                          Apagar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <p>
                          Tem certeza que deseja apagar{" "}
                          {selectedProfissional?.nome}?
                        </p>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedProfissional(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              selectedProfissional &&
                              handleDelete(selectedProfissional.id)
                            }
                          >
                            Confirmar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfissionaisPage;
