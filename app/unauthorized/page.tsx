
import { Button } from '@/app/_components/ui/button';
import Link from 'next/link';

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Acesso Negado</h1>
      <p className="text-lg mb-8">Você não tem permissão para visualizar esta página.</p>
      <Button asChild>
        <Link href="/">Voltar para a Página Inicial</Link>
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
