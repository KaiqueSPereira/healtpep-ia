'use client';
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";
import { Button } from "@/app/_components/ui/button";
import { Consultas, Profissional, UnidadeDeSaude, Consultatype } from "@prisma/client";

type ConsultaComRelacoes = Consultas & { 
    profissional: Profissional | null; 
    unidade: UnidadeDeSaude | null; 
};

export type AgendamentoUnificado = {
  id: string;
  data: string;
  nomeProfissional: string;
  especialidade: string;
  local: string;
  tipo: 'Consulta' | 'Exame';
  tipoConsulta?: Consultatype;
  userId: string;
};

interface AgendamentosListProps {
  userId: string;
}

const AgendamentosList = ({ userId }: AgendamentosListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<AgendamentoUnificado[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<AgendamentoUnificado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const [consultasRes] = await Promise.all([
        fetch(`/api/consultas?userId=${userId}`),
      ]);

      if (!consultasRes.ok) {
        throw new Error("Erro ao buscar agendamentos");
      }

      const consultas: ConsultaComRelacoes[] = await consultasRes.json();

      const consultasMapeadas: AgendamentoUnificado[] = consultas.map(c => ({
        id: c.id,
        data: c.data as unknown as string,
        nomeProfissional: c.profissional?.nome || 'Não especificado',
        especialidade: c.profissional?.especialidade || 'Clínico Geral',
        local: c.unidade?.nome || 'Local não especificado',
        tipo: 'Consulta',
        tipoConsulta: c.tipo,
        userId: c.userId,
      }));

      const todosAgendamentos = [...consultasMapeadas];
      const agora = new Date();

      const futuros = todosAgendamentos
        .filter(ag => new Date(ag.data) >= agora)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      const passados = todosAgendamentos
        .filter(ag => new Date(ag.data) < agora)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setAgendamentosFuturos(futuros);
      setAgendamentosPassados(passados.slice(0, 5));

    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast({ title: "Erro ao carregar os agendamentos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAgendamentos();
    }
  }, [userId, fetchAgendamentos]);
  
  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando agendamentos...</p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAgendamentos}
              className="text-gray-500 hover:text-gray-700"
            >
              Recarregar
            </Button>
          </div>
          <AgendamentoSection
            title="Próximos Agendamentos"
            agendamentos={agendamentosFuturos}
          />
          <AgendamentoSection
            title="Últimoas Consultas"
            agendamentos={agendamentosPassados}
          />
        </>
      )}
    </div>
  );
};

interface AgendamentoSectionProps {
  title: string;
  agendamentos: AgendamentoUnificado[];
}

const AgendamentoSection = ({ title, agendamentos }: AgendamentoSectionProps) => (
  <div className="mt-5">
    <h2 className="text-xs font-bold uppercase text-gray-400">{title}</h2>
    <div className="flex gap-4 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden">
      {agendamentos.length > 0 ? (
        agendamentos.map((agendamento) => (
          <AgendamentoItem key={`${agendamento.tipo}-${agendamento.id}`} agendamento={agendamento} />
        ))
      ) : (
        <p className="text-sm text-gray-500">Nenhum evento encontrado.</p>
      )}
    </div>
  </div>
);

export default AgendamentosList;
