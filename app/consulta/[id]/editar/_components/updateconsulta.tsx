"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/app/_hooks/use-toast";
import { Button } from "@/app/_components/ui/button";
import DescriptionEditor from "@/app/consulta/components/descriptioneditor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Check, ChevronLeftIcon, ChevronsUpDown } from "lucide-react";
import Header from "@/app/_components/header";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import { Consultatype } from "@prisma/client";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/app/_components/ui/popover";
import { useRouter } from "next/navigation";

interface Consulta {
  id: string;
  tipo: string;
  data: string;
  unidade: {
    id: string;
    nome: string;
    tipo: string;
  };
  profissional: {
    id: string;
    nome: string;
    especialidade: string;
    NumClasse: string;
  };
  motivo: string;
}

interface ConsultaPageProps {
  params: {
    id: string;
  };
}

// Componente para Seleção do Tipo de Consulta
const TipoConsultaSelector = ({ selectedTipo, onSelect }: { selectedTipo: string; onSelect: (tipo: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedTipo || "");

  const handleSelectTipo = (currentValue: string) => {
    setValue(currentValue === value ? "" : currentValue);
    setOpen(false);
    onSelect(currentValue);
  };

  const tiposConsulta = Object.values(Consultatype);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? value : "Selecione o Tipo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
            <CommandGroup>
              {tiposConsulta.map((tipo) => (
                <CommandItem
                  key={tipo}
                  value={tipo}
                  onSelect={() => handleSelectTipo(tipo)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === tipo ? "opacity-100" : "opacity-0"}`}
                  />
                  {tipo}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
}

const ProfissionalConsultaSelector = ({
  selectedProfissional,
  onSelect,
  profissionais = [] as Profissional[],
}: {
  selectedProfissional: Profissional | null;
  onSelect: (profissional: Profissional | null) => void;
  profissionais: Profissional[];
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedProfissional?.id || null);

  const handleSelectProfissional = (profissionalId: string) => {
    const newValue = profissionalId === value ? null : profissionalId;
    setValue(newValue);
    setOpen(false);
    onSelect(profissionais.find((p) => p.id === newValue) || null); // Passa o objeto profissional ou null
  };

  // ✅ Garante que profissionais seja um array antes de chamar find()
  const nomeProfissionalSelecionado =
    (Array.isArray(profissionais) &&
      profissionais.find((p) => p.id === value)?.nome) ||
    "Selecione um profissional...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {nomeProfissionalSelecionado}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
            <CommandGroup>
              {Array.isArray(profissionais) &&
                profissionais.map((profissional) => (
                  <CommandItem
                    key={profissional.id}
                    onSelect={() => handleSelectProfissional(profissional.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === profissional.id ? "opacity-100" : "opacity-0"}`}
                    />
                    {`${profissional.nome} - ${profissional.especialidade}`}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

const UnidadeConsultaSelector = ({
  selectedUnidade,
  onSelect,
  unidades = [] as Unidade[],
}: {
  selectedUnidade: Unidade | null;
  onSelect: (unidade: Unidade | null) => void;
  unidades: Unidade[];
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedUnidade?.id || null);


  const handleSelectUnidade = (UnidadeId: string) => {
    const newValue = UnidadeId === value ? null : UnidadeId;
    setValue(newValue);
    setOpen(false);
    onSelect(unidades.find((u) => u.id === newValue) || null); // Passa o objeto unidade ou null
  };

  // ✅ Garante que profissionais seja um array antes de chamar find()
  const nomeUnidadeSelecionada =
    (Array.isArray(unidades) &&
      unidades.find((u) => u.id === value)?.nome) ||
    "Selecione uma unidade...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {nomeUnidadeSelecionada}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {Array.isArray(unidades) &&
                unidades.map((unidade: { id: string; nome: string; tipo: string }) => (
                  <CommandItem
                    key={unidade.id}
                    onSelect={() => handleSelectUnidade(unidade.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === unidade.id ? "opacity-100" : "opacity-0"}`}
                    />
                    {`${unidade.nome} - ${unidade.tipo}`}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const UpdateConsulta = ({ params }: ConsultaPageProps) => {
  const router = useRouter(); // ✅ Instanciando o router
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [profissionais, setProfissionais] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const response = await fetch(`/api/consultas/${params.id}`);
        const data = await response.json();
        setConsulta(data);
      } catch (error) {
        console.error("Erro ao buscar consulta:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfissionais = async () => {
      try {
        const response = await fetch("/api/profissional"); // 🔹 Faz a requisição para buscar os profissionais
        const data = await response.json();
        setProfissionais(data); // 🔹 Salva os profissionais no estado
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
      }
    };

    const fetchUnidades = async () => {
      try {
        const response = await fetch("/api/unidadesaude"); // 🔹 Faz a requisição para buscar as unidades
        const data = await response.json();
        setUnidades(data); // 🔹 Salva as unidades no estado
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
      }
    };

    fetchProfissionais();
    fetchConsulta();
    fetchUnidades();
    setLoading(false);
  }, [params.id]);

  const handleUpdateConsulta = async () => {
    try {
      const response = await fetch(`/api/consultas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: consulta?.tipo,
        }),
      });

      if (response.ok) {
        toast({
          title: "Consulta atualizada com sucesso!",
          variant: "default", // Use "default" ou outro permitido, pois "success" não é um variant padrão
          duration: 5000,
        });

        // ✅ Redirecionando para a página da consulta
        router.push(`/consulta/${params.id}`);
      } else {
        toast({
          title: "Erro ao atualizar consulta.",
          variant: "destructive", // Use "destructive" para erros
          duration: 5000
       });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar consulta.",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.", // Opcional: adicionar descrição do erro
        variant: "destructive",
        duration: 5000
    });
    }
  };

  if (loading) return <h1>Carregando...</h1>;
  if (!consulta) return <h1>Consulta não encontrada</h1>;

  return (
    <div>
      <Header />
      <header className="flex items-center justify-between p-5">
        <Link href={`/consulta/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <Button onClick={handleUpdateConsulta}>Salvar alterações</Button>
      </header>

      <main className="p-5">
        <div className="flex items-center gap-5 p-3">
          <h1 className="text-xl font-bold">
            Tipo de Consulta:
            <TipoConsultaSelector
              selectedTipo={consulta.tipo}
              onSelect={(tipoSelecionado) => {
                setConsulta((prev) =>
                  prev
                    ? {
                        ...prev,
                        tipo: tipoSelecionado,
                        id: prev.id,
                        data: prev.data,
                        unidade: prev.unidade,
                        profissional: prev.profissional,
                        queixas: prev.motivo,
                      }
                    : prev,
                );
              }}
            />
          </h1>

          <input
            type="date"
            defaultValue={
              consulta.data
                ? new Date(consulta.data).toISOString().split("T")[0]
                : ""
            }
            className="rounded border border-none bg-black px-3 py-2 text-white"
          />

          <p>às</p>

          <input
            type="time"
            defaultValue={new Date(consulta.data).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            className="rounded border border-none bg-black px-3 py-2 text-white"
          />
        </div>

        <h1 className="p-5 text-xl font-bold">
          Profissional:
          <ProfissionalConsultaSelector
            selectedProfissional={consulta.profissional}
            onSelect={(
              ProfissionalSelecionado: {
                id: string;
                nome: string;
                especialidade: string;
                NumClasse: string;
              } | null,
            ) => {
              setConsulta((prev) =>
                prev
                  ? {
                      ...prev,
                      profissional: ProfissionalSelecionado || {
                        id: "",
                        nome: "",
                        especialidade: "",
                        NumClasse: "",
                      },
                    }
                  : prev,
              );
            }}
            profissionais={profissionais}
          />
        </h1>

        <h1 className="p-5 text-xl font-bold">
          Unidade:
          <UnidadeConsultaSelector
            selectedUnidade={consulta.unidade}
            onSelect={(
              unidadeSelecionada: {
                id: string;
                nome: string;
                tipo: string;
              } | null,
            ) => {
              setConsulta((prev) =>
                prev
                  ? {
                      ...prev,
                      unidade: unidadeSelecionada || {
                        id: "",
                        nome: "",
                        tipo: "",
                      },
                    }
                  : prev,
              );
            }}
            unidades={unidades}
          />
        </h1>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>Registros sobre a consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <CardContent>
              <p>{consulta.motivo || "Nenhuma queixa registrada"}</p>
            </CardContent>
            <DescriptionEditor
              descricao={consulta.motivo}
              consultaId={consulta.id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UpdateConsulta;
