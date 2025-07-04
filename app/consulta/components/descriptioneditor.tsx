"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Textarea } from "@/app/_components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/app/_hooks/use-toast";

interface DescriptionEditorProps {
  descricao: string;
  consultaId: string;
}

const formSchema = z.object({
  motivo: z
    .string()
    .min(1, { message: "A descricão da consulta não pode estar vazia" }),
});

const DescriptionEditor = ({
  descricao,
  consultaId,
}: DescriptionEditorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { motivo: descricao },
  });

  const handleSaveDescricao = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("Registro salvo com sucesso!");
        toast({ 
 title: "Registro salvo com sucesso!",
 variant: "default", 
 duration: 5000,
        });
        setIsDialogOpen(false);
        router.refresh();
      } else {
        console.error("Erro ao salvar o registro. Tente novamente.");
        
        toast({ 
 title: "Erro ao salvar o registro. Tente novamente.",
 variant: "destructive", // Alterado de "error" para "destructive"
        });
      }
    } catch {
      console.error("Erro ao salvar o registro. Tente novamente.");
      toast({
        title: "Erro ao salvar o registro.",
        variant: "destructive", // Alterado de "error" para "destructive"
        duration: 5000,
      });
    }
  };

  const handleCancel = () => {
    form.reset({ motivo: descricao });
    setIsDialogOpen(false);
  };
  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="mt-3">
            {descricao ? "Editar Registro" : "Fazer anotação"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {descricao ? "Editar Registro" : "Fazer anotação"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveDescricao)}>
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Textarea
                        placeholder="Escreva aqui as dados sobre a consulta..."
                        {...field}
                        className="mt-2 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCancel}
                  disabled={form.formState.isSubmitting} // Desabilitar durante o envio
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DescriptionEditor;
