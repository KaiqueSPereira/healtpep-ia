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

        const { consultas } = await res.json(); // Ajuste para a estrutura da nova API
        const agora = new Date();

        const futuros = consultas.filter(
          (agendamento: Agendamento) => new Date(agendamento.data) >= agora,
        );
        const passados = consultas.filter(
          (agendamento: Agendamento) => new Date(agendamento.data) < agora,
        );

        setAgendamentosFuturos(futuros);
        setAgendamentosPassados(passados);
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        toast({
          title: "Erro ao carregar as consultas.",
          variant: "destructive",
        });
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
            agendamentos={agendamentosPassados}
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
