"use client";
import { useState, useEffect } from "react"; // Importa hooks
import { db } from "@/app/_lib/prisma";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";

interface AgendamentosListProps {
  userId: string;
}

const AgendamentosList = ({ userId }: AgendamentosListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<any[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<any[]>([]);

  useEffect(() => {
    // Função assíncrona dentro do useEffect
    const fetchAgendamentos = async () => {
      try {
        const agendamentos = await db.consultas.findMany({
          where: { userId }, // Filtra os agendamentos pelo userId
          include: {
            profissional: { select: { nome: true } },
            unidade: { select: { nome: true } },
          },
          orderBy: { data: "asc" },
        });

        // Filtra agendamentos futuros e passados
        const agendamentosFuturos = agendamentos.filter((agendamento) => {
          const dataAgendamento = new Date(agendamento.data);
          if (isNaN(dataAgendamento.getTime())) {
            console.error(`Data inválida para o agendamento ${agendamento.id}`);
            return false;
          }
          return dataAgendamento >= new Date();
        });

        const agendamentosPassados = agendamentos.filter((agendamento) => {
          const dataAgendamento = new Date(agendamento.data);
          if (isNaN(dataAgendamento.getTime())) {
            console.error(`Data inválida para o agendamento ${agendamento.id}`);
            return false;
          }
          return dataAgendamento < new Date();
        });

        // Atualiza o estado com os agendamentos filtrados
        setAgendamentosFuturos(agendamentosFuturos);
        setAgendamentosPassados(agendamentosPassados);

        // Exibe toast se não houver agendamentos futuros
        if (agendamentosFuturos.length === 0) {
          toast({
            title: "Sem agendamentos futuros.",
            variant: "default",
          });
        }

        // Exibe toast se não houver agendamentos passados
        if (agendamentosPassados.length === 0) {
          toast({
            title: "Sem últimas consultas.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar as consultas.",
          variant: "destructive",
        });
        setAgendamentosFuturos([]);
        setAgendamentosPassados([]);
      }
    };

    fetchAgendamentos(); // Chama a função de fetch
  }, [userId]); // Dependência: executa novamente quando userId mudar

  return (
    <div>
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Agendamentos
          </h2>
        </div>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {agendamentosFuturos.map((agendamento) => (
            <AgendamentoItem
              key={agendamento.id}
              consultas={agendamento}
              profissional={agendamento.profissional?.nome || "Desconhecido"}
              unidade={agendamento.unidade?.nome || "Desconhecida"}
            />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <h2 className="text-xs font-bold uppercase text-gray-400">
          Últimas Consultas
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {agendamentosPassados.map((agendamento) => (
            <AgendamentoItem
              key={agendamento.id}
              consultas={agendamento}
              profissional={agendamento.profissional?.nome || "Desconhecido"}
              unidade={agendamento.unidade?.nome || "Desconhecida"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendamentosList;
