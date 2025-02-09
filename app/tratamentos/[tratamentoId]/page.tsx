"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // đź”ą Importando o router para redirecionamento
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
import Footer from "@/app/_components/footer";
import { toast } from "@/app/_hooks/use-toast";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import { Profissional } from "@/app/_components/types";

type TratamentoForm = {
  nome: string;
  profissionalId: string;
  userId: string;
};

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
      userId: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  useEffect(() => {
    async function fetchProfissionais() {
      try {
        const response = await fetch("/api/profissional");
        if (!response.ok) throw new Error("Erro ao buscar profissionais.");
        const data = await response.json();
        console.log("Profissionais carregados:", data);
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
    if (!session?.user?.id) {
      console.error("Usuário não autenticado.");
      toast({
        title: "Usuário não autenticado.",
        status: "error",
      });
      return;
    }

    try {
      const tratamentoData = {
        ...data,
        userId: session.user.id,
        profissionalId: selectedProfissional?.id || "",
      };

      const response = await fetch("/api/tratamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tratamentoData),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Erro desconhecido.");
      }

      console.log("Tratamento salvo com sucesso.");
      toast({
        title: "Tratamento salvo com sucesso.",
        status: "success",
      });

      form.reset();
      setSelectedProfissional(null);

      // đź”ą Redireciona para a tela inicial apĂłs 1 segundo
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar o tratamento:", error);
      toast({
        title: "Ocorreu um erro ao salvar o tratamento.",
        status: "error",
      });
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
                        Nenhum profissional disponĂ­vel.
                      </p>
                    )}
                  </FormControl>
                </FormItem>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewTratamento;
