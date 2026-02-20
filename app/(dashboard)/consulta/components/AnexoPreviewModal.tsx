'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Anexo } from '@/app/_components/types';
import Image from 'next/image'; // Correção: Importar o componente Image

interface AnexoPreviewModalProps {
  onClose: () => void;
  anexo: Anexo | null;
}

const AnexoPreviewModal = ({ onClose, anexo }: AnexoPreviewModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (anexo && anexo.arquivo) {
      const blob = new Blob([anexo.arquivo], { type: anexo.mimetype || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
  }, [anexo]);

  if (!anexo) {
    return null;
  }

  const isImage = anexo.mimetype?.startsWith('image/');
  const isPdf = anexo.mimetype === 'application/pdf';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
              <DialogTitle className="truncate">{anexo.nomeArquivo}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 p-4 overflow-auto justify-center items-center flex relative">
              {previewUrl ? (
                  <> 
                      {/* Correção: Substituir <img> por <Image> */}
                      {isImage && (
                        <Image 
                          src={previewUrl} 
                          alt={anexo.nomeArquivo} 
                          fill
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                      {isPdf && <iframe src={previewUrl} className="w-full h-full border-0" title={anexo.nomeArquivo}></iframe>}
                      {!isImage && !isPdf && (
                        <div className="text-center text-muted-foreground">
                          <p className="font-semibold">Pré-visualização não suportada</p>
                          <p className="text-sm">Faça o download para ver o arquivo.</p>
                        </div>
                      )}
                  </> 
              ) : (
                  <p className="text-center">Carregando pré-visualização...</p>
              )}
          </div>

          <DialogFooter className="p-4 border-t flex-shrink-0">
               <Button variant="outline" onClick={onClose}>Fechar</Button>
               {previewUrl && <a href={previewUrl} download={anexo.nomeArquivo}><Button>Download</Button></a>}
          </DialogFooter>
      </DialogContent>
  </Dialog>
  );
};

export default AnexoPreviewModal;
