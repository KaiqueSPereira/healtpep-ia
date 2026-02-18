// app/exames/components/ExamesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import ExameItem from './ExameItem';
import { Skeleton } from "@/app/_components/ui/skeleton";

interface ExamesListProps {
  userId: string;
}

type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
  _count?: { anexos: number }; 
};

interface ApiResponse {
  exames: ExameComRelacoes[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Função para enviar logs de erro para o servidor
const logErrorToServer = async (error: Error, componentName: string) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Erro no frontend: ${error.message}`,
        level: 'error',
        component: componentName,
        stack: error.stack,
      }),
    });
  } catch (loggingError) {
    console.error("Falha ao enviar log para o servidor:", loggingError);
  }
};

const ExamesList = ({ userId }: ExamesListProps) => {
  const [futurosExames, setFuturosExames] = useState<ExameComRelacoes[]>([]);
  const [ultimos5PassadosExames, setUltimos5PassadosExames] = useState<ExameComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resExames = await fetch(`/api/exames?userId=${userId}`);
      if (!resExames.ok) {
        throw new Error(`Falha na API: ${resExames.status} ${resExames.statusText}`);
      }
      
      const responseData: ApiResponse = await resExames.json();
      const examesData = responseData.exames;

      if (!Array.isArray(examesData)) {
        throw new Error("Formato de dados de exames inesperado.");
      }

      const agora = new Date();
      
      const futuros = examesData
        .filter(exame => exame.dataExame && new Date(exame.dataExame) >= agora)
        .sort((a, b) => new Date(a.dataExame!).getTime() - new Date(b.dataExame!).getTime());
      
      const passados = examesData
        .filter(exame => exame.dataExame && new Date(exame.dataExame) < agora);

      const ultimos5PassadosOrdenados = passados
        .sort((a, b) => new Date(b.dataExame!).getTime() - new Date(a.dataExame!).getTime())
        .slice(0, 5);

      setFuturosExames(futuros);
      setUltimos5PassadosExames(ultimos5PassadosOrdenados);

    } catch (err) {
        const errorMessage = "Ocorreu um problema ao carregar seus exames.";
        setError(errorMessage);
        if (err instanceof Error) {
            console.error("Erro detalhado ao buscar exames:", err);
            logErrorToServer(err, "ExamesList");
        }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchExames();
    }
  }, [userId, fetchExames]);

  const renderSkeletons = () => (
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-64 rounded-lg" />)}
    </div>
  );

  if (loading) {
    return (
        <div>
            <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" disabled>Recarregar</Button>
            </div>
            <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">Próximos Exames</h2>
            {renderSkeletons()}
            <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">Últimos Exames</h2>
            {renderSkeletons()}
        </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchExames} className="mt-4">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div>
        <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={fetchExames} className="text-gray-500 hover:text-gray-700">Recarregar</Button>
        </div>
        <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">Próximos Exames</h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
            {futurosExames.length > 0 ? (
                futurosExames.map((exame) => <ExameItem key={exame.id} exame={exame} />)
            ) : (
                <p className="text-sm text-gray-500">Nenhum exame agendado.</p>
            )}
            </div>
        </div>

        <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">Últimos Exames</h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
            {ultimos5PassadosExames.length > 0 ? (
                ultimos5PassadosExames.map((exame) => <ExameItem key={exame.id} exame={exame} />)
            ) : (
                <p className="text-sm text-gray-500">Nenhum exame realizado recentemente.</p>
            )}
            </div>
        </div>
    </div>
  );
};

export default ExamesList;
