"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ChevronLeftIcon} from "lucide-react";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import Link from "next/link";
import { Endereco, Profissional, Unidade } from "@/app/_components/types";

const UnidadeDetalhesPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const unidadeId =
    params?.unidadeid || searchParams.get("id") || pathname.split("/").pop();
  console.log("✅ unidadeId extraído:", unidadeId);

  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<{ [key: string]: Unidade | null }>({});

  useEffect(() => {
    if (!unidadeId) {
      setError("ID da unidade não foi fornecido.");
      setLoading(false);
      return;
    }

  

    const fetchData = async () => {
      try {
        setLoading(true);

        const [unidadeRes, profRes, enderecosRes] = await Promise.all([
          fetch(`/api/unidadesaude?id=${unidadeId}`),
          fetch("/api/profissional"),
          fetch("/api/enderecos"),
        ]);

        if (!unidadeRes.ok || !profRes.ok || !enderecosRes.ok) {
          throw new Error("Erro ao carregar os dados");
        }

        const unidadeData = await unidadeRes.json();
        const profData = await profRes.json();
        const enderecosData = await enderecosRes.json();

        console.log("📡 Dados recebidos:", {
          unidade: unidadeData,
          profissionais: profData,
          enderecos: enderecosData,
        });

        setUnidade(unidadeData);
        setProfissionais(
          profData.filter((p: { unidades: { id: string }[]; }) => p.unidades.some((u) => u.id === unidadeId)),
        );
        setEnderecos(enderecosData);
      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unidadeId]);

  useEffect(() => {
    if (profissionais.length > 0) {
      const unidadesIniciais = profissionais.reduce(
        (acc: { [key: string]: Unidade | null }, prof: Profissional) => {
          // Pegamos a primeira unidade associada ao profissional (ou deixamos null se ele não tiver)
          const unidadeAtual =
            prof.unidade?.id === unidadeId ? (prof.unidade as Unidade) : null;
          acc[prof.id] = unidadeAtual;
          return acc;
        },
        {},
      );

      setUnidadesSelecionadas(unidadesIniciais);
    }
  }, [profissionais, unidadeId]);
 
  const salvarAlteracoes = async () => {
    try {
      const res = await fetch(`/api/unidadesaude/${unidadeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unidade),
      });

      if (!res.ok) throw new Error("Erro ao salvar alterações");

      alert("Unidade atualizada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar alterações:", error);
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!unidade) return <p>Unidade não encontrada.</p>;

  const salvarUnidade = async (profId: string) => {
    try {
      const res = await fetch(`/api/profissional/${profId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unidadeId: unidadesSelecionadas[profId]?.id }),
      });

      if (!res.ok) throw new Error("Erro ao salvar unidade");

      alert("Unidade do profissional atualizada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar unidade:", error);
    }
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Editar Unidade</h1>
        <div className="mt-4 space-y-2">
          <label className="text-white">Nome:</label>
          <input
            type="text"
            value={unidade.nome}
            onChange={(e) => setUnidade({ ...unidade, nome: e.target.value })}
            className="w-full rounded border bg-black p-2 text-white"
          />
          <label>Tipo:</label>
          <input
            type="text"
            value={unidade.tipo}
            onChange={(e) => setUnidade({ ...unidade, tipo: e.target.value })}
            className="w-full rounded border bg-black p-2 text-white"
          />
          <h2 className="mt-6 text-xl font-semibold">Endereço</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {unidade.endereco
                  ? unidade.endereco.nome
                  : "Selecione um Endereço..."}
                <ChevronLeftIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar endereço..." />
                <CommandList>
                  <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
                  <CommandGroup>
                    {enderecos.map((endereco) => (
                      <CommandItem
                        key={endereco.id}
                        onSelect={() => setUnidade({ ...unidade, endereco })}
                      >
                        {endereco.nome} - {endereco.bairro}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={salvarAlteracoes} className="mt-2">
            Salvar Alterações
          </Button>
        </div>

        <div className="mt-8 flex justify-between">
          <h2 className="mt-6 text-xl font-semibold">Profissionais</h2>
          <Link href="/profissionais/novo">
            <Button>Adicionar Profissional</Button>
          </Link>
        </div>
        <table className="mt-4 w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border p-2">Nome</th>
              <th className="border p-2">Especialidade</th>
              <th className="border p-2">Unidade</th>
              <th className="border p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profissionais.map((prof) => (
              <tr key={prof.id} className="border">
                <td className="p-2">{prof.nome}</td>
                <td className="p-2">{prof.especialidade}</td>
                <td className="p-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {unidadesSelecionadas[prof.id]
                          ? unidadesSelecionadas[prof.id]?.nome
                          : "Selecione uma Unidade..."}
                        <ChevronLeftIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandList>
                          <CommandEmpty>
                            Nenhuma unidade encontrada.
                          </CommandEmpty>
                          <CommandGroup>
                            {enderecos.map((u) => (
                              <CommandItem
                                key={u.id}
                                onSelect={() =>
                                  setUnidadesSelecionadas((prev) => ({
                                    ...prev,
                                    [prof.id]: {
                                      id: u.id,
                                      nome: u.nome,
                                      tipo: "", // Provide a default or appropriate value for 'tipo'
                                      endereco: {
                                        id: u.id,
                                        nome: u.nome,
                                        bairro: u.bairro,
                                      },
                                    },
                                  }))
                                }
                              >
                                {u.nome} - {u.bairro}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="flex gap-2 p-2">
                  <Button
                    variant="outline"
                    onClick={() => salvarUnidade(prof.id)}
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setUnidadesSelecionadas((prev) => ({
                        ...prev,
                        [prof.id]: prof.unidade
                          ? {
                              ...prof.unidade,
                              tipo: "",
                              endereco: prof.unidade?.endereco ? { ...prof.unidade.endereco } : null,
                            }
                          : null,
                      }))
                    }
                  >
                    Descartar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
};

export default UnidadeDetalhesPage;
