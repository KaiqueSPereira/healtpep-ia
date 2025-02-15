"use client";

import { useEffect } from "react";
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

type EnderecoForm = {
  CEP: string;
  numero: string; // Mantém como string para facilitar no formulário
  rua: string;
  bairro: string;
  municipio: string;
  UF: string;
  nome: string;
};

const EnderecoDialog: React.FC = () => {
  const { data: session, status } = useSession(); // Verifica se o usuário está autenticado
  const form = useForm<EnderecoForm>({
    defaultValues: {
      CEP: "",
      numero: "",
      rua: "",
      bairro: "",
      municipio: "",
      UF: "",
      nome: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(); // Redireciona para a página de login caso o usuário não esteja autenticado
    }
  }, [status]);

  if (status === "loading") {
    return <div>Carregando...</div>;
  }

  // Função para salvar o endereço
  const handleSubmit = async (data: EnderecoForm) => {
    if (!session?.user?.id) {
      console.error("Usuário não autenticado.");
      toast({
        title: "Usuário não autenticado.",
        type: "foreground",
      });
      return;
    }

    try {
      const payload = {
        ...data,
        numero: parseInt(data.numero, 10), // Converte o número para Int
        userId: session.user.id, // Associa o endereço ao usuário autenticado
      };

      const response = await fetch("/api/enderecos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar o endereço.");
      }

      toast({
        title: "Endereço salvo com sucesso!",
        type: "foreground",
      });
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar o endereço:", error);
      toast({
        title: "Erro ao salvar o endereço",
        type: "foreground",
      });
    }
  };

  // Função para consultar o CEP
  const checkCEP = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) {
            alert("CEP não encontrado!");
          } else {
            form.setValue("rua", data.logradouro);
            form.setValue("bairro", data.bairro);
            form.setValue("municipio", data.localidade);
            form.setValue("UF", data.uf);
          }
        })
        .catch((error) => {
          console.error("Erro ao consultar o CEP:", error);
          toast({
            title: "Erro ao consultar o CEP",
            type: "foreground",
          });
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
                  name="CEP"
                  render={({ field }) => (
                    <FormItem>
                      <label>CEP:</label>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={checkCEP}
                          required
                          placeholder="Digite o CEP"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <label>Nome:</label>
                      <FormControl>
                        <Input {...field} required placeholder="Nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem className="flex-[45%]">
                        <label>Rua:</label>
                        <FormControl>
                          <Input {...field} required placeholder="Rua" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem className="flex-[10%]">
                        <label>Número:</label>
                        <FormControl>
                          <Input
                            {...field}
                            required
                            placeholder="Número"
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem className="flex-[45%]">
                        <label>Bairro:</label>
                        <FormControl>
                          <Input {...field} required placeholder="Bairro" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem className="flex-[90%]">
                        <label>Município:</label>
                        <FormControl>
                          <Input {...field} required placeholder="Município" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="UF"
                    render={({ field }) => (
                      <FormItem className="flex-[10%]">
                        <label>UF:</label>
                        <FormControl>
                          <Input {...field} required placeholder="UF" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <Button type="submit" variant="default">
                  Salvar
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

export default EnderecoDialog;
