'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';

interface AddRegistroDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRegistroAdded: () => void;
  userId: string;
  altura: number | null;
}

const AddRegistroDialog = ({ isOpen, onOpenChange, onRegistroAdded, userId, altura }: AddRegistroDialogProps) => {
  const [formData, setFormData] = useState({ data: new Date().toISOString().split('T')[0], peso: '', pescoco: '', torax: '', cintura: '', quadril: '', bracoE: '', bracoD: '', pernaE: '', pernaD: '', pantE: '', pantD: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/medidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, altura }),
      });
      if (!response.ok) throw new Error('Falha ao adicionar registro');
      onRegistroAdded();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>Adicionar Novo Registro de Peso e Medidas</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <div className="col-span-1 sm:col-span-2 space-y-2"><Label htmlFor="data">Data</Label><Input id="data" name="data" type="date" value={formData.data} onChange={handleChange} /></div>
          <div className="col-span-1 sm:col-span-2 space-y-2"><Label htmlFor="peso">Peso (kg)</Label><Input id="peso" name="peso" value={formData.peso} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="pescoco">Pescoço (cm)</Label><Input id="pescoco" name="pescoco" value={formData.pescoco} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="torax">Tórax (cm)</Label><Input id="torax" name="torax" value={formData.torax} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="cintura">Cintura (cm)</Label><Input id="cintura" name="cintura" value={formData.cintura} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="quadril">Quadril (cm)</Label><Input id="quadril" name="quadril" value={formData.quadril} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="bracoE">Braço E. (cm)</Label><Input id="bracoE" name="bracoE" value={formData.bracoE} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="bracoD">Braço D. (cm)</Label><Input id="bracoD" name="bracoD" value={formData.bracoD} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="pernaE">Perna E. (cm)</Label><Input id="pernaE" name="pernaE" value={formData.pernaE} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="pernaD">Perna D. (cm)</Label><Input id="pernaD" name="pernaD" value={formData.pernaD} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="pantE">Pant. E. (cm)</Label><Input id="pantE" name="pantE" value={formData.pantE} onChange={handleChange} /></div>
          <div className="space-y-2"><Label htmlFor="pantD">Pant. D. (cm)</Label><Input id="pantD" name="pantD" value={formData.pantD} onChange={handleChange} /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRegistroDialog;
