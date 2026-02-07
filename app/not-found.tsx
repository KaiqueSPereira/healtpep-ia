
'use client';

import Link from 'next/link';
import Lottie from 'lottie-react';

import { Button } from '@/app/_components/ui/button';

// URL para uma animação Lottie gratuita que se encaixa no tema "página não encontrada"
const animationData = "https://lottie.host/8a73b5f0-9759-4786-905b-a8f89553f49c/V9e3T8yKl7.json";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
        <div className="grid items-center justify-center gap-8 px-4 text-center md:grid-cols-2 md:text-left">
            
            {/* Coluna da Animação */}
            <div className="max-w-md mx-auto">
                <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Coluna do Texto */}
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
                    Oops! Página não encontrada.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Parece que você se perdeu. A página que você está procurando não existe ou foi movida.
                </p>
                <Button asChild>
                    <Link href="/">Voltar para a Página Inicial</Link>
                </Button>
            </div>

        </div>
    </div>
  );
}
