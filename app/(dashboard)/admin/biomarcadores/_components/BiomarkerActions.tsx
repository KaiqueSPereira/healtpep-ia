'use client';

import { useState } from 'react';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/app/_components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Input } from '@/app/_components/ui/input';
import { useToast } from '@/app/_hooks/use-toast';
import { BiomarkerData } from './BiomarkersDataTable';

interface BiomarkerActionsProps {
  biomarker: BiomarkerData;
  categories: string[];
  onActionComplete: () => void;
}

export function BiomarkerActions({ biomarker, categories, onActionComplete }: BiomarkerActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleMoveOrCategorize = async () => {
    const targetCategory = newCategory || selectedCategory;
    if (!targetCategory) {
      toast({ title: 'Ação Requerida', description: 'Selecione ou crie uma categoria.', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/exames/biomarcadores/categorize', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biomarkerName: biomarker.name, newCategory: targetCategory }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha ao categorizar o biomarcador.');

      toast({ title: 'Sucesso!', description: `Biomarcador '${biomarker.name}' foi movido para '${targetCategory}'.` });
      onActionComplete();
      setIsDialogOpen(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro na Operação', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setNewCategory('');
      setSelectedCategory('');
    }
  };

  const filteredCategories = categories.filter(c => c !== biomarker.category);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            {biomarker.category === 'Pendente' ? 'Categorizar' : 'Mover para...'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover ou Categorizar Biomarcador</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>Biomarcador: <span className="font-semibold">{biomarker.name}</span></p>
            <p>Categoria Atual: <span className="font-semibold">{biomarker.category}</span></p>
            
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2"><div className="flex-grow border-t"></div><span className="text-xs text-muted-foreground">OU</span><div className="flex-grow border-t"></div></div>

            <Input 
              placeholder="Crie uma nova categoria"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleMoveOrCategorize} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
