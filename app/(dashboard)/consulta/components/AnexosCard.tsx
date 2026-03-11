'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, File, FileImage, FileText, Eye, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/app/_components/ui/carousel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Anexo } from '@/app/_components/types';
import AnexoUploader from './AnexoUploader';
import AnexoPreviewModal from './AnexoPreviewModal';

interface AnexosCardProps {
  consultaId: string;
  initialAnexos?: Anexo[];
}

const getFileIcon = (mimetype: string | null): JSX.Element => {
  if (mimetype?.startsWith('image/')) return <FileImage className="h-6 w-6 text-blue-500 flex-shrink-0" />;
  if (mimetype === 'application/pdf') return <FileText className="h-6 w-6 text-red-500 flex-shrink-0" />;
  return <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />;
};

export default function AnexosCard({ consultaId, initialAnexos = [] }: AnexosCardProps) {
  const [anexos, setAnexos] = useState<Anexo[]>(initialAnexos);
  const [loading, setLoading] = useState(!initialAnexos.length);
  const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);
  const [anexoToDelete, setAnexoToDelete] = useState<Anexo | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    if (consultaId) {
        const fetchAnexos = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/consultas/${consultaId}/anexos`);
                if (!response.ok) throw new Error("Falha ao carregar anexos.");
                const data = await response.json();
                setAnexos(data || []);
            } catch (error) {
                console.error("Erro ao buscar anexos:", error);
                toast({ title: "Erro", description: "Não foi possível carregar os anexos.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchAnexos();
    }
  }, [consultaId]);

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap() + 1));
    return () => { carouselApi?.off("select", () => {}); };
  }, [carouselApi]);

  const handleAnexoAdicionado = (newAnexo: Anexo) => {
    setAnexos(prev => [...prev, newAnexo]);
    setShowUploader(false);
    toast({ title: "Sucesso", description: "Anexo adicionado.", variant: "success" });
  };

  const handleDeleteAnexo = async () => {
    if (!anexoToDelete) return;
    try {
        const response = await fetch(`/api/consultas/${consultaId}/anexos/${anexoToDelete.id}`, { method: 'DELETE' });
        if (response.status !== 204) {
             const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Falha ao deletar anexo');
        }
        setAnexos(prev => prev.filter(a => a.id !== anexoToDelete.id));
        toast({ title: "Anexo deletado com sucesso!" });
    } catch (error) {
        toast({ title: "Erro ao deletar anexo", description: (error as Error).message, variant: "destructive" });
    } finally {
        setAnexoToDelete(null);
    }
  };

  const openPreviewModal = (anexo: Anexo) => {
    setSelectedAnexo(anexo);
    setShowPreview(true);
  };

  const createAnexoUrl = (anexoId: string) => `/api/consultas/${consultaId}/anexos/${anexoId}`;

  const { imageAnexos, otherAnexos }: { imageAnexos: Anexo[], otherAnexos: Anexo[] } = useMemo(() => {
    const images: Anexo[] = [];
    const others: Anexo[] = [];
    anexos.forEach((anexo: Anexo) => anexo.mimetype?.startsWith('image/') ? images.push(anexo) : others.push(anexo));
    return { imageAnexos: images, otherAnexos: others };
  }, [anexos]);

  const shouldShowCarousel = imageAnexos.length > 1;
  const listItems = shouldShowCarousel ? otherAnexos : anexos;

  return (
    <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Anexos ({anexos.length})</CardTitle>
                <Button onClick={() => setShowUploader(true)} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Anexo
                </Button>
            </CardHeader>
            <CardContent className="pt-4">
                {loading && <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className='ml-3'>Carregando...</p></div>}
                {!loading && anexos.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum anexo encontrado.</p>}
                {!loading && anexos.length > 0 && (
                <div className="flex flex-col space-y-4">
                    {shouldShowCarousel && (
                    <div className="w-full">
                        <h3 className="text-lg font-semibold mb-3 px-1">Imagens</h3>
                        <Carousel setApi={setCarouselApi} className="w-full max-w-full mx-auto">
                        <CarouselContent>
                            {imageAnexos.map((anexo: Anexo) => (
                            <CarouselItem key={anexo.id} className="basis-1/2 md:basis-1/3">
                                <div className="p-1">
                                <Card className='overflow-hidden group'>
                                    <CardContent
                                    className="relative aspect-square flex items-center justify-center p-0 cursor-pointer"
                                    onClick={() => openPreviewModal(anexo)}
                                    >
                                    <Image src={createAnexoUrl(anexo.id)} alt={anexo.nomeArquivo} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 33vw" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="h-8 w-8 text-white" /></div>
                                    </CardContent>
                                </Card>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-8" />
                        <CarouselNext className="-right-8" />
                        </Carousel>
                        <div className="py-2 text-center text-sm text-muted-foreground">{currentSlide} de {slideCount}</div>
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
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <Button variant="secondary" size="sm" onClick={() => openPreviewModal(anexo)}><Eye className="mr-2 h-4 w-4" />Visualizar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => setAnexoToDelete(anexo)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                </div>
                )}
            </CardContent>
        </Card>

        {showUploader && <AnexoUploader consultaId={consultaId} onAnexoAdicionado={handleAnexoAdicionado} onClose={() => setShowUploader(false)} />}
        
        <AnexoPreviewModal open={showPreview} onOpenChange={setShowPreview} consultaId={consultaId} anexo={selectedAnexo} />

        <AlertDialog open={!!anexoToDelete} onOpenChange={() => setAnexoToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>Tem certeza que deseja excluir o anexo "{anexoToDelete?.nomeArquivo}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAnexo}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
