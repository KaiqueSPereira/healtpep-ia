"use client";

import { useState} from "react";
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
import { toast } from "@/app/_hooks/use-toast";

type EnderecoForm = {
  CEP: string;
  numero: number;
  rua: string;
  bairro: string;
  municipio: string;
  UF: string;
  nome: string;
};

const EnderecoDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
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

  // Função para salvar o endereço
  const handleSubmit = async (data: EnderecoForm) => {
    try {
      const response = await fetch("/api/enderecos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o endereço.");
      }

      toast("Endereço salvo com sucesso!","foreground", 
      { duration: 5000 });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast( "Erro ao salvar o endereço.", "foreground",
      { duration: 5000 });
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
            toast("CEP não encontrado!", "foreground",
            { duration: 5000 });
          } else {
            form.setValue("rua", data.logradouro);
            form.setValue("bairro", data.bairro);
            form.setValue("municipio", data.localidade);
            form.setValue("UF", data.uf);
          }
        })
        .catch((error) => {
          console.error("Erro ao consultar CEP:", error);
          toast("Erro ao consultar CEP", "foreground",
          { duration: 5000 });
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Adicionar Novo Endereço</Button>
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
              <Button type="submit" variant="default">
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
