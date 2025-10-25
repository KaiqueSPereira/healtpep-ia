'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/_hooks/use-toast';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  tipo: z.enum(['Clinica', 'Hospital', 'Laboratorio', 'Pronto Socorro', 'Unidade Básica', 'Atenção Especialisada'], { required_error: 'Tipo é obrigatório' }),
  telefone: z.string().min(8, 'Telefone é obrigatório'),
  endereco: z.object({
    rua: z.string().min(1, 'Rua é obrigatória'),
    numero: z.string().min(1, 'Número é obrigatório'),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().min(2, 'Estado deve ter 2 caracteres').max(2),
    cep: z.string().min(8, 'CEP deve ter 8 caracteres'),
  })
});

type FormData = z.infer<typeof formSchema>;

const NovaUnidadePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo: 'Clinica',
      telefone: '',
      endereco: {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
      },
    },
  });

  const handleViaCepSearch = async () => {
    const cep = form.getValues("endereco.cep");
    if (cep.length === 8) {
      setLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          form.setValue('endereco.rua', data.logradouro);
          form.setValue('endereco.bairro', data.bairro);
          form.setValue('endereco.cidade', data.localidade);
          form.setValue('endereco.estado', data.uf);
        } else {
            toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
        toast({ title: "Erro", description: "Não foi possível buscar o CEP.", variant: "destructive" });
      }
      setLoading(false);
    }
  };


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/unidadesaude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar unidade');
      }
      toast({ title: "Sucesso!", description: "Unidade de saúde criada." });
      router.push('/unidades');
    } catch (err) {
       toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Nova Unidade de Saúde</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-4">
            <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome da Unidade</FormLabel><FormControl><Input placeholder="Ex: Clínica Bem-Estar" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="telefone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="Ex: 4002-8922" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="tipo" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Unidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Clinica">Clínica</SelectItem>
                            <SelectItem value="Hospital">Hospital</SelectItem>
                            <SelectItem value="Laboratorio">Laboratório</SelectItem>
                            <SelectItem value="Pronto Socorro">Pronto Socorro</SelectItem>
                            <SelectItem value="Unidade Básica">Unidade Básica</SelectItem>
                            <SelectItem value="Atenção Especialisada">Atenção Especialisada</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            <h2 className="text-xl font-bold border-t pt-4 mt-4">Endereço</h2>
            <div className="flex items-end gap-2">
                <FormField name="endereco.cep" control={form.control} render={({ field }) => (<FormItem className='flex-grow'><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="button" onClick={handleViaCepSearch} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}</Button>
            </div>
            <div className="flex items-end gap-2">
                <FormField name="endereco.rua" control={form.control} render={({ field }) => (<FormItem className='flex-grow'><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="endereco.numero" control={form.control} render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField name="endereco.bairro" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
                <FormField name="endereco.cidade" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="endereco.estado" control={form.control} render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Unidade'}
            </Button>
          </form>
        </Form>
      </main>
    </>
  );
};

export default NovaUnidadePage;
