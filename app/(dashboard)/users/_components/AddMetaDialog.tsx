 'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { Label } from '@/app/_components/ui/label';
import { useToast } from '@/app/_hooks/use-toast';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { PesoRegistro, TipoMeta, metaLabels, metaToRegistroKey } from './MetasCard';
import { parseISO } from 'date-fns';

interface AddMetaDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userId: string;
  onMetaCriada: () => void;
  historicoMedidas: PesoRegistro[];
}

interface MetaSelecionada {
    valorAlvo: string;
    valorInicial: string | null;
}

export const AddMetaDialog = ({ isOpen, setIsOpen, userId, onMetaCriada, historicoMedidas }: AddMetaDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metasSelecionadas, setMetasSelecionadas] = useState<Record<string, MetaSelecionada>>({});
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState('');

  const valoresAtuais = useMemo(() => {
    const todosOsValores: { [key in TipoMeta]?: string | null } = {};

    // 1. Ordena o histórico pela data mais recente primeiro.
    const historicoOrdenado = [...historicoMedidas].sort((a, b) => 
        parseISO(b.data).getTime() - parseISO(a.data).getTime()
    );

    for (const [tipo, key] of Object.entries(metaToRegistroKey)) {
        if (!key) {
            continue;
        }

        // 2. Procura no histórico ordenado pelo primeiro valor válido.
        const registroMaisRecente = historicoOrdenado.find(reg => reg[key] != null && reg[key] !== '');
        
        todosOsValores[tipo as TipoMeta] = registroMaisRecente ? registroMaisRecente[key] : null;
    }
    return todosOsValores;
  }, [historicoMedidas]);

  const handleCheckboxChange = (tipo: TipoMeta, checked: boolean) => {
    const novasMetas = { ...metasSelecionadas };
    if (checked) {
      novasMetas[tipo] = {
        valorAlvo: '',
        valorInicial: valoresAtuais[tipo] ?? null,
      };
    } else {
      delete novasMetas[tipo];
    }
    setMetasSelecionadas(novasMetas);
  };

  const handleValorAlvoChange = (tipo: TipoMeta, valor: string) => {
    if (metasSelecionadas[tipo]) {
      const novasMetas = { ...metasSelecionadas };
      novasMetas[tipo].valorAlvo = valor;
      setMetasSelecionadas(novasMetas);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const metasParaEnviar = Object.entries(metasSelecionadas)
      .filter(([, dados]) => dados.valorAlvo.trim() !== '')
      .map(([tipo, dados]) => ({
        tipo: tipo as TipoMeta,
        valorAlvo: dados.valorAlvo,
        valorInicial: dados.valorInicial,
        dataInicio: dataInicio,
        dataFim: dataFim ? new Date(dataFim).toISOString() : null,
      }));

    if (metasParaEnviar.length === 0) {
        toast({ title: 'Atenção', description: 'Selecione pelo menos uma meta e preencha o valor alvo.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/metas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metasParaEnviar),
      });

      if (!response.ok) throw new Error('Falha ao criar as metas.');

      toast({ title: 'Sucesso!', description: `${metasParaEnviar.length} meta(s) criada(s) com sucesso.` });
      onMetaCriada();
      setIsOpen(false);
      setMetasSelecionadas({});
      setDataFim('');
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar as metas. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novas Metas</DialogTitle>
          <DialogDescription>Selecione as metas que deseja acompanhar e defina seus objetivos.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
                <Label htmlFor='dataInicio'>Data de Início</Label>
                <Input id='dataInicio' type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
                <Label htmlFor='dataFim'>Data Alvo (Opcional)</Label>
                <Input id='dataFim' type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} min={dataInicio} />
            </div>
        </div>

        <ScrollArea className="h-[300px] w-full border rounded-md p-4">
            <div className="space-y-6">
                {(Object.keys(metaLabels) as TipoMeta[]).map((tipo) => {
                    const isSelected = !!metasSelecionadas[tipo];
                    const valorAtual = valoresAtuais[tipo];

                    return (
                        <div key={tipo} className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id={tipo} checked={isSelected} onCheckedChange={(checked) => handleCheckboxChange(tipo, !!checked)} />
                                <Label htmlFor={tipo} className="font-semibold text-base">{metaLabels[tipo]}</Label>
                            </div>
                            {isSelected && (
                                <div className="grid grid-cols-2 gap-x-4 pl-6">
                                    <div className="space-y-1">
                                        <Label htmlFor={`current-${tipo}`} className="text-xs text-muted-foreground">Valor Atual</Label>
                                        <Input id={`current-${tipo}`} value={valorAtual ?? 'N/A'} disabled />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`target-${tipo}`} className="text-xs">Valor Alvo</Label>
                                        <Input 
                                            id={`target-${tipo}`} 
                                            placeholder="Defina o alvo" 
                                            value={metasSelecionadas[tipo]?.valorAlvo || ''}
                                            onChange={(e) => handleValorAlvoChange(tipo, e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </ScrollArea>

        <DialogFooter className='mt-4'>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Metas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
