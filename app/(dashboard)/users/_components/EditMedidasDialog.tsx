'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';

interface Registro {
  id: string;
  data: string;
  peso: string;
  imc?: string | null;
  pescoco?: string | null;
  torax?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
}

interface EditRegistroDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRegistroUpdated: () => void;
  registro: Registro | null;
  altura: number | null;
  userId: string; // userId agora é obrigatório
}

const EditRegistroDialog = ({ isOpen, onOpenChange, onRegistroUpdated, registro, altura, userId }: EditRegistroDialogProps) => {
  // Estado inicial ajustado para evitar valores nulos não controlados
  const [formData, setFormData] = useState({ data: '', peso: '', imc: '', pescoco: '', torax: '', cintura: '', quadril: '', bracoE: '', bracoD: '', pernaE: '', pernaD: '', pantE: '', pantD: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (registro) {
      setFormData({
        data: registro.data ? new Date(registro.data).toISOString().split('T')[0] : '',
        peso: registro.peso || '',
        imc: registro.imc || '',
        pescoco: registro.pescoco || '',
        torax: registro.torax || '',
        cintura: registro.cintura || '',
        quadril: registro.quadril || '',
        bracoE: registro.bracoE || '',
        bracoD: registro.bracoD || '',
        pernaE: registro.pernaE || '',
        pernaD: registro.pernaD || '',
        pantE: registro.pantE || '',
        pantD: registro.pantD || '',
      });
      setError(null); // Limpa erros ao abrir um novo registro
    }
  }, [registro]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!registro || !userId) return;
    setError(null);

    // Prepara os dados para envio, incluindo o recálculo do IMC
    const payload: any = { ...formData };
    if (payload.peso && altura) {
        const alturaMetros = altura / 100;
        const pesoNum = parseFloat(payload.peso);
        if (!isNaN(pesoNum) && alturaMetros > 0) {
            payload.imc = (pesoNum / (alturaMetros * alturaMetros)).toFixed(2);
        }
    } else {
        payload.imc = null;
    }

    // Garante que a data está no formato ISO completo esperado pela API
    payload.data = new Date(formData.data).toISOString();

    try {
      // **URL da API corrigida para incluir o userId**
      const response = await fetch(`/api/users/${userId}/medidas/${registro.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), // Envia o payload completo
        }
      );

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao atualizar o registro');
      }

      onRegistroUpdated();
      onOpenChange(false);

    } catch (err: any) {
        console.error(err);
        setError(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>Editar Registro de Peso e Medidas</DialogTitle></DialogHeader>
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
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <DialogFooter><Button onClick={handleSubmit}>Salvar Alterações</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRegistroDialog;
