
import { Button } from '@/app/_components/ui/button';
import Link from 'next/link';
import Header from '../_components/header';
import Image from 'next/image';

const UnauthorizedPage = () => {
  return (
    <main className="flex flex-col flex-grow">
      <Header/>
      {
        /* 
          Container principal com fundo escuro e layout flex.
          Ele centraliza o conteúdo vertical e horizontalmente.
        */
      }
      <div className="flex flex-grow items-center justify-center p-4 md:p-8">
        
        {/* Layout de duas colunas que se empilham em telas pequenas */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-8 w-full max-w-6xl">

          {/* Coluna 1: Texto */}
          <div className="max-w-md text-white text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-destructive mb-4">
              Sem acesso autorizado
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Você não tem permissão para acessar este recurso.
            </p>
            <Button variant="destructive" asChild>
              <Link href="/">Voltar para o Início</Link>
            </Button>
          </div>

          {/* Coluna 2: Imagem (sem cortes) */}
          <div className="w-full max-w-sm md:max-w-lg">
            <Image 
              src="/unauthorized-no-bg.png" // <-- Certifique-se que o nome do arquivo está correto!
              alt="Ilustração de acesso negado"
              width={600}
              height={600}
              className="w-full h-auto object-contain"
            />
          </div>

        </div>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
