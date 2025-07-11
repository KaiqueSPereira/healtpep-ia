"use client";
import { useState, useEffect } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";
import { Agendamento } from "@/app/_components/types";

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

  useEffect(() => {
    if (!userId) return;

    const fetchAgendamentos = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/consultas?userId=${userId}`);
        if (!res.ok) throw new Error("Erro ao buscar agendamentos");

        const { consultas } = await res.json();
        const agora = new Date();

        const futuros = consultas.filter(
          (agendamento: Agendamento) => new Date(agendamento.data) >= agora,
        );

        // Filtrar agendamentos passados
        const passados = consultas.filter(
          (agendamento: Agendamento) => new Date(agendamento.data) < agora,
        );

        // Ordenar agendamentos passados por data decrescente e pegar os 5 mais recentes
        const ultimos5Passados = passados
          .sort(
            (a: Agendamento, b: Agendamento) =>
              new Date(b.data).getTime() - new Date(a.data).getTime(),
          )
          .slice(0, 5);


        setAgendamentosFuturos(futuros);
        setAgendamentosPassados(ultimos5Passados); // Usar os 5 mais recentes
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        toast({title: "Erro ao carregar as consultas.", variant: "destructive", duration: 5000});
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentos();
  }, [userId]);

  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando agendamentos...</p>
      ) : (
        <>
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
