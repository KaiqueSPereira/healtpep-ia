'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, Download, ArrowLeft, File, FileImage, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/app/_components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/app/_components/ui/carousel";

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

const getFileIcon = (mimetype: string | null) => {
  if (mimetype?.startsWith('image/')) {
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);


  useEffect(() => {
    if (open && examId) {
      const fetchAnexos = async () => {
        setLoading(true);
        setSelectedAnexoUrl(null);
        try {
          const response = await fetch(`/api/exames/${examId}?includeAnexos=true`);
          if (!response.ok) throw new Error("Falha ao carregar anexos.");
          const data = await response.json();
          setAnexos(data.exame?.anexos || []);
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

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap() + 1);

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap() + 1);
    };

    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const selectedAnexo = useMemo(() => {
    if (!selectedAnexoUrl) return null;
    const anexoId = new URLSearchParams(selectedAnexoUrl.split('?')[1]).get('anexoId');
    return anexos.find(a => a.id === anexoId) || null;
  }, [selectedAnexoUrl, anexos]);

  const { imageAnexos, otherAnexos } = useMemo((): { imageAnexos: Anexo[]; otherAnexos: Anexo[] } => {
    const images: Anexo[] = [];
    const others: Anexo[] = [];
    anexos.forEach((anexo: Anexo) => {
      if (anexo.mimetype?.startsWith('image/')) {
        images.push(anexo);
      } else {
        others.push(anexo);
      }
    });
    return { imageAnexos: images, otherAnexos: others };
  }, [anexos]);

  const handleClose = () => onOpenChange(false);
  const shouldShowOverview = !selectedAnexoUrl;
  const shouldShowCarousel = imageAnexos.length > 1 && shouldShowOverview;
  const listItems: Anexo[] = shouldShowCarousel ? otherAnexos : anexos;

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
      const isImage = mimetype?.startsWith('image/');
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

    if (shouldShowOverview) {
        if (anexos.length === 0) {
            return <p className="text-center text-muted-foreground py-10">Nenhum anexo encontrado para este exame.</p>;
        }

        return (
            <div className="flex flex-col space-y-4">
              {shouldShowCarousel && (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-3 px-1">Imagens</h3>
                  <Carousel setApi={setCarouselApi} className="w-full max-w-3xl mx-auto">
                    <CarouselContent>
                      {imageAnexos.map((anexo: Anexo) => (
                        <CarouselItem key={anexo.id} className="basis-1/2 md:basis-1/3">
                          <div className="p-1">
                            <Card className='overflow-hidden'>
                              <CardContent 
                                className="relative aspect-square flex items-center justify-center p-0 cursor-pointer group"
                                onClick={() => setSelectedAnexoUrl(`/api/exames/arquivo?anexoId=${anexo.id}`)}
                              >
                                <Image
                                  src={`/api/exames/arquivo?anexoId=${anexo.id}`}
                                  alt={anexo.nomeArquivo}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 300px"
                                />
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-8 w-8 text-white" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-8" />
                    <CarouselNext className="-right-8" />
                  </Carousel>
                   <div className="py-2 text-center text-sm text-muted-foreground">
                    {currentSlide} de {slideCount}
                  </div>
                </div>
              )}
    
              {listItems.length > 0 && (
                 <div className="w-full">
                    {shouldShowCarousel && <h3 className="text-lg font-semibold mb-3 mt-4 px-1">Outros Arquivos</h3>}
                     <div className="flex flex-col space-y-3">
                        {listItems.map((anexo: Anexo) => (
                            <div key={anexo.id} className="flex items-center justify-between rounded-md border p-3 pr-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    {getFileIcon(anexo.mimetype)}
                                    <div className="truncate">
                                    <p className="font-semibold text-sm truncate" title={anexo.nomeArquivo}>{anexo.nomeArquivo}</p>
                                    <p className="text-xs text-muted-foreground">Adicionado em: {new Date(anexo.createdAt).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => setSelectedAnexoUrl(`/api/exames/arquivo?anexoId=${anexo.id}`)} className="flex-shrink-0 ml-4"><Eye className="mr-2 h-4 w-4" />Visualizar</Button>
                            </div>
                        ))}
                     </div>
                 </div>
              )}
            </div>
          );
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
          {shouldShowOverview && anexos.length > 0 && <DialogDescription>Este exame possui {anexos.length} anexo(s). {imageAnexos.length > 1 ? "Navegue pelas imagens no carrossel ou selecione um item para visualizar." : "Selecione um item para visualizar."}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-2 min-h-[200px]">{renderAnexoContent()}</div>

        <DialogFooter className='mt-4 sm:justify-between'>
          <div className="flex-1 flex justify-start">
            {selectedAnexo && anexos.length > 1 && (
                <Button variant="secondary" onClick={() => setSelectedAnexoUrl(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
                </Button>
            )}
          </div>
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
