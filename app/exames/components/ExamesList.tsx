// app/consulta/components/ExamesList.tsx ou app/exames/components/ExamesList.tsx
"use client";
import { useState, useEffect } from "react";
import { toast } from "@/app/_hooks/use-toast";
import { Profissional, Unidade, Tratamento, Exame as ExameInterface } from "@/app/_components/types"; // Importe os tipos necessários, renomeando Exame para evitar conflito
import { Button } from "@/app/_components/ui/button";
import ExameSection from "./ExameSection";

// Use a interface importada do types.ts
type Exame = ExameInterface;


interface ExamesListProps {
  userId: string;
}

const ExamesList = ({ userId }: ExamesListProps) => {
  // Estados para Exames
  // Removido allExames se não for usado
  const [futurosExames, setFuturosExames] = useState<Exame[]>([]); // Exames futuros
  const [ultimos5PassadosExames, setUltimos5PassadosExames] = useState<Exame[]>([]); // Últimos 5 exames passados

  const [loading, setLoading] = useState(true);

  const fetchExames = async () => { // Função de busca de exames
    setLoading(true);
    try {
      // Buscar Exames
      // Assumindo que sua API de exames aceita userId
      const resExames = await fetch(`/api/exames?userId=${userId}`);
      if (!resExames.ok) throw new Error("Erro ao buscar exames");
      // Sua API de exames retorna um array diretamente, não um objeto com { exames: [...] }
      const examesData: Exame[] = await resExames.json(); // Dados recebidos da API (dataExame ainda é string)
      console.log("Debug - Exames recebidos da API (antes da conversão):", examesData); // Log de debug


      // Converter dataExame de string para Date em cada objeto Exame
      const examesComDatasConvertidas = examesData.map(exame => ({
          ...exame,
          dataExame: new Date(exame.dataExame), // Converter para Date
      }));

      console.log("Debug - Exames com datas convertidas:", examesComDatasConvertidas); // Log de debug

      const agora = new Date();
      console.log("Debug - Agora:", agora); // Log de debug


      // Processar Exames com datas convertidas
      const futurosExames = examesComDatasConvertidas.filter(
        (exame: Exame) => exame.dataExame >= agora, // Comparar objetos Date
      );
      const passadosExames = examesComDatasConvertidas.filter(
        (exame: Exame) => exame.dataExame < agora, // Comparar objetos Date
      );
       // Ordenar exames passados por data decrescente e pegar os 5 mais recentes
      const ultimos5PassadosExamesOrdenados = passadosExames
        .sort(
          (a: Exame, b: Exame) =>
            b.dataExame.getTime() - a.dataExame.getTime(), // Comparar timestamps
        )
        .slice(0, 5);


      // setAllExames(examesComDatasConvertidas); // Se allExames for necessário
      setFuturosExames(futurosExames);
      setUltimos5PassadosExames(ultimos5PassadosExamesOrdenados);


    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({title: "Erro ao carregar os exames.", variant: "destructive", duration: 5000});
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!userId) return;
    fetchExames(); // Busca inicial
  }, [userId]);


  const handleRefreshClick = () => {
    fetchExames(); // Recarrega exames
  };


  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando exames...</p>
      ) : (
        <>
           {/* Botão discreto para recarregar */}
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

          {/* Seção de Exames Futuros */}
           <ExameSection
             title="Proximos Exames"
             exames={futurosExames} // Passa a lista de exames futuros
           />

          {/* Seção de Últimos Exames Passados */}
           <ExameSection
             title="Últimos Exames "
             exames={ultimos5PassadosExames} // Passa a lista dos últimos 5 exames passados
           />
        </>
      )}
    </div>
  );
};

export default ExamesList;
