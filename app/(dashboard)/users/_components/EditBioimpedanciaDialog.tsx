'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { toast } from '@/app/_hooks/use-toast';

interface BioimpedanceRecord {
  id: string;
  data: string;
  gorduraCorporal?: number | null;
  gorduraVisceral?: number | null;
  massaMuscular?: number | null;
  aguaCorporal?: number | null;
  massaOssea?: number | null;
  taxaMetabolica?: number | null;
  idadeCorporal?: number | null;
}

interface EditBioimpedanciaDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  record: BioimpedanceRecord;
  onSuccess: () => void;
}

const EditBioimpedanciaDialog = ({ isOpen, setIsOpen, record, onSuccess }: EditBioimpedanciaDialogProps) => {
  const [formData, setFormData] = useState(record);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSubmit = new FormData();
    Object.keys(formData).forEach(key => {
        dataToSubmit.append(key, formData[key as keyof typeof formData] as string);
    });

    try {
      const response = await fetch(`/api/users/userid/bioimpedancias`, { // userid is a placeholder
        method: 'PUT',
        body: dataToSubmit,
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o registro.');
      }

      toast({ title: "Registro de bioimpedância atualizado com sucesso!" });
      onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: (error instanceof Error) ? error.message : 'Ocorreu um erro desconhecido', variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Registro de Bioimpedância</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" value={formData.data.split('T')[0]} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="gorduraCorporal">Gordura Corporal (%)</Label>
                <Input id="gorduraCorporal" name="gorduraCorporal" type="number" step="0.1" value={formData.gorduraCorporal || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="gorduraVisceral">Gordura Visceral</Label>
                <Input id="gorduraVisceral" name="gorduraVisceral" type="number" step="0.1" value={formData.gorduraVisceral || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="massaMuscular">Massa Muscular (kg)</Label>
                <Input id="massaMuscular" name="massaMuscular" type="number" step="0.1" value={formData.massaMuscular || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="aguaCorporal">Água Corporal (%)</Label>
                <Input id="aguaCorporal" name="aguaCorporal" type="number" step="0.1" value={formData.aguaCorporal || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="massaOssea">Massa Óssea (kg)</Label>
                <Input id="massaOssea" name="massaOssea" type="number" step="0.1" value={formData.massaOssea || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="taxaMetabolica">Taxa Metabólica Basal</Label>
                <Input id="taxaMetabolica" name="taxaMetabolica" type="number" value={formData.taxaMetabolica || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="idadeCorporal">Idade Corporal</Label>
                <Input id="idadeCorporal" name="idadeCorporal" type="number" value={formData.idadeCorporal || ''} onChange={handleChange} />
            </div>
            {/* Anexo não é editável por aqui para simplificar */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBioimpedanciaDialog;
