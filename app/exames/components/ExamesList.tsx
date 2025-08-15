// app/exames/components/ExamesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { toast } from "@/app/_hooks/use-toast";
import { Exame } from "@/app/_components/types";
import { Button } from "@/app/_components/ui/button";
import ExameSection from "./ExameSection";

interface ExamesListProps {
  userId: string;
}

const ExamesList = ({ userId }: ExamesListProps) => {
  const [futurosExames, setFuturosExames] = useState<Exame[]>([]);
  const [ultimos5PassadosExames, setUltimos5PassadosExames] = useState<
    Exame[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchExames = useCallback(async () => { // Use useCallback
    setLoading(true);
    try {
      const resExames = await fetch(`/api/exames?userId=${userId}`);
      if (!resExames.ok) throw new Error("Erro ao buscar exames");
      const examesData: Exame[] = await resExames.json();

      const examesComDatasConvertidas = examesData.map((exame) => ({
        ...exame,
        dataExame: new Date(exame.dataExame),
      }));

      const agora = new Date();

      const futurosExames = examesComDatasConvertidas.filter(
        (exame: Exame) => exame.dataExame >= agora,
      );
      const passadosExames = examesComDatasConvertidas.filter(
        (exame: Exame) => exame.dataExame < agora,
      );
      const ultimos5PassadosExamesOrdenados = passadosExames
        .sort((a: Exame, b: Exame) => b.dataExame.getTime() - a.dataExame.getTime())
        .slice(0, 5);

      setFuturosExames(futurosExames);
      setUltimos5PassadosExames(ultimos5PassadosExamesOrdenados);
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
  }, [userId]); // fetchExames now only depends on userId

  useEffect(() => {
    if (!userId) return;
    fetchExames();
  }, [userId, fetchExames]); // Keep fetchExames here as it's a dependency of useEffect

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

          <ExameSection title="Proximos Exames" exames={futurosExames} />

          <ExameSection title="Últimos Exames " exames={ultimos5PassadosExames} />
        </>
      )}
    </div>
  );
};

export default ExamesList;
