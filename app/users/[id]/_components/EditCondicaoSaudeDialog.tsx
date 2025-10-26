'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription, DialogClose, DialogTrigger
} from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { Label } from '@/app/_components/ui/label';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { Profissional } from '@prisma/client';
import MenuProfissionais from '@/app/profissionais/_components/menuprofissionais';

interface CondicaoSaude {
  id: string;
  nome: string;
  objetivo?: string | null;
  observacoes?: string | null;
  profissionalId?: string | null;
  profissional?: Profissional | null;
}

interface EditCondicaoSaudeDialogProps {
  condicao: CondicaoSaude;
  onCondicaoUpdated: () => void;
}

export default function EditCondicaoSaudeDialog({ condicao, onCondicaoUpdated }: EditCondicaoSaudeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(condicao.profissional || null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CondicaoSaude>({
    defaultValues: {
      nome: condicao.nome,
      objetivo: condicao.objetivo,
      observacoes: condicao.observacoes,
      profissionalId: condicao.profissionalId,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchProfissionais = async () => {
        try {
          const response = await fetch('/api/profissionais');
          if (!response.ok) throw new Error('Falha ao buscar profissionais');
          setProfissionais(await response.json());
        } catch (error) {
          toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
        }
      };
      fetchProfissionais();
    }
  }, [isOpen]);

  const handleUpdate = async (data: CondicaoSaude) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/condicoessaude/${condicao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao atualizar condição');
      toast({ title: 'Sucesso!', description: 'Condição de saúde atualizada.' });
      onCondicaoUpdated();
      setIsOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/condicoessaude/${condicao.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao excluir condição');
      toast({ title: 'Sucesso!', description: 'Condição de saúde excluída.' });
      onCondicaoUpdated();
      setIsOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Condição de Saúde</DialogTitle>
          <DialogDescription>Atualize os detalhes ou altere o profissional responsável.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register('nome', { required: 'Nome é obrigatório' })} />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Profissional Responsável</Label>
            <MenuProfissionais
              profissionais={profissionais}
              selectedProfissional={selectedProfissional}
              onProfissionalSelect={(prof) => {
                setSelectedProfissional(prof);
                setValue('profissionalId', prof ? prof.id : undefined);
              }}
            />
          </div>

          <div>
            <Label htmlFor="objetivo">Objetivo</Label>
            <Textarea id="objetivo" {...register('objetivo')} />
          </div>
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-none sm:flex sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
            </Button>
            <div className="flex gap-2 justify-end">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar Alterações
                </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
