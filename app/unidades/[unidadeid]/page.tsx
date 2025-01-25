"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Footer from "@/app/_components/footer";
import Header from "@/app/_components/header";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import Link from "next/link";
import { Check, ChevronLeftIcon } from "lucide-react";
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

// Tipagem para os dados da unidade de saúde
interface Unidade {
  nome: string;
  tipo: string;
}

// Tipagem para os dados do endereço
interface Endereco {
  id: string;
  nome: string;
  bairro: string;
}

// Tipagem geral para os formulários
interface FormData {
  unidade: Unidade;
  endereco?: Endereco;
}

const UnidadePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeid = searchParams.get("unidadeid");

  const form = useForm<FormData>({
    defaultValues: {
      unidade: { nome: "", tipo: "" },
    },
  });

  const [enderecos, setEnderecos] = useState<Endereco[]>([]); // Adicionado tipo explícito
  const [selectedEndereco, setSelectedEndereco] = useState<Endereco | null>(
    null,
  ); // Adicionado tipo explícito

  useEffect(() => {
    if (unidadeid) {
      fetchUnidadeById(unidadeid); // Carrega os dados da unidade ao editar
    }
    fetchEnderecos(); // Sempre carrega os endereços existentes
  }, [unidadeid]);

  const fetchUnidadeById = async (unidadeid: string) => {
    try {
      const response = await fetch(`/api/unidades/${unidadeid}`);
      const data: { unidade: Unidade; endereco: Endereco } =
        await response.json(); // Tipagem explícita
      if (data) {
        form.setValue("unidade", data.unidade);
        form.setValue("endereco", data.endereco);
        setSelectedEndereco(data.endereco); // Define o endereço selecionado
      }
    } catch (error) {
      console.error("Erro ao buscar unidade:", error);
    }
  };

  const fetchEnderecos = async () => {
    try {
      const response = await fetch("/api/enderecos");
      const data: Endereco[] = await response.json(); // Tipagem explícita
      setEnderecos(data);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  const createUnidade = async (data: FormData) => {
    try {
      const response = await fetch("/api/unidadesaude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.unidade.nome,
          tipo: data.unidade.tipo,
          endereco: {
            id: selectedEndereco?.id, // Envia somente o ID do endereço existente
          },
        }),
      });
      if (response.ok) {
        router.push("/");
      } else {
        console.error("Erro ao criar unidade");
      }
    } catch (error) {
      console.error("Erro ao criar unidade:", error);
    }
  };

  const updateUnidade = async (data: FormData) => {
    try {
      const response = await fetch(`/api/unidadesaude/${unidadeid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidade: data.unidade,
          endereco: data.endereco,
        }),
      });
      if (response.ok) {
        router.push("/");
      } else {
        console.error("Erro ao atualizar unidade");
      }
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error);
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      if (unidadeid) {
        await updateUnidade(data); // Atualiza a unidade existente
      } else {
        await createUnidade(data); // Cria uma nova unidade
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  return (
    <div>
      <Header />
      <div className="flex items-center justify-between p-5">
        <Button
          size="icon"
          variant="secondary"
          className="left-5 top-6"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
      </div>

      <div className="mx-auto my-8 w-4/5">
        <h1 className="mb-6 text-center text-2xl font-bold">
          {unidadeid ? "Editar Unidade" : "Nova Unidade"}
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="unidade.nome"
              render={({ field }) => (
                <FormItem>
                  <label>Nome da Unidade:</label>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidade.tipo"
              render={({ field }) => (
                <FormItem>
                  <label>Tipo da Unidade:</label>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h2 className="mt-6 text-xl font-semibold">Endereço</h2>
            <div>
              <label>Escolher Endereço Existente</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={false}
                    className="w-full justify-between"
                  >
                    {selectedEndereco
                      ? selectedEndereco.nome
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
                            onSelect={() => {
                              setSelectedEndereco(endereco);
                              form.setValue("endereco", endereco);
                            }}
                          >
                            {endereco.nome} - {endereco.bairro}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="mt-6 justify-center">
              Salvar
            </Button>
          </form>
        </Form>
      </div>
      <Footer />
    </div>
  );
};

export default UnidadePage;
