"use client";
import { useState, useEffect } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";

interface Agendamento {
  id: string;
  data: string;
  tipo: string;
  profissional?: { nome: string };
  unidade?: {
    nome: string;
  };
}

interface AgendamentosListProps {
  userId: string;
}

const AgendamentosList = ({ userId }: AgendamentosListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<Agendamento[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const res = await fetch("/api/agendamento");
        if (!res.ok) throw new Error("Erro ao buscar agendamentos");

        const agendamentos = await res.json();

        const agora = new Date();

        const futuros = agendamentos.filter(
          (agendamento: Agendamento) => new Date(agendamento.data) >= agora,
        );
        const passados = agendamentos.filter(
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
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">
              Agendamentos
            </h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
              {agendamentosFuturos.length > 0 ? (
                agendamentosFuturos.map((agendamento) => (
                  <AgendamentoItem
                    key={agendamento.id}
                    consultas={agendamento}
                    profissional={
                      agendamento.profissional?.nome || "Desconhecido"
                    }
                    unidade={agendamento.unidade?.nome || "Desconhecida"}
                  />
                ))
              ) : (
                <p className="text-gray-500">Nenhum agendamento futuro.</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase text-gray-400">
              Últimas Consultas
            </h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
              {agendamentosPassados.length > 0 ? (
                agendamentosPassados.map((agendamento) => (
                  <AgendamentoItem
                    key={agendamento.id}
                    consultas={agendamento}
                    profissional={
                      agendamento.profissional?.nome || "Desconhecido"
                    }
                    unidade={agendamento.unidade?.nome || "Desconhecida"}
                  />
                ))
              ) : (
                <p className="text-gray-500">Nenhuma consulta passada.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgendamentosList;
