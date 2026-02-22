'use client';

import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ExameFormWrapper } from '../../components/ExameFormWrapper';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/app/_hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/app/_components/ui/button';
import { Exame, Profissional, UnidadeDeSaude, ResultadoExame } from '@prisma/client';

type ExameComRelacoes = Exame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: UnidadeDeSaude | null;
};

export default function EditExamePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [existingExamData, setExistingExamData] = useState<ExameComRelacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      setError('ID do exame não fornecido para edição.');
      toast({
        title: 'Erro',
        description: 'ID do exame não fornecido para edição.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    const fetchExame = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/exames/${examId}`);
        const data = await res.json();

        if (res.ok) {
          setExistingExamData(data.exame);
        } else {
          const errorMessage = data.error || 'Erro ao carregar dados do exame.';
          setError(errorMessage);
          toast({
            title: 'Erro ao Carregar',
            description: errorMessage,
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar exame:', err);
        const errorMessage = 'Falha na comunicação com o servidor.';
        setError(errorMessage);
        toast({
          title: 'Erro de Conexão',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExame();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    const isUnauthorized = error.toLowerCase().includes('não autorizado') || error.toLowerCase().includes('acesso negado');
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 min-h-[50vh]">
        <Image
          src={isUnauthorized ? "/unauthorized-no-bg.png" : "/Exam-notfound.png"}
          alt={isUnauthorized ? "Acesso não autorizado" : "Erro ao carregar exame"}
          width={250}
          height={250}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold">{isUnauthorized ? "Acesso Negado" : "Ocorreu um Erro"}</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">Voltar</Button>
      </div>
    );
  }

  if (!existingExamData) {
     return (
       <div className="flex flex-col items-center justify-center text-center p-12 min-h-[50vh]">
        <Image
          src="/Exam-notfound.png"
          alt="Nenhum exame encontrado"
          width={250}
          height={250}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold">Exame Não Encontrado</h2>
        <p className="text-muted-foreground mt-2">
          Não foi possível encontrar dados de exame para o ID fornecido.
        </p>
         <Button variant="outline" onClick={() => router.back()} className="mt-6">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/20">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-gray-600" />}>
        <ExameFormWrapper existingExamData={existingExamData} />
      </Suspense>
    </div>
  );
}
