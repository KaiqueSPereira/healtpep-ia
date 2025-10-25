'use client';

import { useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/app/_hooks/use-toast';
import { Button } from '@/app/_components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/app/_components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Loader2 } from 'lucide-react';

interface Endereco {
    id: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    nome: string;
}

const formSchema = z.object({
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado deve ter 2 caracteres').max(2),
  cep: z.string().min(8, 'CEP deve ter 8 caracteres'),
  nome: z.string().min(1, 'Nome é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface EnderecosDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (endereco: Endereco) => void;
    unidadeId?: string; // For linking address to a health unit
    userId?: string;    // For linking address to a user
}

export const EnderecosDialog = ({ isOpen, onClose, onSave, unidadeId, userId }: EnderecosDialogProps) => {
    const [loading, setLoading] = useState(false);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            nome: '',
        }
    });
    
    const handleViaCepSearch = async () => {
        const cep = form.getValues("cep");
        if (cep.length === 8) {
            setLoading(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    form.setValue('rua', data.logradouro);
                    form.setValue('bairro', data.bairro);
                    form.setValue('cidade', data.localidade);
                    form.setValue('estado', data.uf);
                }
            } catch (err) { // CORRECTED: Renamed 'error' to 'err' to avoid conflict
                console.error("Erro ao buscar CEP:", err);
                toast({ title: "Erro", description: "Não foi possível buscar o CEP.", variant: "destructive" });
            }
            setLoading(false);
        }
    };
    
    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const payload = {
                CEP: data.cep,
                rua: data.rua,
                numero: data.numero,
                bairro: data.bairro,
                municipio: data.cidade,
                UF: data.estado,
                nome: data.nome,
                unidadeId,
                userId
            };

            const response = await fetch('/api/enderecos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const newEndereco = await response.json();
            if (!response.ok) {
                throw new Error(newEndereco.error || 'Falha ao salvar endereço');
            }
            toast({ title: "Sucesso!", description: "Endereço salvo." });
            onSave(newEndereco);
            onClose();
        } catch (err) { // CORRECTED: Renamed 'error' to 'err' to avoid conflict
            console.error("Erro ao salvar endereço:", err);
            toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
        }
        setLoading(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Endereço</DialogTitle>
                    <DialogDescription>Preencha os dados do endereço ou use a busca por CEP.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="nome" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nome da Clinica</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="flex items-end gap-2">
                            <FormField name="cep" control={form.control} render={({ field }) => (<FormItem className='flex-grow'><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="button" onClick={handleViaCepSearch} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}</Button>
                        </div>
                        <div className="flex items-end gap-2">
                            <FormField name="rua" control={form.control} render={({ field }) => (<FormItem className='flex-grow'><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField name="numero" control={form.control} render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField name="bairro" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="cidade" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField name="estado" control={form.control} render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};