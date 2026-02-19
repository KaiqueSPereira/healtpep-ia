'use client';
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
import { ChevronLeft } from "lucide-react";
import { Profissional } from "@/app/_components/types";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useToast } from "@/app/_hooks/use-toast";

interface FormData {
  profissional: Profissional;
}

export function ProfissionalFormWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast(); // CORREÇÃO: Inicialização do hook
  const profissionalid = searchParams.get("profissionalid");

  const form = useForm<FormData>({
    defaultValues: {
      profissional: { nome: "", especialidade: "", NumClasse: "" },
    },
  });

  const fetchProfissionalById = async (profissionalid: string) => {
    try {
      const response = await fetch(`/api/profissionais/${profissionalid}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do profissional");

      const data: { profissional: Profissional } = await response.json();
      form.setValue("profissional", data.profissional);
    } catch (error) {
      console.error("Erro ao buscar profissional:", error);
      toast({title: "Erro ao buscar profissional.",variant: "destructive"});
    }
  };

  useEffect(() => {
    if (profissionalid) {
      fetchProfissionalById(profissionalid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalid]);

  const createProfissional = async (data: FormData) => {
    try {
      const response = await fetch("/api/profissionais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.profissional.nome,
          especialidade: data.profissional.especialidade,
          NumClasse: data.profissional.NumClasse,
        }),
      });

      // IMPLEMENTAÇÃO: Lógica de toasts
      if (response.ok) {
        toast({ title: "Profissional cadastrado com sucesso!" });
        const newProfessional = await response.json();
        router.push(`/profissionais/${newProfessional.id}/editar`);
      } else {
        const errorDetails = await response.json();
        console.error("Erro ao criar profissional:", errorDetails);

        if (response.status === 409) {
          toast({
            title: "Profissional já cadastrado",
            description: errorDetails.error, // Mensagem vinda da API
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar profissional.",
            description: errorDetails.error || "Ocorreu um erro inesperado.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro de rede ou inesperado:", error);
      toast({title: "Erro ao criar profissional.", description: "Verifique sua conexão ou tente novamente.", variant: "destructive"});
    }
  };

  const updateProfissional = async (data: FormData) => {
    try {
      const response = await fetch(`/api/profissionais/${profissionalid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.profissional.nome,
          especialidade: data.profissional.especialidade,
          NumClasse: data.profissional.NumClasse,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        // Trata erro de duplicidade também na atualização
        if (response.status === 409) {
             toast({
                title: "Número de Classe já existe",
                description: errorDetails.error,
                variant: "destructive",
            });
        } else {
            throw new Error("Erro ao atualizar profissional");
        }
      } else {
        toast({title: "Profissional atualizado com sucesso."});
        router.push(`/profissionais/${profissionalid}`);
      }

    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
      toast({title: "Erro ao atualizar profissional.", variant: "destructive"});
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      if (profissionalid) {
        await updateProfissional(data);
      } else {
        await createProfissional(data);
      }
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
       toast({title: "Erro ao salvar profissional.", variant: "destructive"});
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
          <Link href="/profissionais">
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
            <Button type="submit" className="mt-6 justify-center">
              Salvar
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
