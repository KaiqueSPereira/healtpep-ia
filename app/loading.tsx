
import { Loader2 } from 'lucide-react';

// Este componente será exibido automaticamente pelo Next.js durante a navegação
// e o carregamento inicial da página.
export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 
        Esta div cresce para ocupar todo o espaço disponível, 
        empurrando o Footer para o final da tela.
      */}
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    </div>
  );
}
