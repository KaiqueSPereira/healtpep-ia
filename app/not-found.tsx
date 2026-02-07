
'use client';

import { Button } from "@/app/_components/ui/button";
import { useRouter } from "next/navigation";
import Header from "./_components/header";
import React from 'react';
import Image from 'next/image'; // Importando o componente de Imagem do Next.js

const NotFound = () => {
    const router = useRouter();

    return (
        <React.Fragment>
            <Header />

            {/* 
              Container principal para o layout de duas colunas.
              - Empilha verticalmente em telas pequenas (flex-col)
              - Fica lado a lado em telas médias e maiores (md:flex-row)
            */}
            <div className="flex flex-grow flex-col md:flex-row items-center justify-center p-5 gap-8">
                
                {/* Coluna da Esquerda: Conteúdo de Texto */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                    <h1 className="text-6xl lg:text-8xl font-bold text-primary mb-4">404</h1>
                    <h2 className="text-3xl lg:text-4xl font-semibold mb-3">Oops! Esta página não foi encontrada</h2>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        A página que você estava procurando não existe. Ela pode ter sido movida ou removida.
                    </p>
                    <Button onClick={() => router.push('/')} className="text-lg py-3 px-6">
                        Voltar para o Início
                    </Button>
                </div>

                {/* Coluna da Direita: Imagem */}
                <div className="w-full md:w-1/2 flex items-center justify-center">
                    <Image
                        src="/electrician-404.png" // O código espera a imagem aqui: public/electrician-404.png
                        alt="Eletricista segurando um cabo de energia desconectado"
                        width={500}
                        height={500}
                        className="max-w-xs md:max-w-sm lg:max-w-md"
                        priority // Otimiza o carregamento da imagem
                    />
                </div>
            </div>
        </React.Fragment>
    );
};

export default NotFound;
