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
import { ChevronDown, ChevronLeft } from "lucide-react";
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
import { Profissional, Unidade } from "@/app/_components/types";
import { toast } from "@/app/_hooks/use-toast";

// Tipagem geral para os formulários
interface FormData {
  profissional: Profissional;
  unidade: Unidade | null;
}

const ProfissionalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profissionalid = searchParams.get("profissionalid");

  const form = useForm<FormData>({
    defaultValues: {
      profissional: { nome: "", especialidade: "", NumClasse: "" },
      unidade: null,
    },
  });

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchProfissionalById = async (profissionalid: string) => {
    try {
      const response = await fetch(`/api/profissional/${profissionalid}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do profissional");

      const data: { profissional: Profissional; unidade: Unidade } =
        await response.json();
      form.setValue("profissional", data.profissional);
      form.setValue("unidade", data.unidade);
      setSelectedUnidade(data.unidade);
    } catch (error) {
      console.error("Erro ao buscar profissional:", error);
      toast("Erro ao buscar profissional.", "destructive", { duration: 5000 });
    }
  };

  useEffect(() => {
    if (profissionalid) {
      fetchProfissionalById(profissionalid);
    }
    fetchUnidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalid]);

  const fetchUnidades = async () => {
    try {
      const response = await fetch("/api/unidadesaude");
      if (!response.ok) throw new Error("Erro ao buscar unidades");

      const data: Unidade[] = await response.json();
      setUnidades(data);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
      toast("Erro ao buscar unidades.", "destructive", { duration: 5000 });
    }
  };

  const createProfissional = async (data: FormData) => {
    try {
      const response = await fetch("/api/profissional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.profissional.nome,
          especialidade: data.profissional.especialidade,
          NumClasse: data.profissional.NumClasse,
          unidadeId: selectedUnidade?.id,
        }),
      });

      if (response.ok) {
        router.push("/");
      } else {
        const errorDetails = await response.json();
        console.error("Erro ao criar profissional:", errorDetails);
      }
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
    }
  };

  const updateProfissional = async (data: FormData) => {
    try {
      const response = await fetch(`/api/profissional/${profissionalid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profissional: data.profissional,
          unidadeId: selectedUnidade?.id,
        }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar profissional");

      router.push("/");
    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
    }
  };

  const handleSubmit = async (data: FormData) => {
    if (!selectedUnidade) {
      form.setError("unidade", {
        type: "manual",
        message: "Selecione uma unidade antes de salvar.",
      });
      return;
    }

    try {
      if (profissionalid) {
        await updateProfissional(data);
      } else {
        await createProfissional(data);
      }
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
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
            <ChevronLeft />
          </Link>
        </Button>
      </div>

      <div className="mx-auto my-8 w-4/5">
        <h1 className="mb-6 text-center text-2xl font-bold">
          {profissionalid ? "Editar Profissional" : "Novo Profissional"}
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="profissional.nome"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="nome">Nome do Profissional:</label>
                  <FormControl>
                    <Input id="nome" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profissional.especialidade"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="especialidade">
                    Especialidade do Profissional:
                  </label>
                  <FormControl>
                    <Input id="especialidade" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profissional.NumClasse"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="NumClasse">
                    Número de Classe do Profissional:
                  </label>
                  <FormControl>
                    <Input id="NumClasse" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h2 className="mt-6 text-xl font-semibold">Unidade de Saúde</h2>
            <FormField
              control={form.control}
              name="unidade"
              render={() => (
                <FormItem>
                  <label>Escolher Unidade Existente</label>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedUnidade
                          ? selectedUnidade.nome
                          : "Selecione uma Unidade..."}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar Unidade..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhuma unidade encontrada.
                          </CommandEmpty>
                          <CommandGroup>
                            {unidades.map((unidade) => (
                              <CommandItem
                                key={unidade.id}
                                onSelect={() => {
                                  setSelectedUnidade(unidade);
                                  form.setValue("unidade", unidade);
                                  setPopoverOpen(false);
                                }}
                              >
                                {unidade.nome} - {unidade.tipo}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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

export default ProfissionalPage;
