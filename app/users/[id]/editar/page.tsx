'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/app/_hooks/use-toast';
import { useSession } from 'next-auth/react';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Loader2 } from 'lucide-react';

// ATUALIZAÇÃO: Adiciona altura e ajusta data de nascimento para string
const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  cns: z.string().optional(),
  dataNascimento: z.string().optional(), // Alterado para string para aceitar input de data
  altura: z.string().optional(), // Novo campo para altura
  genero: z.string().optional(),
  tipo_sanguineo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// ATUALIZAÇÃO: Interface de dados inclui altura
interface UserData {
    name: string;
    email: string;
    cns?: string;
    dataNascimento?: string;
    altura?: number;
    genero?: string;
    tipo_sanguineo?: string;
}

const UserEditPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', cns: '', dataNascimento: '', altura: '' },
  });

  useEffect(() => {
    if (session?.user?.id !== id) {
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/pacientes/dashboard/${id}`);
        if (!response.ok) throw new Error('Falha ao carregar dados do usuário');
        
        const user: UserData = await response.json();
        
        form.setValue('name', user.name);
        form.setValue('email', user.email);
        if (user.cns) form.setValue('cns', user.cns);
        // ATUALIZAÇÃO: Formata a data para o formato YYYY-MM-DD que o input[type=date] espera
        if (user.dataNascimento) {
          const formattedDate = new Date(user.dataNascimento).toISOString().split('T')[0];
          form.setValue('dataNascimento', formattedDate);
        }
        if (user.altura) form.setValue('altura', String(user.altura));
        if (user.genero) form.setValue('genero', user.genero);
        if (user.tipo_sanguineo) form.setValue('tipo_sanguineo', user.tipo_sanguineo);

      } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, session, router, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
          const errorData: { error: string } = await response.json();
          throw new Error(errorData.error || 'Falha ao atualizar usuário.');
      }
      
      const updatedUser: { name?: string } = await response.json();

      if (session && session.user.name !== updatedUser.name) {
        await update({ ...session, user: { ...session.user, name: updatedUser.name } });
      }

      toast({ title: "Sucesso!", description: "Seus dados foram atualizados." });
      router.push(`/users/${id}`);
    } catch (error) {
      console.error('Update error', error);
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Editar Perfil</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
              <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="cns" control={form.control} render={({ field }) => (<FormItem><FormLabel>CNS/CPF</FormLabel><FormControl><Input {...field} placeholder="Digite o CNS ou CPF" /></FormControl><FormMessage /></FormItem>)} />
              {/* ATUALIZAÇÃO: Campo de data de nascimento agora é um input de data para digitação manual */}
              <FormField name="dataNascimento" control={form.control} render={({ field }) => (<FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              {/* NOVO: Campo de altura adicionado para o cálculo do IMC */}
              <FormField name="altura" control={form.control} render={({ field }) => (<FormItem><FormLabel>Altura (m)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="Ex: 1.75" /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="genero" control={form.control} render={({ field }) => (<FormItem><FormLabel>Gênero</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField name="tipo_sanguineo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tipo Sanguíneo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem><SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}</Button>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default UserEditPage;
