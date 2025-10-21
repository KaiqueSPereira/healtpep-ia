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
import { EnderecosDialog } from '@/app/enderecos/_components/enderecosdialog';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  tipo: z.enum(['Clinica', 'Hospital', 'Laboratorio'], { required_error: 'Tipo é obrigatório' }),
  enderecoId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const NovaUnidadePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEnderecoDialogOpen, setIsEnderecoDialogOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', tipo: 'Clinica' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        // CORRECTED: 'error' variable is now used or removed
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar unidade');
      }
      toast({ title: "Sucesso!", description: "Unidade de saúde criada." });
      router.push('/unidades');
    } catch (err) {
       // CORRECTED: Renamed to 'err' to avoid shadowing
       toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEnderecoSave = (endereco: { id: string }) => {
      form.setValue('enderecoId', endereco.id);
  }

  return (
    <>
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Nova Unidade de Saúde</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-4">
            <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome da Unidade</FormLabel><FormControl><Input placeholder="Ex: Clínica Bem-Estar" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="tipo" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Unidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Clinica">Clínica</SelectItem>
                            <SelectItem value="Hospital">Hospital</SelectItem>
                            <SelectItem value="Laboratorio">Laboratório</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <div>
                <Button type="button" variant="outline" onClick={() => setIsEnderecoDialogOpen(true)}>
                    {form.getValues('enderecoId') ? "Ver/Editar Endereço" : "Adicionar Endereço"}
                </Button>
                {form.getValues('enderecoId') && <p className='text-sm text-gray-500 mt-2'>Endereço associado.</p>}
             </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Unidade'}
            </Button>
          </form>
        </Form>
      </main>
      <EnderecosDialog 
        isOpen={isEnderecoDialogOpen} 
        onClose={() => setIsEnderecoDialogOpen(false)} 
        onSave={handleEnderecoSave} 
      />
    </>
  );
};

export default NovaUnidadePage;
