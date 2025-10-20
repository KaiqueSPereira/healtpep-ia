
'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "@/app/_hooks/use-toast";
import { cn } from "@/app/_lib/utils";

import Header from "@/app/_components/header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/_components/ui/command";
import { Dialog } from "@/app/_components/ui/dialog";
import { Check, ChevronLeftIcon, Loader2, ChevronsUpDown, PlusCircle } from "lucide-react";

// Correctly import the type from the main types file
import { Endereco } from "@/app/_components/types";
// Import the refactored dialog component
import EnderecoDialog from "@/app/enderecos/_components/enderecosdialog";

// --- Zod Schema for Flat Form Validation ---
const formSchema = z.object({
  nome: z.string().min(1, "O nome da unidade é obrigatório."),
  tipo: z.string().min(1, "O tipo da unidade é obrigatório."),
  telefone: z.string().optional(),
  enderecoId: z.string({ required_error: "O endereço é obrigatório." }).min(1, "O endereço é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;

function UnidadeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeId = searchParams.get("unidadeid");
  const isEditMode = !!unidadeId;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isEnderecoPopoverOpen, setIsEnderecoPopoverOpen] = useState(false);
  const [isEnderecoDialogOpen, setIsEnderecoDialogOpen] = useState(false); // State for the new address dialog

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", tipo: "", telefone: "", enderecoId: "" },
  });

  const fetchEnderecos = async () => {
    try {
      const response = await fetch("/api/enderecos");
      if (!response.ok) throw new Error("Erro ao buscar endereços");
      const data = await response.json();
      setEnderecos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os endereços.", variant: "destructive" });
    }
  };

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
        setLoading(true);
        await fetchEnderecos();
        if (isEditMode) {
            try {
                const response = await fetch(`/api/unidadesaude/${unidadeId}`);
                if (!response.ok) throw new Error("Erro ao buscar unidade");
                const data = await response.json();
                form.reset({
                    nome: data.unidade?.nome || "",
                    tipo: data.unidade?.tipo || "",
                    telefone: data.unidade?.telefone || "",
                    enderecoId: data.unidade?.enderecoId || "",
                });
            } catch (error) {
                toast({ title: "Erro", description: "Não foi possível carregar os dados da unidade.", variant: "destructive" });
            }
        }
        setLoading(false);
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, unidadeId, form.reset]);


  const handleEnderecoCreated = async () => {
    toast({ title: "Sucesso", description: "Novo endereço criado. A lista foi atualizada." });
    await fetchEnderecos();
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/unidadesaude/${unidadeId}` : "/api/unidadesaude";
      const method = isEditMode ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} a unidade`);
      }

      toast({ title: `Unidade ${isEditMode ? 'atualizada' : 'criada'} com sucesso!` });
      router.push("/unidades");
      router.refresh();

    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Header />
      <div className="flex items-center p-5">
        <Button size="icon" variant="outline" asChild>
          <Link href="/unidades"><ChevronLeftIcon /></Link>
        </Button>
      </div>

      <div className="mx-auto my-8 max-w-2xl px-4">
        <h1 className="mb-8 text-center text-3xl font-bold">
          {isEditMode ? "Editar Unidade" : "Nova Unidade"}
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Unidade</FormLabel>
                  <FormControl><Input placeholder="Ex: Hospital Central" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo da Unidade</FormLabel>
                    <FormControl><Input placeholder="Ex: Clínica, Laboratório" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="enderecoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Endereço</FormLabel>
                  <Popover open={isEnderecoPopoverOpen} onOpenChange={setIsEnderecoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                          {field.value ? enderecos.find((e) => e.id === field.value)?.nome : "Selecione um Endereço"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar endereço..." />
                        <CommandList>
                          <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
                          <CommandGroup>
                            {enderecos.map((endereco) => (
                              <CommandItem value={endereco.nome} key={endereco.id} onSelect={() => { form.setValue("enderecoId", endereco.id); setIsEnderecoPopoverOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", endereco.id === field.value ? "opacity-100" : "opacity-0")} />
                                <div><p>{endereco.nome}</p><p className="text-xs text-muted-foreground">{endereco.rua}, {endereco.bairro}</p></div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup className="border-t">
                              <CommandItem onSelect={() => { setIsEnderecoPopoverOpen(false); setIsEnderecoDialogOpen(true); }}>
                                  <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Novo Endereço
                              </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Unidade')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      {/* --- Dialog for adding a new address --- */}
      <Dialog open={isEnderecoDialogOpen} onOpenChange={setIsEnderecoDialogOpen}>
        <EnderecoDialog 
            onOpenChange={setIsEnderecoDialogOpen} 
            onEnderecoCreated={handleEnderecoCreated}
        />
      </Dialog>
    </>
  );
}

export default function UnidadePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <UnidadeForm />
    </Suspense>
  );
}
