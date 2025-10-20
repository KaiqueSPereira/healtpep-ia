'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Form, useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import { useToast } from '@/app/_hooks/use-toast';
import { Profissional } from '@/app/_components/types';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import Header from '@/app/_components/header';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/app/_components/ui/form';
import { Textarea } from '@/app/_components/ui/textarea';
import MenuProfissionais from '@/app/profissionais/_components/menuprofissionais';
import { Input } from '@/app/_components/ui/input';

type CondicaoSaudeForm = {
  nome: string;
  objetivo: string;
  dataInicio: string;
  observacoes: string;
  cidCodigo: string;
  cidDescricao: string;
};

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

interface CidOption {
  value: string; // cidCodigo
  label: string; // cidDescricao
  codigo: string;
  descricao: string;
}

export default function NewCondicaoSaudePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const userId = searchParams.get('userId');

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<CondicaoSaudeForm>({
    defaultValues: {
      nome: '',
      objetivo: '',
      dataInicio: '',
      observacoes: '',
      cidCodigo: '',
      cidDescricao: '',
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
    }
  }, [status]);

  useEffect(() => {
    async function fetchProfissionais() {
      if (status !== 'authenticated') return;
      try {
        const response = await fetch('/api/profissionais');
        if (!response.ok) throw new Error('Erro ao buscar profissionais.');
        const data = await response.json();
        setProfissionais(data || []);
      } catch (error: any) {
        toast({ title: 'Erro ao buscar profissionais', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    fetchProfissionais();
  }, [status, toast]);

  const loadCidOptions = async (inputValue: string): Promise<CidOption[]> => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const response = await fetch(`/api/cid/search?query=${inputValue}`);
      const data = await response.json();
      return data.map((cid: any) => ({
        value: cid.codigo,
        label: `${cid.codigo} - ${cid.descricao}`,
        codigo: cid.codigo,
        descricao: cid.descricao,
      }));
    } catch (error) {
      console.error('Erro ao buscar CID', error);
      return [];
    }
  };

  const handleSubmit = async (data: CondicaoSaudeForm) => {
    if (!session?.user || !userId) {
      toast({ title: 'Erro', description: 'Autenticação ou ID do paciente em falta.', variant: 'destructive' });
      return;
    }

    try {
        const condicaoData = {
            ...data,
            profissionalId: selectedProfissional?.id || null,
        };

      const response = await fetch(`/api/pacientes/dashboard/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(condicaoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar condição de saúde.');
      }

      toast({ title: 'Sucesso', description: 'Condição de saúde salva com sucesso.' });
      router.push(`/users/${userId}`);

    } catch (error: any) {
      toast({ title: 'Erro ao Salvar', description: error.message, variant: 'destructive' });
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (!userId) {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <p className="text-red-600">ID do paciente não encontrado.</p>
            <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Adicionar Nova Condição de Saúde</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  rules={{ required: 'O nome é obrigatório.' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Condição <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Ex: Diabetes Tipo 2" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                  <FormLabel>Pesquisar CID</FormLabel>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadCidOptions}
                    onChange={(option) => {
                      const cidOption = option as CidOption;
                      form.setValue('cidCodigo', cidOption.codigo);
                      form.setValue('cidDescricao', cidOption.descricao);
                    }}
                    placeholder="Digite para buscar o CID..."
                  />
                </FormItem>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cidCodigo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Código CID</FormLabel>
                            <FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="cidDescricao"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrição CID</FormLabel>
                            <FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="dataInicio"
                  rules={{ required: 'A data de início é obrigatória.' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início/Diagnóstico <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input {...field} type="date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo</FormLabel>
                      <FormControl><Input {...field} placeholder="Ex: Controle glicêmico" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Profissional Responsável (Opcional)</FormLabel>
                  <FormControl>
                    <MenuProfissionais
                        profissionais={profissionais}
                        selectedProfissional={selectedProfissional}
                        onProfissionalSelect={setSelectedProfissional}
                      />
                  </FormControl>
                </FormItem>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Notas relevantes sobre a condição..."/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
