"use client";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Endereco, Unidade } from "@/app/_components/types";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";


interface FormData {
  unidade: Unidade;
  endereco?: Endereco;
}

export function UnidadeFormWrapper() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const unidadeid = searchParams.get("unidadeid");
  
    const form = useForm<FormData>({
      defaultValues: {
        unidade: { nome: "", tipo: "" },
      },
    });
  
    const [enderecos, setEnderecos] = useState<Endereco[]>([]);
    const [selectedEndereco, setSelectedEndereco] = useState<Endereco | null>(
      null,
    );
  
    const fetchUnidadeById = async (unidadeid: string) => {
      try {
        const response = await fetch(`/api/unidadesaude/${unidadeid}`);
        if (!response.ok) throw new Error("Erro ao buscar unidade");
  
        const data: { unidade: Unidade; endereco: Endereco } =
          await response.json();
        form.setValue("unidade", data.unidade);
        form.setValue("endereco", data.endereco);
        setSelectedEndereco(data.endereco);
      } catch (error) {
        console.error("Erro ao buscar unidade:", error);
      }
    };
  
    useEffect(() => {
      if (unidadeid) {
        fetchUnidadeById(unidadeid);
      }
      fetchEnderecos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unidadeid]);
  
    const fetchEnderecos = async () => {
      try {
        const response = await fetch("/api/enderecos");
        if (!response.ok) throw new Error("Erro ao buscar endereços");
  
        const data: Endereco[] = await response.json();
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
            telefone: data.unidade.telefone,
            enderecoId: selectedEndereco?.id, // Ajustado para enviar enderecoId como string
          }),
        });
  
        if (response.ok) {
          router.push("/unidades");
        } else {
          console.error("Erro ao criar unidade");
          const errorDetails = await response.json();
          console.error("Detalhes do erro:", errorDetails);
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
        if (!response.ok) throw new Error("Erro ao atualizar unidade");
  
        router.push("/");
      } catch (error) {
        console.error("Erro ao atualizar unidade:", error);
      }
    };
  
    const handleSubmit = async (data: FormData) => {
      if (!selectedEndereco) {
        alert("Selecione um endereço antes de salvar.");
        return;
      }
  
      try {
        if (unidadeid) {
          await updateUnidade(data);
        } else {
          await createUnidade(data);
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
                      <Input {...field} value={field.value ?? ''} required />
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
                      <Input {...field} value={field.value ?? ''} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="unidade.telefone"
                render={({ field }) => (
                  <FormItem>
                    <label>Telefone da Unidade:</label>
                    <FormControl>
                      {/* CORREÇÃO: Garante que o valor nunca é nulo. */}
                      <Input {...field} value={field.value ?? ''} required />
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
                          <CommandItem
                            key="add-new-unit"
                            value="add-new-unit"
                            onSelect={() => {
                              window.location.href = "/enderecos/[enderecoId]"; // Redireciona para a pÄ‚Ë‡gina de adicionar unidade
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Adicionar Novo Endereço
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
      </div>
    );
    }