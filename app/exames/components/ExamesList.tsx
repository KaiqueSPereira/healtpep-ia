// app/exames/components/ExamesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
// CORREÇÃO: Importa os tipos corretos diretamente do Prisma
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import ExameSection from "./ExameSection";

interface ExamesListProps {
  userId: string;
}

// CORREÇÃO: Cria um tipo que representa um Exame com as suas relações
type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
};

const ExamesList = ({ userId }: ExamesListProps) => {
  // CORREÇÃO: Utiliza o novo tipo para o estado
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

      const futuros = examesData.filter(
        (exame) => new Date(exame.dataExame) >= agora
      );
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

          <ExameSection title="Próximos Exames" exames={futurosExames} />

          <ExameSection title="Últimos 5 Exames" exames={ultimos5PassadosExames} />
        </>
      )}
    </div>
  );
};

export default ExamesList;
