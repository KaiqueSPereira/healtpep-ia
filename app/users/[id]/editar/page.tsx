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
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Calendar } from '@/app/_components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  dataNascimento: z.date().optional(),
  genero: z.string().optional(),
  tipo_sanguineo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const UserEditPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '' },
  });

  useEffect(() => {
    if (session?.user?.id !== id) {
      router.push('/'); // Redirect if not the owner
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) throw new Error('Falha ao carregar dados do usuário');
        // CORRECTED: Type assertion for user data
        const user: { name: string; email: string; dataNascimento?: string; genero?: string; tipo_sanguineo?: string; } = await response.json();
        form.setValue('name', user.name);
        form.setValue('email', user.email);
        if (user.dataNascimento) form.setValue('dataNascimento', new Date(user.dataNascimento));
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
          // CORRECTED: Type assertion for error data
          const errorData: { error: string } = await response.json();
          throw new Error(errorData.error || 'Falha ao atualizar usuário.');
      }
      
      // CORRECTED: Type assertion for success data
      const updatedUser: { name?: string } = await response.json();

      // Update the session if the name has changed
      if (session && session.user.name !== updatedUser.name) {
        await update({ ...session, user: { ...session.user, name: updatedUser.name } });
      }

      toast({ title: "Sucesso!", description: "Seus dados foram atualizados." });
      router.push(`/users/${id}`);
    } catch (error) {
      console.error('Update error', error);
       // CORRECTED: Type assertion for caught error
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
              <FormField name="dataNascimento" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Nascimento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><>{field.value ? format(field.value, "PPP") : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
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
