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
import { ChevronLeft } from "lucide-react"; // ChevronDown não é mais necessário
import { Profissional } from "@/app/_components/types"; // Unidade e tipos relacionados a ela não são mais necessários aqui
import { toast } from "@/app/_hooks/use-toast";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

// Removido Unidade | null de FormData
interface FormData {
  profissional: Profissional;
  // unidade: Unidade | null; // Removido
}

export function ProfissionalFormWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profissionalid = searchParams.get("profissionalid");

  // Removido default value para unidade
  const form = useForm<FormData>({
    defaultValues: {
      profissional: { nome: "", especialidade: "", NumClasse: "" },
      // unidade: null, // Removido
    },
  });

  // Removidos estados e lógica relacionados à unidade única
  // const [unidades, setUnidades] = useState<Unidade[]>([]);
  // const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  // const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchProfissionalById = async (profissionalid: string) => {
    try {
      const response = await fetch(`/api/profissional/${profissionalid}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do profissional");

      // Ajustar tipagem da resposta se a API não retornar mais a unidade única neste endpoint
      const data: { profissional: Profissional /* unidade?: Unidade */ } = // Removido unidade?
        await response.json();
      form.setValue("profissional", data.profissional);
      // form.setValue("unidade", data.unidade); // Removido
      // setSelectedUnidade(data.unidade); // Removido
    } catch (error) {
      console.error("Erro ao buscar profissional:", error);
        toast({title: "Erro ao buscar profissional.",variant: "destructive", duration: 5000});
    }
  };

  useEffect(() => {
    if (profissionalid) {
      fetchProfissionalById(profissionalid);
    }
    // fetchUnidades(); // Removido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalid]);

  // Removida função fetchUnidades
  // const fetchUnidades = async () => { /* ... */ };

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
          // unidadeId: selectedUnidade?.id, // Removido
        }),
      });

      if (response.ok) {
        // Redirecionar para a página de edição do novo profissional
        const newProfessional = await response.json(); // Assumindo que a API retorna o profissional criado com ID
        router.push(`/profissionais/${newProfessional.id}/editar`);
      } else {
        const errorDetails = await response.json();
        console.error("Erro ao criar profissional:", errorDetails);
        toast({title: "Erro ao criar profissional.", variant: "destructive", duration: 5000});
      }
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
      toast({title: "Erro ao criar profissional.", variant: "destructive", duration: 5000});
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
          // Enviando apenas os dados do profissional, unidades são gerenciadas pelo outro componente/API
          nome: data.profissional.nome,
          especialidade: data.profissional.especialidade,
          NumClasse: data.profissional.NumClasse,
          // unidadeId: selectedUnidade?.id, // Removido
        }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar profissional");

       toast({title: "Profissional atualizado com sucesso."});
      // Redirecionar para a página de detalhes do profissional ou outra página
      router.push(`/profissionais/${profissionalid}`);

    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
      toast({title: "Erro ao atualizar profissional.", variant: "destructive", duration: 5000});
    }
  };

  const handleSubmit = async (data: FormData) => {
    // Removida validação de unidade única
    // if (!selectedUnidade) { /* ... */ }

    try {
      if (profissionalid) {
        await updateProfissional(data);
      } else {
        await createProfissional(data);
      }
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
       toast({title: "Erro ao salvar profissional.", variant: "destructive", duration: 5000});
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
          {/* Ajustar o Link para voltar para a lista de profissionais */}
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

            {/* A lógica de múltiplas unidades será adicionada na página de edição */}
            {/* <h2 className="mt-6 text-xl font-semibold">Unidade de Saúde</h2> */}
            {/* Removido o FormField de unidade única */}


            <Button type="submit" className="mt-6 justify-center">
              Salvar
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
