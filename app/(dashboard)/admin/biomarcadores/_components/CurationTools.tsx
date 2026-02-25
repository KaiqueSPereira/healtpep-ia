'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import {
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { ComboboxForm } from './ComboboxForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog"

// Schemas for form validation
const unifySchema = z.object({
  sourceName: z.string().min(1, 'O biomarcador de origem é obrigatório.'),
  targetName: z.string().min(1, 'O biomarcador de destino é obrigatório.'),
});

const renameBiomarkerSchema = z.object({
  oldName: z.string().min(1, 'O nome atual do biomarcador é obrigatório.'),
  newName: z.string().min(1, 'O novo nome do biomarcador é obrigatório.'),
});

const renameCategorySchema = z.object({
    oldCategory: z.string().min(1, 'A categoria atual é obrigatória.'),
    newCategory: z.string().min(1, 'A nova categoria é obrigatória.'),
});

const deleteCategorySchema = z.object({
    categoryToDelete: z.string().min(1, 'A categoria a ser deletada é obrigatória.'),
});

interface CurationToolsProps {
  categories: string[];
  allBiomarkers: string[];
  onCuration: () => void;
}

export function CurationTools({ categories, allBiomarkers, onCuration }: CurationToolsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Multiple forms for each action
  const unifyForm = useForm<z.infer<typeof unifySchema>>({ resolver: zodResolver(unifySchema), defaultValues: { sourceName: '', targetName: '' } });
  const renameBiomarkerForm = useForm<z.infer<typeof renameBiomarkerSchema>>({ resolver: zodResolver(renameBiomarkerSchema), defaultValues: { oldName: '', newName: '' } });
  const renameCategoryForm = useForm<z.infer<typeof renameCategorySchema>>({ resolver: zodResolver(renameCategorySchema), defaultValues: { oldCategory: '', newCategory: '' } });
  const deleteCategoryForm = useForm<z.infer<typeof deleteCategorySchema>>({ resolver: zodResolver(deleteCategorySchema), defaultValues: { categoryToDelete: '' } });

  const handleApiCall = async (action: string, values: Record<string, any>, successMessage: string, form: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsLoading(true);
    try {
      const res = await fetch('/api/exames/biomarcadores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, action }),
      });
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Falha na operação de curadoria.');
      }
      const result = await res.json();
      toast({ title: 'Sucesso!', description: `${successMessage} (${result.count} registros afetados).`, variant: 'success' });
      form.reset();
      onCuration();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro na Operação', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (values: z.infer<typeof deleteCategorySchema>) => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/exames/biomarcadores?category=${encodeURIComponent(values.categoryToDelete)}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const errorData = await res.text();
            throw new Error(errorData || 'Falha ao deletar a categoria.');
        }

        const result = await res.json();
        toast({ title: 'Sucesso!', description: result.message, variant: 'success' });
        deleteCategoryForm.reset();
        onCuration();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        toast({ title: 'Erro ao Deletar', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ferramentas de Curadoria Avançada</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="unify">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unify">Unificar Marcadores</TabsTrigger>
            <TabsTrigger value="rename_biomarker">Renomear Marcador</TabsTrigger>
            <TabsTrigger value="manage_category">Gerenciar Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="unify" className="mt-6">
            <Form {...unifyForm}>
              <form onSubmit={unifyForm.handleSubmit((v) => handleApiCall('unify', v, `Marcadores unificados de '${v.sourceName}' para '${v.targetName}'`, unifyForm))} className="space-y-6">
                 <FormDescription>Combine um biomarcador de origem com um de destino. Todos os exames com o nome de origem serão atualizados.</FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <ComboboxForm form={unifyForm} name="sourceName" label="Biomarcador de Origem" placeholder="Selecione para substituir" options={allBiomarkers} />
                  <ComboboxForm form={unifyForm} name="targetName" label="Biomarcador de Destino" placeholder="Selecione o nome padrão" options={allBiomarkers} />
                </div>
                <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Unificar</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="rename_biomarker" className="mt-6">
            <Form {...renameBiomarkerForm}>
              <form onSubmit={renameBiomarkerForm.handleSubmit((v) => handleApiCall('rename_biomarker', { oldName: v.oldName, newName: v.newName }, `Marcador '${v.oldName}' renomeado para '${v.newName}'`, renameBiomarkerForm))} className="space-y-6">
                <FormDescription>Renomeie o nome padronizado de um biomarcador em todas as regras de curadoria.</FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <ComboboxForm form={renameBiomarkerForm} name="oldName" label="Nome Atual do Marcador" placeholder="Selecione o marcador" options={allBiomarkers} />
                    <FormField control={renameBiomarkerForm.control} name="newName" render={({ field }) => (<FormItem><FormLabel>Novo Nome do Marcador</FormLabel><FormControl><Input placeholder="Digite o novo nome" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Renomear</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="manage_category" className="mt-6 space-y-10">
            <div>
                <h3 className="text-lg font-medium">Renomear Categoria</h3>
                <Form {...renameCategoryForm}>
                <form onSubmit={renameCategoryForm.handleSubmit((v) => handleApiCall('rename_category', v, `Categoria '${v.oldCategory}' renomeada para '${v.newCategory}'`, renameCategoryForm))} className="space-y-6 mt-2">
                    <FormDescription>Renomeie uma categoria existente. Todos os biomarcadores associados serão atualizados.</FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <ComboboxForm form={renameCategoryForm} name="oldCategory" label="Categoria Atual" placeholder="Selecione a categoria" options={categories} />
                        <FormField control={renameCategoryForm.control} name="newCategory" render={({ field }) => (<FormItem><FormLabel>Novo Nome da Categoria</FormLabel><FormControl><Input placeholder="Digite o novo nome" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Renomear Categoria</Button>
                </form>
                </Form>
            </div>
            <div className="pt-6 border-t">
                 <h3 className="text-lg font-medium">Apagar Categoria</h3>
                <Form {...deleteCategoryForm}>
                <form onSubmit={deleteCategoryForm.handleSubmit(handleDeleteCategory)} className="space-y-6 mt-2">
                    <FormDescription>Delete uma categoria. Os biomarcadores serão movidos para &quot;Pendente&quot;. A categoria &quot;Pendente&quot; não pode ser deletada.</FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                         <ComboboxForm form={deleteCategoryForm} name="categoryToDelete" label="Categoria para Apagar" placeholder="Selecione a categoria" options={categories.filter(c => c !== 'Pendente')} />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading || !deleteCategoryForm.watch("categoryToDelete")}><Trash2 className="mr-2 h-4 w-4"/>Apagar Categoria</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A categoria <strong>{deleteCategoryForm.watch("categoryToDelete")}</strong> será apagada. Todos os biomarcadores nela contidos serão movidos para a categoria &quot;Pendente&quot;. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteCategoryForm.handleSubmit(handleDeleteCategory)}>Confirmar e Apagar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </form>
                </Form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
