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
import { ChevronLeftIcon } from "lucide-react";
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
import EnderecoDialog from "@/app/enderecos/_components/enderecosdialog";

const UnidadePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeid = searchParams.get("unidadeid");

  const form = useForm({
    defaultValues: {
      unidade: { nome: "", tipo: "" },
      endereco: {
        CEP: "",
        numero: "",
        rua: "",
        bairro: "",
        municipio: "",
        UF: "",
      },
    },
  });

  const [enderecos, setEnderecos] = useState([]);
  const [selectedEndereco, setSelectedEndereco] = useState(null);

  useEffect(() => {
    if (unidadeid) {
      fetchUnidadeById(unidadeid); // Carrega os dados da unidade ao editar
    }
    fetchEnderecos(); // Sempre carrega os endereços existentes
  }, [unidadeid]);

  const fetchUnidadeById = async (unidadeid: string) => {
    try {
      const response = await fetch(`/api/unidades/${unidadeid}`);
      const data = await response.json();
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
      const response = await fetch("/api/endereco");
      const data = await response.json();
      setEnderecos(data);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  const createUnidade = async (data) => {
    try {
      const response = await fetch("/api/unidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidade: data.unidade,
          endereco: data.endereco,
        }),
      });
      if (response.ok) {
        router.push("/unidades");
      } else {
        console.error("Erro ao criar unidade");
      }
    } catch (error) {
      console.error("Erro ao criar unidade:", error);
    }
  };

  const updateUnidade = async (data) => {
    try {
      const response = await fetch(`/api/unidades/${unidadeid}`, {
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
        router.push("/unidades");
      } else {
        console.error("Erro ao atualizar unidade");
      }
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error);
    }
  };

  const handleSaveEndereco = (novoEndereco) => {
    setEnderecos([...enderecos, novoEndereco]); // Adiciona o novo endereço à lista
    setSelectedEndereco(novoEndereco); // Define o novo endereço como selecionado
    form.setValue("endereco", novoEndereco); // Atualiza o formulário com o novo endereço
  };

  const handleSubmit = async (data) => {
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
          <Link href="/unidades">
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
                      ? selectedEndereco.rua
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
                        {enderecos.length === 0 ? (
                          <CommandItem disabled>
                            Carregando endereços...
                          </CommandItem>
                        ) : (
                          enderecos.map((endereco, index) => (
                            <CommandItem
                              key={index}
                              value={endereco.id}
                              onSelect={() => {
                                setSelectedEndereco(endereco);
                                form.setValue("endereco", endereco);
                              }}
                            >
                              {endereco.nome} - {endereco.bairro}
                            </CommandItem>
                          ))
                        )}
                        <CommandItem>
                          <EnderecoDialog onSave={handleSaveEndereco} />
                        </CommandItem>
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
