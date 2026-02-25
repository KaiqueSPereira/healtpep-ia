'use client';

import { useState } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Button } from '@/app/_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/app/_components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { BiomarkerData } from './BiomarkersDataTable';

interface BiomarkerActionsProps {
  biomarker: BiomarkerData;
  categories: string[];
  onActionComplete: () => void;
}

export function BiomarkerActions({ biomarker, categories, onActionComplete }: BiomarkerActionsProps) {
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { toast } = useToast();

  const handleCategorize = async (newCategory: string) => {
    if (biomarker.category === newCategory) return;

    setIsCategorizing(true);
    try {
      const res = await fetch('/api/exames/biomarcadores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'categorize',
          standardizedName: biomarker.name,
          newCategory: newCategory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Falha ao categorizar o biomarcador.');
      }

      toast({
        title: 'Sucesso!',
        description: `Biomarcador '${biomarker.name}' movido para a categoria '${newCategory}'.`,
        variant: 'success'
      });
      onActionComplete(); // Trigger data refetch
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro ao Categorizar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCategorizing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          {isCategorizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Mover para Categoria</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {categories.map((cat) => (
              <DropdownMenuItem key={cat} onClick={() => handleCategorize(cat)} disabled={biomarker.category === cat}>
                {cat}
              </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={() => handleCategorize('Pendente')} disabled={biomarker.category === 'Pendente'}>
                Pendente
              </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
