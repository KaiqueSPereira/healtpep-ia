"use client";
import { useState, useEffect } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";
import { Agendamento } from "@/app/_components/types";
import { Button } from "@/app/_components/ui/button"; // Importando Button

interface AgendamentosListProps {
  userId: string;
}

const AgendamentosList = ({ userId }: AgendamentosListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<Agendamento[]>(
    [],
  );
  const [agendamentosPassados, setAgendamentosPassados] = useState<
    Agendamento[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendamentos = async () => { // Função de busca
    setLoading(true);
    try {
      const res = await fetch(`/api/consultas?userId=${userId}`);
      if (!res.ok) throw new Error("Erro ao buscar agendamentos");

      const { consultas } = await res.json();
      const agora = new Date();

      // Debug logs
      console.log("Debug - Consultas recebidas da API:", consultas);
      console.log("Debug - Agora:", agora);


      const futuros = consultas.filter(
        (agendamento: Agendamento) => new Date(agendamento.data) >= agora,
      );

      // Debug log
      console.log("Debug - Agendamentos futuros:", futuros);


      // Filtrar agendamentos passados
      const passados = consultas.filter(
        (agendamento: Agendamento) => new Date(agendamento.data) < agora,
      );

      // Debug log
      console.log("Debug - Agendamentos passados (todos):", passados);

      // Ordenar agendamentos passados por data decrescente e pegar os 5 mais recentes
      const ultimos5Passados = passados
        .sort(
          (a: Agendamento, b: Agendamento) =>
            new Date(b.data).getTime() - new Date(a.data).getTime(),
        )
        .slice(0, 5);

      // Debug log
      console.log("Debug - Últimas 5 consultas passadas:", ultimos5Passados);


      setAgendamentosFuturos(futuros);
      setAgendamentosPassados(ultimos5Passados); // Usar os 5 mais recentes
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      toast({title: "Erro ao carregar as consultas.", variant: "destructive", duration: 5000});
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!userId) return;
    fetchAgendamentos(); // Busca inicial ao montar o componente ou mudar o userId
  }, [userId]); // Dependência do userId

  // Função para ser chamada pelo botão de atualização
  const handleRefreshClick = () => {
    fetchAgendamentos();
  };


  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando agendamentos...</p>
      ) : (
        <>
           {/* Botão discreto para recarregar */}
           <div className="flex justify-end mb-2"> {/* Posição ajustável */}
              <Button
                 variant="ghost" // Para ser discreto
                 size="sm" // Tamanho pequeno
                 onClick={handleRefreshClick}
                 className="text-gray-500 hover:text-gray-700" // Estilo discreto
              >
                 Recarregar {/* Substitua por um ícone se preferir */}
              </Button>
           </div>

          <AgendamentoSection
            title="Agendamentos"
            agendamentos={agendamentosFuturos}
          />
          <AgendamentoSection
            title="Últimas Consultas"
            agendamentos={agendamentosPassados} // Agora agendamentosPassados contém apenas os 5 mais recentes ordenados
          />
        </>
      )}
    </div>
  );
};

interface AgendamentoSectionProps {
  title: string;
  agendamentos: Agendamento[];
}

const AgendamentoSection = ({
  title,
  agendamentos,
}: AgendamentoSectionProps) => (
  <div className="mt-5">
    <h2 className="text-xs font-bold uppercase text-gray-400">{title}</h2>
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
      {agendamentos.length > 0 ? (
        agendamentos.map((agendamento) => (
          <AgendamentoItem key={agendamento.id} consultas={agendamento} />
        ))
      ) : (
        <p className="text-gray-500">Nenhum {title.toLowerCase()}.</p>
      )}
    </div>
  </div>
);

export default AgendamentosList;
