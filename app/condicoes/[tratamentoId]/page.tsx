"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import Header from "@/app/_components/header";
import { toast } from "@/app/_hooks/use-toast";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import { Profissional } from "@/app/_components/types";

type TratamentoForm = {
  nome: string;
  profissionalId: string;
};
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
const NewTratamento: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);

  const form = useForm<TratamentoForm>({
    defaultValues: {
      nome: "",
      profissionalId: "",
    },
  });

  // 🔹 Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  // 🔹 Busca os profissionais disponíveis
  useEffect(() => {
    async function fetchProfissionais() {
      try {
        const response = await fetch("/api/profissionais");
        if (!response.ok) throw new Error("Erro ao buscar profissionais.");
        const data = await response.json();
        setProfissionais(data || []);
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        setProfissionais([]);
      }
    }
    fetchProfissionais();
  }, []);

  if (status === "loading") {
    return <div>Carregando...</div>;
  }

  const handleSubmit = async (data: TratamentoForm) => {
    if (!session?.user) {
      toast({title:"Usuário não autenticado.", variant: "destructive", duration: 5000});
      return;
    }

    try {
      const tratamentoData = {
        ...data,
        profissionalId: selectedProfissional?.id || "",
      };

      const response = await fetch("/api/tratamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`, // ✅ Enviando o token JWT
        },
        body: JSON.stringify(tratamentoData),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Erro desconhecido.");
      }

      console.log("Tratamento salvo com sucesso.");
        toast({title:"Tratamento salvo com sucesso.", variant: "default", duration: 5000});

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar o tratamento:", error);
      toast({title:"Ocorreu um erro ao salvar o tratamento.", variant: "destructive",duration: 5000});
    }
  };

  return (
    <div>
      <Header />
      <div className="flex items-center justify-center">
        <div className="container mx-auto p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <label>Nome do Tratamento:</label>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          placeholder="Nome do tratamento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <label>Profissional:</label>
                  <FormControl>
                    {profissionais.length > 0 ? (
                      <MenuProfissionais
                        profissionais={profissionais}
                        selectedProfissional={selectedProfissional}
                        onProfissionalSelect={setSelectedProfissional}
                      />
                    ) : (
                      <p className="text-gray-500">
                        Nenhum profissional disponível.
                      </p>
                    )}
                  </FormControl>
                </FormItem>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <Button type="submit" variant="default">
                  Salvar Tratamento
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default NewTratamento;
