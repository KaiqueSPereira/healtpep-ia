'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/app/_hooks/use-toast';
import { useDebounce } from '@/app/_hooks/use-debounce';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/app/_components/ui/command';
import { CalendarIcon, Loader2, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface CidSearchResult {
  codigo: string;
  descricao: string;
}

const formSchema = z.object({
  nome: z.string().min(2, "O nome da condição é obrigatório."),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  cidCodigo: z.string().optional(),
  cidDescricao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const NovaCondicaoDeSaudePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cidQuery, setCidQuery] = useState('');
  const [cidResults, setCidResults] = useState<CidSearchResult[]>([]);
  const [isCidLoading, setIsCidLoading] = useState(false);
  const [isCidPopoverOpen, setIsCidPopoverOpen] = useState(false);
  const debouncedCidQuery = useDebounce(cidQuery, 300);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', dataInicio: new Date(), cidCodigo: '', cidDescricao: '', observacoes: '' },
  });

  useEffect(() => {
    if (debouncedCidQuery.length < 2) {
      setCidResults([]);
      return;
    }
    const fetchCid = async () => {
      setIsCidLoading(true);
      try {
        const response = await fetch(`/api/cid/search?term=${debouncedCidQuery}`);
        if (!response.ok) throw new Error('A pesquisa de CID falhou.');
        const data = await response.json();
        setCidResults(data || []);
      } catch (error) {
        console.error("Erro ao buscar CID", error);
        setCidResults([]);
        toast({ title: "Erro de Rede", description: "Não foi possível buscar os códigos CID.", variant: "destructive" });
      } finally {
        setIsCidLoading(false);
      }
    };
    fetchCid();
  }, [debouncedCidQuery]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!userId) {
      toast({ title: "Erro", description: "ID do usuário não fornecido.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/condicoes', { // <-- CORREÇÃO APLICADA AQUI
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: userId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Falha ao criar condição.');
      toast({ title: "Condição de saúde criada com sucesso!" });
      router.push(`/users/${userId}`);
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro.';
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>ID do usuário não encontrado. Por favor, acesse esta página a partir do perfil de um usuário.</p>
        <Link href="/"><Button variant="link">Voltar à página inicial</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Button asChild variant="outline" size="sm" className="mb-4">
              <Link href={`/users/${userId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Perfil
              </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Condição de Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Nome da Condição (pesquisável)</FormLabel><Popover open={isCidPopoverOpen} onOpenChange={setIsCidPopoverOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{field.value || "Selecione ou digite o nome da condição"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0"><Command shouldFilter={false}><CommandInput placeholder="Digite para pesquisar (Ex: Asma, Diabetes...)" onValueChange={setCidQuery} /><CommandList><CommandEmpty>{isCidLoading ? 'Pesquisando...' : 'Nenhum resultado encontrado.'}</CommandEmpty><CommandGroup>{cidResults.map((result) => (<CommandItem key={result.codigo} value={result.descricao} onSelect={() => {form.setValue("nome", result.descricao); form.setValue("cidCodigo", result.codigo); form.setValue("cidDescricao", result.descricao); setIsCidPopoverOpen(false);}}><Check className={cn("mr-2 h-4 w-4", result.descricao === field.value ? "opacity-100" : "opacity-0")} /><div><p className="font-semibold">{result.descricao}</p><p className="text-xs text-muted-foreground">{result.codigo}</p></div></CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField
                    name="dataInicio"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data do Diagnóstico</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'dd/MM/yyyy')
                                ) : (
                                  <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={ptBR}
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                            />
                            <div className="p-2 border-t">
                              <Input
                                type="text"
                                placeholder="Digite a data (dd/mm/aaaa)"
                                onChange={(e) => {
                                  const date = parse(e.target.value, 'dd/MM/yyyy', new Date());
                                  if (!isNaN(date.getTime())) {
                                    field.onChange(date);
                                  }
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField name="cidCodigo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Código CID</FormLabel><FormControl><Input placeholder="Preenchido automaticamente" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="cidDescricao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição do CID</FormLabel><FormControl><Input placeholder="Preenchido automaticamente" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="observacoes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais, como sintomas, estado atual..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Condição de Saúde'}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NovaCondicaoDeSaudePage;
