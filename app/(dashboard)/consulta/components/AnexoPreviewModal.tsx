'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Anexo } from '@/app/_components/types';
import AnexoViewer from './AnexoViewer';

interface AnexoPreviewModalProps {
  anexo: Anexo | null;
  consultaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AnexoPreviewModal({ anexo, consultaId, open, onOpenChange }: AnexoPreviewModalProps) {
  if (!anexo) return null;

  const anexoUrl = `/api/consultas/${consultaId}/anexos/${anexo.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Visualizando: {anexo.nomeArquivo}</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 min-h-[75vh]">
            <AnexoViewer anexo={anexo} anexoUrl={anexoUrl} />
        </div>

        <DialogFooter className='mt-4'>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
