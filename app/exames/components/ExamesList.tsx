// app/exames/components/ExamesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import ExameItem from './ExameItem'; // Importando ExameItem diretamente

interface ExamesListProps {
  userId: string;
}

// Adicionando a contagem de anexos para consistência com o ExameItem
type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
  _count?: { anexos: number }; 
};

const ExamesList = ({ userId }: ExamesListProps) => {
  const [futurosExames, setFuturosExames] = useState<ExameComRelacoes[]>([]);
  const [ultimos5PassadosExames, setUltimos5PassadosExames] = useState<ExameComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExames = useCallback(async () => {
    setLoading(true);
    try {
      const resExames = await fetch(`/api/exames?userId=${userId}`);
      if (!resExames.ok) throw new Error("Erro ao buscar exames");
      const examesData: ExameComRelacoes[] = await resExames.json();

      const agora = new Date();

      const futuros = examesData
        .filter((exame) => new Date(exame.dataExame) >= agora)
        .sort((a, b) => new Date(a.dataExame).getTime() - new Date(b.dataExame).getTime());

      const passados = examesData.filter(
        (exame) => new Date(exame.dataExame) < agora
      );
      
      const ultimos5PassadosOrdenados = passados
        .sort((a, b) => new Date(b.dataExame).getTime() - new Date(a.dataExame).getTime())
        .slice(0, 5);

      setFuturosExames(futuros);
      setUltimos5PassadosExames(ultimos5PassadosOrdenados);

    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({
        title: "Erro ao carregar os exames.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchExames();
  }, [userId, fetchExames]);

  const handleRefreshClick = () => {
    fetchExames();
  };

  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando exames...</p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshClick}
              className="text-gray-500 hover:text-gray-700"
            >
              Recarregar Exames
            </Button>
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">Próximos Exames</h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
              {futurosExames.length > 0 ? (
                futurosExames.map((exame) => (
                  <ExameItem key={exame.id} exame={exame} />
                ))
              ) : (
                <p className="text-gray-500">Nenhum exame encontrado.</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">Últimos Exames</h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
              {ultimos5PassadosExames.length > 0 ? (
                ultimos5PassadosExames.map((exame) => (
                  <ExameItem key={exame.id} exame={exame} />
                ))
              ) : (
                <p className="text-gray-500">Nenhum exame encontrado.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamesList;
