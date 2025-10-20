"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
import Header from "@/app/_components/header";
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

interface Consulta {
  id: string;
  profissionalId: string;
  unidadeId: string;
}

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
  const [consultasPorProfissional, setConsultasPorProfissional] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
   
    if (!unidadeId) {

      setError("ID da unidade não foi fornecido.");
      setLoading(false);
      return;
    }
    console.log("Fetching data for unidadeId:", unidadeId);

    const fetchData = async () => {
      try {
        setLoading(true);

        const [unidadeRes, profRes, enderecosRes, consultasRes] =
          await Promise.all([
            fetch(`/api/unidadesaude?id=${unidadeId}`),
            fetch("/api/profissionais"),
            fetch("/api/enderecos"),
            fetch(`/api/consultas?unidadeId=${unidadeId}`),
          ]);

        if (
          !unidadeRes.ok ||
          !profRes.ok ||
          !enderecosRes.ok ||
          !consultasRes.ok
        ) {
          throw new Error("Erro ao carregar os dados");
        }

        const unidadeData = await unidadeRes.json();
        const profData = await profRes.json();
        const enderecosData = await enderecosRes.json();
        const consultasData = await consultasRes.json();

        console.log("📡 Dados recebidos:", {
          unidade: unidadeData,
          profissionais: profData,
          enderecos: enderecosData,
          consultas: consultasData,
        });

        setUnidade(unidadeData);
        setProfissionais(
          profData.filter((p: { unidades: { id: string }[] }) =>
            p.unidades.some((u) => u.id === unidadeId),
          ),
        );
        setEnderecos(enderecosData);

        // Processa dados das consultas
        if (consultasData.consultas) {
          const consultasContagem = consultasData.consultas.reduce(
            (acc: { [key: string]: number }, consulta: Consulta) => {
              if (consulta.profissionalId) {
                acc[consulta.profissionalId] =
                  (acc[consulta.profissionalId] || 0) + 1;
              }
              return acc;
            },
            {},
          );
          setConsultasPorProfissional(consultasContagem);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unidadeId]);

  const salvarAlteracoes = async () => {
    console.log("Saving changes for unidadeId:", unidadeId);
    console.log("Unidade data being sent:", unidade);

    try {
      const res = await fetch(`/api/unidadesaude/${unidadeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unidade),
      });

      if (!res.ok) throw new Error("Erro ao salvar alterações");

      alert("Unidade atualizada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar alterações:", error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!unidade) return <p>Unidade não encontrada.</p>;

  return (
    <div>
      <Header />
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">Editar Unidade</h1>
          <div className="mt-4 space-y-2">
            <label>Nome:</label>
            <input
              type="text"
              value={unidade.nome}
              onChange={(e) => setUnidade({ ...unidade, nome: e.target.value })}
              className="w-full rounded border p-2 "
            />
            <label>Telefone:</label>
            <input
              type="text"
              value={unidade.telefone || ""}
              onChange={(e) =>
                setUnidade({ ...unidade, telefone: e.target.value })
              }
              className="w-full rounded border p-2"
            />
            <label>Tipo:</label>
            <input
              type="text"
              value={unidade.tipo}
              onChange={(e) => setUnidade({ ...unidade, tipo: e.target.value })}
              className="w-full rounded border p-2"
            />
            <h2 className="mt-6 text-xl font-semibold">Endereço</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {unidade.endereco && typeof unidade.endereco === "object" && "nome" in unidade.endereco
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
                          onSelect={() => setUnidade({ ...unidade, endereco: endereco })}
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
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Profissionais e Consultas</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2 text-left">Especialidade</th>
                    <th className="border p-2 text-center">
                      Total de Consultas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profissionais.map((prof) => (
                    <tr key={prof.id} className="border">
                      <td className="border p-2">{prof.nome}</td>
                      <td className="border p-2">{prof.especialidade}</td>
                      <td className="border p-2 text-center">
                        {consultasPorProfissional[prof.id] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadeDetalhesPage;
