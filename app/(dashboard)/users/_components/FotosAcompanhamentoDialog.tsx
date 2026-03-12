 'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { useToast } from '@/app/_hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

interface Foto {
  id: string;
  nomeArquivo: string;
  createdAt: string;
}

interface FotosAcompanhamentoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  recordId: string | null;
}

export const FotosAcompanhamentoDialog = ({ isOpen, onOpenChange, userId, recordId }: FotosAcompanhamentoDialogProps) => {
  const { toast } = useToast();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchFotos = useCallback(async () => {
    if (!recordId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/medidas/${recordId}/fotos`);
      if (!response.ok) throw new Error('Falha ao buscar as fotos.');
      const data = await response.json();
      setFotos(data);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar as fotos.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [recordId, userId, toast]);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchFotos();
    }
  }, [isOpen, recordId, fetchFotos]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !recordId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/users/${userId}/medidas/${recordId}/fotos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha ao enviar a foto.');

      toast({ title: 'Sucesso!', description: 'Foto enviada.' });
      setSelectedFile(null);
      // CORREÇÃO APLICADA AQUI
      const fileInput = document.getElementById('picture-upload') as HTMLInputElement;
      if (fileInput) {
          fileInput.value = '';
      }
      fetchFotos(); // Recarrega a lista de fotos
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível enviar a foto.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fotos do Acompanhamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input id="picture-upload" type="file" accept="image/*" onChange={handleFileChange} className="flex-grow" />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} size="sm">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="ml-2">Enviar</span>
            </Button>
          </div>
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold mb-2">Fotos Salvas</h3>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : fotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group border rounded-md p-2 flex flex-col items-center text-center">
                    <ImageIcon className="h-16 w-16 text-gray-300 mb-2" />
                    <p className="text-xs w-full truncate" title={foto.nomeArquivo}>{foto.nomeArquivo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(foto.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma foto encontrada para este registro.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
