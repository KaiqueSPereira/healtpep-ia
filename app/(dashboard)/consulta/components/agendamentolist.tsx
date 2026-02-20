'use client';
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "./agendamentosItem";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Consultas, Profissional, UnidadeDeSaude, Consultatype } from "@prisma/client";

// Tipos permanecem os mesmos
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
  // O userId não é mais necessário aqui, mas mantemos por enquanto para não quebrar a chamada no dashboard
  userId: string;
}

const AgendamentosList = ({ userId }: AgendamentosListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<AgendamentoUnificado[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<AgendamentoUnificado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      // 1. A chamada da API foi alterada para o novo endpoint otimizado
      const res = await fetch(`/api/consultas?get=dashboard`);

      if (!res.ok) {
        throw new Error("Erro ao buscar agendamentos");
      }

      // 2. A resposta agora é um objeto com as chaves 'futuros' e 'passados'
      const { futuros, passados }: { futuros: ConsultaComRelacoes[], passados: ConsultaComRelacoes[] } = await res.json();

      // 3. A lógica de mapeamento é aplicada a cada array separadamente
      const mapToAgendamento = (c: ConsultaComRelacoes): AgendamentoUnificado => ({
        id: c.id,
        data: c.data as unknown as string,
        nomeProfissional: c.profissional?.nome || 'Não especificado',
        especialidade: c.profissional?.especialidade || 'Clínico Geral',
        local: c.unidade?.nome || 'Local não especificado',
        tipo: 'Consulta',
        tipoConsulta: c.tipo,
        userId: c.userId,
      });

      // 4. Os estados são atualizados diretamente com os dados da API
      // A lógica de filtro, sort e slice foi removida porque a API já faz isso.
      setAgendamentosFuturos(futuros.map(mapToAgendamento));
      setAgendamentosPassados(passados.map(mapToAgendamento));

    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast({ title: "Erro ao carregar os agendamentos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []); // userId foi removido das dependências

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  const renderSkeletons = () => (
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-64 rounded-lg" />)}
    </div>
  );
  
  if (loading) {
    return (
        <div>
            <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" disabled>Recarregar</Button>
            </div>
            <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">Próximos Agendamentos</h2>
            {renderSkeletons()}
            <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">Últimas Consultas</h2>
            {renderSkeletons()}
        </div>
    );
  }
  
  return (
    <div>
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
        title="Últimas Consultas"
        agendamentos={agendamentosPassados}
      />
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
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
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
