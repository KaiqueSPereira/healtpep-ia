'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, CalendarCheck, Loader2, AlertCircle } from "lucide-react";
import Header from "../_components/header";
import Footer from "../_components/footer";
import Link from "next/link";
import { Button } from "../_components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "../_components/ui/dialog";
import { useToast } from "../_hooks/use-toast";

const UnidadesPage = () => {
  interface Unidade {
    id: string | number;
    nome: string;
    tipo: string;
  }

  interface Profissional {
    id: string;
    unidades: Array<{ id: string | number }>;
  }

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [profissionaisPorUnidade, setProfissionaisPorUnidade] = useState<
    Record<string | number, number>
  >({});
  const [consultasPorUnidade, setConsultasPorUnidade] = useState<
    Record<string | number, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchJson = async (res: Response) => {
    if (!res.ok) throw new Error(`Erro ao buscar ${res.url}`);
    return res.json();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unidadesData, profissionaisData, consultasData] =
          await Promise.all([
            fetch("/api/unidadesaude").then(fetchJson),
            fetch("/api/profissional").then(fetchJson),
            fetch("/api/consultas").then(fetchJson),
          ]);

        setUnidades(unidadesData);
        const profissionaisArray = Array.isArray(profissionaisData)
          ? profissionaisData
          : profissionaisData.profissionais || [];
        const consultasArray = Array.isArray(consultasData)
          ? consultasData
          : consultasData.consultas || [];

        console.log("Dados brutos dos profissionais:", profissionaisData);
        console.log("Array de profissionais:", profissionaisArray);

        const contagemProfissionais = profissionaisArray.reduce(
          (
            acc: Record<string | number, number>,
            profissional: Profissional,
          ) => {
            if (
              profissional &&
              profissional.unidades &&
              profissional.unidades.length > 0
            ) {
              profissional.unidades.forEach(
                (unidade: { id: string | number }) => {
                  acc[unidade.id] = (acc[unidade.id] || 0) + 1;
                },
              );
            }
            return acc;
          },
          {} as Record<string | number, number>,
        );

        console.log("Contagem de Profissionais:", contagemProfissionais);
        setProfissionaisPorUnidade(contagemProfissionais);

        const contagemConsultas = consultasArray.reduce(
          (
            acc: Record<string | number, number>,
            consulta: { unidadeId: string | number },
          ) => {
            if (consulta.unidadeId) {
              acc[consulta.unidadeId] = (acc[consulta.unidadeId] || 0) + 1;
            }
            return acc;
          },
          {},
        );
        setConsultasPorUnidade(contagemConsultas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError(
          "Falha ao carregar os dados. Por favor, tente novamente mais tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (unidadeId: string | number) => {
    router.push(`/unidades/editar/${unidadeId}`);
  };

  const confirmDelete = (unidadeId: string | number) => {
    setDeleteId(unidadeId);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    fetch(`/api/unidadesaude?id=${deleteId}`, {
      method: "DELETE",
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          console.error("Erro ao apagar unidade:", text);
          return;
        }
        setUnidades((unidades) =>
          unidades.filter((unidade) => unidade.id !== deleteId),
        );
        toast("Unidade apagada com sucesso!", "foreground", { duration: 5000 });
      })
      .catch((error) => {
        console.error("Erro ao apagar unidade:", error);
      })
      .finally(() => {
        setDeleteId(null);
      });
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        <div className="mt-8 flex justify-between">
          <h1 className="mb-4 text-2xl font-bold">Unidades de Saúde</h1>
          <Link href="/unidades/novo">
            <Button>Adicionar Unidade</Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
          </div>
        ) : error ? (
          <div className="flex h-40 flex-col items-center justify-center text-red-500">
            <AlertCircle className="h-10 w-10" />
            <p className="mt-2">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unidades.map((unidade) => (
              <div key={unidade.id} className="rounded-lg border p-4 shadow-lg">
                <h2 className="text-xl font-semibold">{unidade.nome}</h2>
                <p className="text-gray-600">{unidade.tipo}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {profissionaisPorUnidade[unidade.id] || 0} Profissionais
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    {consultasPorUnidade[unidade.id] || 0} Consultas
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(unidade.id)}
                  >
                    Editar
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => confirmDelete(unidade.id)}
                        className="bg-red-500"
                      >
                        Apagar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        Tem certeza que deseja apagar esta unidade?
                      </DialogHeader>
                      <DialogFooter>
                        <Button onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-500">
                          Confirmar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UnidadesPage;
