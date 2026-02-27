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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Loader2, PlusCircle, Ruler, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/_hooks/use-toast';

const formSchema = z.object({
  // Medidas Corporais
  peso: z.string().optional(),
  pescoco: z.string().optional(),
  torax: z.string().optional(),
  cintura: z.string().optional(),
  quadril: z.string().optional(),
  bracoE: z.string().optional(),
  bracoD: z.string().optional(),
  pernaE: z.string().optional(),
  pernaD: z.string().optional(),
  pantE: z.string().optional(),
  pantD: z.string().optional(),

  // Bioimpedância
  gorduraCorporal: z.string().optional(),
  massaMuscular: z.string().optional(),
  gorduraVisceral: z.string().optional(),
  taxaMetabolica: z.string().optional(),
  idadeCorporal: z.string().optional(),
  massaOssea: z.string().optional(),
  aguaCorporal: z.string().optional(),
});

interface AddMedidasDialogProps {
  onDataAdded: () => void;
}

const AddMedidasDialog = ({ onDataAdded }: AddMedidasDialogProps) => {
  const { id: userId } = useParams();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}/medidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar medidas');
      }

      toast({ title: 'Sucesso', description: 'Novas medidas adicionadas.' });
      onDataAdded();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to submit data', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as medidas.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Medidas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novas Medidas</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo com as novas medidas corporais e/ou resultados de bioimpedância.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="medidas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="medidas"><Ruler className="mr-2 h-4 w-4" />Medidas Corporais</TabsTrigger>
                <TabsTrigger value="bioimpedancia"><Zap className="mr-2 h-4 w-4"/>Bioimpedância</TabsTrigger>
              </TabsList>
              <TabsContent value="medidas" className="py-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="peso" render={({ field }) => <FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pescoco" render={({ field }) => <FormItem><FormLabel>Pescoço (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="torax" render={({ field }) => <FormItem><FormLabel>Tórax (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="cintura" render={({ field }) => <FormItem><FormLabel>Cintura (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="quadril" render={({ field }) => <FormItem><FormLabel>Quadril (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="bracoD" render={({ field }) => <FormItem><FormLabel>Braço D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="bracoE" render={({ field }) => <FormItem><FormLabel>Braço E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pernaD" render={({ field }) => <FormItem><FormLabel>Perna D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pernaE" render={({ field }) => <FormItem><FormLabel>Perna E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pantD" render={({ field }) => <FormItem><FormLabel>Panturrilha D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="pantE" render={({ field }) => <FormItem><FormLabel>Panturrilha E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                </div>
              </TabsContent>
              <TabsContent value="bioimpedancia" className="py-4">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="gorduraCorporal" render={({ field }) => <FormItem><FormLabel>% Gordura Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="massaMuscular" render={({ field }) => <FormItem><FormLabel>Massa Muscular (kg)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="gorduraVisceral" render={({ field }) => <FormItem><FormLabel>Gordura Visceral</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="taxaMetabolica" render={({ field }) => <FormItem><FormLabel>Taxa Metabólica (kcal)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="idadeCorporal" render={({ field }) => <FormItem><FormLabel>Idade Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="massaOssea" render={({ field }) => <FormItem><FormLabel>Massa Óssea (kg)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="aguaCorporal" render={({ field }) => <FormItem><FormLabel>% Água Corporal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                 </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Medidas
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedidasDialog;
