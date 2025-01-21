"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { getSession } from "next-auth/react"; // Importando o getSession do next-auth

type EnderecoForm = {
  CEP: string;
  numero: number;
  rua: string;
  bairro: string;
  municipio: string;
  UF: string;
  nome: string;
};

type EnderecoDialogProps = {
  onSave: (data: EnderecoForm) => void;
};

const EnderecoDialog: React.FC<EnderecoDialogProps> = ({ onSave }) => {
  const [open, setOpen] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false); // Variável para verificar se o usuário está logado
  const form = useForm<EnderecoForm>({
    defaultValues: {
      CEP: "",
      numero: 0,
      rua: "",
      bairro: "",
      municipio: "",
      UF: "",
      nome: "",
    },
  });

  // Função chamada ao submeter o formulário
  const handleSubmit = (data: EnderecoForm) => {
    onSave(data); // Envia o endereço criado ao componente pai
    form.reset(); // Limpa o formulário
    setOpen(false); // Fecha o diálogo
  };

  // Função para verificar o CEP e preencher os campos
  const checkCEP = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, ""); // Remove qualquer caractere não numérico
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) {
            alert("CEP não encontrado!");
          } else {
            // Preenche os campos com os dados retornados pela API
            form.setValue("rua", data.logradouro);
            form.setValue("bairro", data.bairro);
            form.setValue("municipio", data.localidade);
            form.setValue("UF", data.uf);
          }
        })
        .catch((error) => {
          console.error("Erro ao consultar CEP:", error);
          alert("Erro ao consultar o CEP.");
        });
    }
  };

  useEffect(() => {
    // Verifica se o usuário está logado assim que o componente é montado
    const checkUserSession = async () => {
      const session = await getSession();
      if (session && session.user) {
        setUserLoggedIn(true); // Se o usuário estiver logado, define como true
      } else {
        setUserLoggedIn(false); // Se o usuário não estiver logado, define como false
      }
    };

    checkUserSession();
  }, []);

  if (!userLoggedIn) {
    return (
      <div>
        <p>Você precisa estar logado para adicionar um endereço.</p>
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/login")}
        >
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Adicionar Novo Endereço</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Endereço</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
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
              name="numero"
              render={({ field }) => (
                <FormItem>
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
              name="rua"
              render={({ field }) => (
                <FormItem>
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
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <label>Bairro:</label>
                  <FormControl>
                    <Input {...field} required placeholder="Bairro" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
                  <label>UF:</label>
                  <FormControl>
                    <Input {...field} required placeholder="UF" />
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
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EnderecoDialog;
