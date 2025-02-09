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

interface DescriptionEditorProps {
  descricao: string;
  consultaId: string;
}

const formSchema = z.object({
  queixas: z
    .string()
    .min(1, { message: "A descriĂ§ĂŁo nĂŁo pode estar vazia" }),
});

const DescriptionEditor = ({
  descricao,
  consultaId,
}: DescriptionEditorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { queixas: descricao },
  });

  const handleSaveDescricao = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(`/api/consultas/${consultaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("registro salvo com sucesso!");
        setIsDialogOpen(false);
        router.refresh();
      } else {
        alert("Erro ao salvar o registro. Tente novamente.");
      }
    } catch {
      alert("Erro ao salvar o registro. Tente novamente.");
    }
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
                name="queixas"
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
                  onClick={() => form.reset({ queixas: descricao })}
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
