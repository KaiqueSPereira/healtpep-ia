'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from '@/app/_hooks/use-toast';

import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Calendar } from '@/app/_components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { format } from 'date-fns';

import { Profissional } from '@/app/_components/types';
import MenuProfissionais from '@/app/profissionais/_components/menuprofissionais';


const formSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  objetivo: z.string().optional(),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  cidCodigo: z.string().optional(),
  cidDescricao: z.string().optional(),
  observacoes: z.string().optional(),
  profissionalId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const NovoTratamentoPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      objetivo: '',
      dataInicio: new Date(),
      cidCodigo: '',
      cidDescricao: '',
      observacoes: '',
      profissionalId: undefined,
    },
  });

  useEffect(() => {
    const fetchProfissionais = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await fetch(`/api/profissionais?userId=${session.user.id}`);
        if (!response.ok) throw new Error('Falha ao carregar profissionais');
        // CORRECTED: Type assertion for the fetched data
        const data: Profissional[] = await response.json();
        setProfissionais(data);
      } catch (error) {
        console.error(error);
        toast({ title: "Erro ao carregar profissionais", variant: "destructive" });
      }
    };
    fetchProfissionais();
  }, [session]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!session) {
      toast({ title: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/tratamento', { // Ensure this API route exists and is correct
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: session.user.id }),
      });

      if (!response.ok) {
        // CORRECTED: Type assertion for the error response
        const errorData: { error: string } = await response.json();
        throw new Error(errorData.error || 'Falha ao criar tratamento.');
      }

      toast({ title: "Tratamento criado com sucesso!" });
      router.push('/tratamentos'); // Ensure this route exists
    } catch (error) {
      console.error('Erro ao submeter formulário', error);
      // CORRECTED: Type assertion for the caught error
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Adicionar Novo Tratamento</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome do Tratamento</FormLabel><FormControl><Input placeholder="Ex: Fisioterapia para joelho" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="objetivo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Objetivo</FormLabel><FormControl><Input placeholder="Ex: Recuperar mobilidade" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="dataInicio" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><>{field.value ? format(field.value, "PPP") : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            <FormField name="profissionalId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Profissional Responsável (Opcional)</FormLabel><MenuProfissionais profissionais={profissionais} onProfissionalSelect={(p) => { field.onChange(p?.id); setSelectedProfissional(p); }} selectedProfissional={selectedProfissional} /><FormMessage /></FormItem>)} />
            <FormField name="cidCodigo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Código CID (Opcional)</FormLabel><FormControl><Input placeholder="Ex: M23" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="cidDescricao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição do CID (Opcional)</FormLabel><FormControl><Input placeholder="Ex: Transtornos internos do joelho" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="observacoes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre o tratamento..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Tratamento'}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default NovoTratamentoPage;
