'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Loader2, PlusCircle, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/_hooks/use-toast';

const formSchema = z.object({
  gorduraCorporal: z.string().optional(),
  massaMuscular: z.string().optional(),
  gorduraVisceral: z.string().optional(),
  taxaMetabolica: z.string().optional(),
  idadeCorporal: z.string().optional(),
  massaOssea: z.string().optional(),
  aguaCorporal: z.string().optional(),
  data: z.string().nonempty({ message: "Data é obrigatória" }),
});

interface AddBioimpedanciaDialogProps {
  onDataAdded: () => void;
}

const AddBioimpedanciaDialog = ({ onDataAdded }: AddBioimpedanciaDialogProps) => {
  const { id: userId } = useParams();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { data: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(`/api/users/${userId}/medidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, type: 'bioimpedancia' }),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar bioimpedância');
      }

      toast({ title: 'Sucesso', description: 'Novos dados de bioimpedância adicionados.' });
      onDataAdded();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to submit data', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar os dados.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Bioimpedância
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Bioimpedância</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo com os resultados do exame de bioimpedância.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="data" render={({ field }) => <FormItem><FormLabel>Data do Exame</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="gorduraCorporal" render={({ field }) => <FormItem><FormLabel>% Gordura Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="massaMuscular" render={({ field }) => <FormItem><FormLabel>Massa Muscular (kg)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="gorduraVisceral" render={({ field }) => <FormItem><FormLabel>Gordura Visceral</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="taxaMetabolica" render={({ field }) => <FormItem><FormLabel>Taxa Metabólica (kcal)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="idadeCorporal" render={({ field }) => <FormItem><FormLabel>Idade Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="massaOssea" render={({ field }) => <FormItem><FormLabel>Massa Óssea (kg)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="aguaCorporal" render={({ field }) => <FormItem><FormLabel>% Água Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBioimpedanciaDialog;
