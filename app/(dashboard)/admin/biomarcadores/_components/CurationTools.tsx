'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/app/_lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { useToast } from '@/app/_hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/app/_components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/app/_components/ui/command';

interface CurationToolsProps {
  categories: string[];
  allBiomarkers: string[];
  onCuration: () => void; // Callback para atualizar a página principal
}

export function CurationTools({ categories, allBiomarkers, onCuration }: CurationToolsProps) {
  const { toast } = useToast();

  // Estado para unificação de biomarcadores
  const [sourceBiomarker, setSourceBiomarker] = useState('');
  const [targetBiomarker, setTargetBiomarker] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Estado para renomeação de categorias
  const [sourceCategory, setSourceCategory] = useState('');
  const [targetCategory, setTargetCategory] = useState('');

  const [isUnifying, setIsUnifying] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleUnifyBiomarkers = async () => {
    if (!sourceBiomarker || !targetBiomarker) {
      toast({ title: 'Campos obrigatórios', description: 'Por favor, selecione um biomarcador de origem e um de destino.', variant: 'destructive' });
      return;
    }
    
    setIsUnifying(true);
    try {
      const response = await fetch('/api/exames/biomarcadores/unify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceName: sourceBiomarker, targetName: targetBiomarker }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Falha ao unificar.');

      toast({ title: 'Sucesso!', description: result.message });
      setSourceBiomarker('');
      setTargetBiomarker('');
      onCuration(); // Atualiza os dados na página pai
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
      toast({ title: 'Erro ao Unificar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUnifying(false);
    }
  };

  const handleRenameCategory = async () => {
    if (!sourceCategory || !targetCategory) {
      toast({ title: 'Campos obrigatórios', description: 'Por favor, selecione uma categoria de origem e insira uma de destino.', variant: 'destructive' });
      return;
    }
    
    setIsRenaming(true);
    try {
      const response = await fetch('/api/exames/categorias/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCategory: sourceCategory, targetCategory: targetCategory }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Falha ao renomear.');

      toast({ title: 'Sucesso!', description: result.message });
      setSourceCategory('');
      setTargetCategory('');
      onCuration(); // Atualiza os dados na página pai
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
      toast({ title: 'Erro ao Renomear', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Unificar Biomarcadores</CardTitle>
          <CardDescription>Unifique um biomarcador de origem com um de destino (novo ou existente).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Biomarcador de Origem</label>
            <Select onValueChange={setSourceBiomarker} value={sourceBiomarker}>
              <SelectTrigger><SelectValue placeholder="Selecione um biomarcador..." /></SelectTrigger>
              <SelectContent>
                {allBiomarkers.filter(b => b !== targetBiomarker).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label>Biomarcador de Destino</label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between"
                    >
                        {targetBiomarker || "Selecione ou crie um biomarcador..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput 
                          placeholder="Buscar ou criar novo..." 
                          onValueChange={(search) => setTargetBiomarker(search)}
                          value={targetBiomarker}
                        />
                        <CommandEmpty>Nenhum biomarcador encontrado.</CommandEmpty>
                        <CommandGroup>
                            {allBiomarkers.filter(b => b !== sourceBiomarker).map((biomarker) => (
                                <CommandItem
                                    key={biomarker}
                                    value={biomarker}
                                    onSelect={(currentValue) => {
                                        setTargetBiomarker(currentValue === targetBiomarker ? "" : currentValue)
                                        setComboboxOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", targetBiomarker === biomarker ? "opacity-100" : "opacity-0")} />
                                    {biomarker}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleUnifyBiomarkers} disabled={isUnifying || !sourceBiomarker || !targetBiomarker}>
            {isUnifying ? 'Unificando...' : 'Unificar Biomarcador'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Categorias</CardTitle>
          <CardDescription>Renomeie uma categoria existente ou unifique-a com outra. Se a categoria de destino não existir, ela será criada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Categoria de Origem</label>
            <Select onValueChange={setSourceCategory} value={sourceCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label>Novo Nome da Categoria (Destino)</label>
            <Input 
              placeholder="Digite o novo nome para a categoria"
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
            />
          </div>
          <Button onClick={handleRenameCategory} disabled={isRenaming || !sourceCategory || !targetCategory}>
            {isRenaming ? 'Renomeando...' : 'Renomear Categoria'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
