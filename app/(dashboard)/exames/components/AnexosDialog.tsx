'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, X, Download, ArrowLeft, File, FileImage, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Anexo {
  id: string;
  nomeArquivo: string;
  createdAt: string;
  mimetype: string | null;
}

interface AnexosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string | null;
}

// Helper para obter ícone com base no mimetype
const getFileIcon = (mimetype: string | null) => { // CORRIGIDO: Aceita mimetype nulo
  if (mimetype?.startsWith('image/')) { // CORRIGIDO: Optional chaining
    return <FileImage className="h-6 w-6 text-blue-500 flex-shrink-0" />;
  }
  if (mimetype === 'application/pdf') {
    return <FileText className="h-6 w-6 text-red-500 flex-shrink-0" />;
  }
  return <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />;
};

export default function AnexosDialog({ open, onOpenChange, examId }: AnexosDialogProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnexoUrl, setSelectedAnexoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && examId) {
      const fetchAnexos = async () => {
        setLoading(true);
        setSelectedAnexoUrl(null);
        try {
          const response = await fetch(`/api/exames/${examId}?includeAnexos=true`);
          if (!response.ok) throw new Error("Falha ao carregar anexos.");
          const data = await response.json();
          const fetchedAnexos = data.exame?.anexos || [];
          setAnexos(fetchedAnexos);

          if (fetchedAnexos.length === 1) {
            setSelectedAnexoUrl(`/api/exames/arquivo?anexoId=${fetchedAnexos[0].id}`);
          }
        } catch (error) {
          console.error("Erro ao buscar anexos:", error);
          toast({ title: "Erro", description: "Não foi possível carregar os anexos.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchAnexos();
    } else {
      setAnexos([]);
      setSelectedAnexoUrl(null);
    }
  }, [open, examId]);

  const selectedAnexo = useMemo(() => {
    if (!selectedAnexoUrl) return null;
    const anexoId = new URLSearchParams(selectedAnexoUrl.split('?')[1]).get('anexoId');
    return anexos.find(a => a.id === anexoId) || null;
  }, [selectedAnexoUrl, anexos]);

  const handleClose = () => onOpenChange(false);
  const shouldShowList = anexos.length > 1 && !selectedAnexoUrl;

  const renderAnexoContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className='ml-3'>Carregando anexos...</p>
        </div>
      );
    }

    if (selectedAnexoUrl && selectedAnexo) {
      const { mimetype } = selectedAnexo;
      const isImage = mimetype?.startsWith('image/'); // CORRIGIDO: Optional chaining
      const isPdf = mimetype === 'application/pdf';

      let viewer;
      if (isImage) {
        viewer = (
          <div className="relative w-full h-full flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
            <Image src={selectedAnexoUrl} alt={selectedAnexo.nomeArquivo} fill className="object-contain" sizes="(max-width: 1280px) 90vw, 80vw" />
          </div>
        );
      } else if (isPdf) {
        viewer = (
          <object data={selectedAnexoUrl} type="application/pdf" className="w-full h-full rounded-md">
            <div className='w-full h-full flex flex-col items-center justify-center bg-muted/20 rounded-md p-4'>
              <p className='text-center'>Seu navegador não pode exibir este PDF.</p>
              <Button asChild className='mt-4'><Link href={selectedAnexoUrl} download><Download className='mr-2 h-4 w-4' />Baixar PDF</Link></Button>
            </div>
          </object>
        );
      } else {
        viewer = <iframe src={selectedAnexoUrl} className="w-full h-full border rounded-md bg-white" title="Visualizador de Anexo" />;
      }

      return (
        <div className="h-[75vh] w-full flex flex-col">
          {viewer}
          <Button asChild variant='link' className='mt-2 text-muted-foreground self-center'>
            <Link href={selectedAnexoUrl} target="_blank" download><Download className='mr-2 h-4 w-4' />Se o arquivo não abrir, clique para baixar.</Link>
          </Button>
        </div>
      );
    }

    if (shouldShowList) {
      return (
        <div className="flex flex-col space-y-3">
          {anexos.map(anexo => (
            <div key={anexo.id} className="flex items-center justify-between rounded-md border p-3 pr-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                {getFileIcon(anexo.mimetype)}
                <div>
                  <p className="font-semibold text-sm">{anexo.nomeArquivo}</p>
                  <p className="text-xs text-muted-foreground">Adicionado em: {new Date(anexo.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedAnexoUrl(`/api/exames/arquivo?anexoId=${anexo.id}`)}><Eye className="mr-2 h-4 w-4" />Visualizar</Button>
            </div>
          ))}
        </div>
      );
    }

    if (!loading && anexos.length === 0) {
      return <p className="text-center text-muted-foreground py-10">Nenhum anexo encontrado para este exame.</p>;
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {selectedAnexo ? `Visualizando: ${selectedAnexo.nomeArquivo}` : 'Anexos do Exame'}
          </DialogTitle>
          {shouldShowList && <DialogDescription>Este exame possui {anexos.length} anexos. Selecione um para visualizar.</DialogDescription>}
        </DialogHeader>
        
        <div className="py-2">{renderAnexoContent()}</div>

        <DialogFooter className='mt-4'>
          {selectedAnexo && anexos.length > 1 && (
            <Button variant="secondary" onClick={() => setSelectedAnexoUrl(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a lista
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
