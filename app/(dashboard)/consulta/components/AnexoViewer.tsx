'use client';

import { Button } from '@/app/_components/ui/button';
import { Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Anexo } from '@/app/_components/types';

interface AnexoViewerProps {
  anexo: Anexo;
  anexoUrl: string;
}

export default function AnexoViewer({ anexo, anexoUrl }: AnexoViewerProps) {
  const { mimetype, nomeArquivo } = anexo;
  const isImage = mimetype?.startsWith('image/');
  const isPdf = mimetype === 'application/pdf';

  let viewer;

  if (isImage) {
    viewer = (
      <div className="relative w-full h-[70vh] flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
        <Image src={anexoUrl} alt={nomeArquivo} fill className="object-contain" sizes="(max-width: 1280px) 90vw, 80vw" />
      </div>
    );
  } else if (isPdf) {
    viewer = (
      <object data={anexoUrl} type="application/pdf" className="w-full h-[75vh] rounded-md">
        <div className='w-full h-full flex flex-col items-center justify-center bg-muted/20 rounded-md p-4'>
          <p className='text-center'>Seu navegador não pode exibir este PDF.</p>
          <Button asChild className='mt-4'><Link href={anexoUrl} download><Download className='mr-2 h-4 w-4' />Baixar PDF</Link></Button>
        </div>
      </object>
    );
  } else {
    viewer = <iframe src={anexoUrl} className="w-full h-[75vh] border rounded-md bg-white" title="Visualizador de Anexo" />;
  }

  return (
    <div className="w-full flex flex-col">
      {viewer}
      <Button asChild variant='link' className='mt-2 text-muted-foreground self-center'>
        <Link href={anexoUrl} target="_blank" download><Download className='mr-2 h-4 w-4' />Se o arquivo não abrir, clique para baixar.</Link>
      </Button>
    </div>
  );
}
