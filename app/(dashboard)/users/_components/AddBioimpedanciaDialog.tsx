'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { PlusCircle, Loader2 } from 'lucide-react';

interface AddBioimpedanciaDialogProps {
  userId: string;
  onSuccess: () => void; // Callback para recarregar os dados na página principal
}

const AddBioimpedanciaDialog = ({ userId, onSuccess }: AddBioimpedanciaDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anexo, setAnexo] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setAnexo(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (anexo) {
      formData.append('anexo', anexo);
    }

    try {
      const response = await fetch(`/api/users/${userId}/bioimpedancias`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar o registro.');
      }

      onSuccess(); // Executa o callback para atualizar a lista
      setIsOpen(false); // Fecha o dialog

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Registro de Bioimpedância</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data" className="text-right">Data</Label>
            <Input id="data" name="data" type="date" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="gorduraCorporal" className="text-right text-sm">% Gordura</Label>
              <Input id="gorduraCorporal" name="gorduraCorporal" type="number" step="0.1" placeholder="Ex: 22.5" className="col-span-1" />
            </div>
            <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="massaMuscular" className="text-right text-sm">M. Muscular (kg)</Label>
              <Input id="massaMuscular" name="massaMuscular" type="number" step="0.1" placeholder="Ex: 55.2" className="col-span-1" />
            </div>
             <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="aguaCorporal" className="text-right text-sm">% Água</Label>
              <Input id="aguaCorporal" name="aguaCorporal" type="number" step="0.1" placeholder="Ex: 50.3" className="col-span-1" />
            </div>
             <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="taxaMetabolica" className="text-right text-sm">Metabolismo</Label>
              <Input id="taxaMetabolica" name="taxaMetabolica" type="number" placeholder="Ex: 1500" className="col-span-1" />
            </div>
            <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="gorduraVisceral" className="text-right text-sm">G. Visceral</Label>
              <Input id="gorduraVisceral" name="gorduraVisceral" type="number" placeholder="Ex: 8" className="col-span-1" />
            </div>
             <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="idadeCorporal" className="text-right text-sm">Idade Corporal</Label>
              <Input id="idadeCorporal" name="idadeCorporal" type="number" placeholder="Ex: 35" className="col-span-1" />
            </div>
             <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
              <Label htmlFor="massaOssea" className="text-right text-sm">Massa Óssea (kg)</Label>
              <Input id="massaOssea" name="massaOssea" type="number" step="0.1" placeholder="Ex: 2.5" className="col-span-1" />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="anexo" className="text-right">Anexo</Label>
            <Input id="anexo" type="file" onChange={handleFileChange} className="col-span-3" />
          </div>
          {error && <p className="text-destructive text-sm text-center col-span-4">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Registro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBioimpedanciaDialog;
