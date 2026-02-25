
"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/app/_hooks/use-toast";
import AgendamentoItem from "../consulta/components/agendamentosItem";
import ExameItem from "../exames/components/ExameItem";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import type {
  Consultas,
  Exame,
  Profissional,
  UnidadeDeSaude,
  Consultatype,
} from "@prisma/client";

// Tipos Combinados
type ConsultaComRelacoes = Consultas & {
  profissional: Profissional | null;
  unidade: UnidadeDeSaude | null;
};

type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
};

// Tipo Unificado para Eventos (usado em Próximos Eventos)
export type EventoUnificado = {
  id: string;
  data: Date;
  tipo: "Consulta" | "Exame";
  nome: string; // Nome do exame ou tipo da consulta
  local: string;
  profissional?: string;
  original: ConsultaComRelacoes | ExameComRelacoes;
};

interface AgendaListProps {
  userId: string;
}

const AgendaList = ({ userId }: AgendaListProps) => {
  const [proximosEventos, setProximosEventos] = useState<EventoUnificado[]>([]);
  const [consultasPassadas, setConsultasPassadas] = useState<
    ConsultaComRelacoes[]
  >([]);
  const [examesPassados, setExamesPassados] = useState<ExameComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const [resConsultas, resExames] = await Promise.all([
        fetch(`/api/consultas?get=dashboard`),
        fetch(`/api/exames?userId=${userId}`),
      ]);

      if (!resConsultas.ok || !resExames.ok) {
        throw new Error("Erro ao buscar eventos");
      }

      const { futuros: consultasFuturas, passados: consultasPassadasData } =
        await resConsultas.json();
      const { exames: todosExames } = await resExames.json();
      
      const agora = new Date();

      const examesFuturos = todosExames.filter(
        (ex: Exame) => ex.dataExame && new Date(ex.dataExame) >= agora
      );
      const examesPassadosData = todosExames
        .filter((ex: Exame) => ex.dataExame && new Date(ex.dataExame) < agora)
        .sort(
          (a: Exame, b: Exame) =>
            new Date(b.dataExame!).getTime() - new Date(a.dataExame!).getTime()
        )
        .slice(0, 5);

      const eventosFuturos: EventoUnificado[] = [
        ...consultasFuturas.map(
          (c: ConsultaComRelacoes): EventoUnificado => ({
            id: c.id,
            data: new Date(c.data),
            tipo: "Consulta",
            nome: c.tipo,
            local: c.unidade?.nome || "Local não especificado",
            profissional: c.profissional?.nome || "Não especificado",
            original: c,
          })
        ),
        ...examesFuturos.map(
          (e: ExameComRelacoes): EventoUnificado => ({
            id: e.id,
            data: new Date(e.dataExame!),
            tipo: "Exame",
            nome: e.nome,
            local: e.unidades?.nome || "Local não especificado",
            profissional: e.profissional?.nome || "Não especificado",
            original: e,
          })
        ),
      ];

      eventosFuturos.sort((a, b) => a.data.getTime() - b.data.getTime());

      setProximosEventos(eventosFuturos);
      setConsultasPassadas(consultasPassadasData);
      setExamesPassados(examesPassadosData);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast({
        title: "Erro ao carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const renderSkeletons = () => (
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-28 w-64 rounded-lg" />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" disabled>
            Recarregar
          </Button>
        </div>
        <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">
          Próximos Eventos
        </h2>
        {renderSkeletons()}
        <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">
          Últimas Consultas
        </h2>
        {renderSkeletons()}
        <h2 className="text-xs font-bold uppercase text-gray-400 mt-5">
          Últimos Exames
        </h2>
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
          onClick={fetchEventos}
          className="text-gray-500 hover:text-gray-700"
        >
          Recarregar
        </Button>
      </div>
      
      {/* Seção Unificada de Próximos Eventos */}
      <div className="mt-5">
        <h2 className="text-xs font-bold uppercase text-gray-400">
          Próximos Eventos
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
          {proximosEventos.length > 0 ? (
            proximosEventos.map((evento) =>
              evento.tipo === "Consulta" ? (
                <AgendamentoItem
                  key={evento.id}
                  agendamento={{
                    id: evento.id,
                    data: evento.data.toISOString(),
                    nomeProfissional: evento.profissional || "Não especificado",
                    especialidade:
                      (evento.original as ConsultaComRelacoes).profissional
                        ?.especialidade || "Clínico Geral",
                    local: evento.local,
                    tipo: "Consulta",
                    tipoConsulta: (evento.original as ConsultaComRelacoes).tipo,
                  }}
                />
              ) : (
                <ExameItem
                  key={evento.id}
                  exame={evento.original as ExameComRelacoes}
                />
              )
            )
          ) : (
            <p className="text-sm text-gray-500">Nenhum evento agendado.</p>
          )}
        </div>
      </div>

      {/* Seção de Últimas Consultas */}
      <div className="mt-5">
        <h2 className="text-xs font-bold uppercase text-gray-400">
          Últimas Consultas
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
          {consultasPassadas.length > 0 ? (
            consultasPassadas.map((consulta) => (
              <AgendamentoItem
                key={consulta.id}
                agendamento={{
                  id: consulta.id,
                  data: consulta.data as unknown as string, // CORREÇÃO
                  nomeProfissional:
                    consulta.profissional?.nome || "Não especificado",
                  especialidade:
                    consulta.profissional?.especialidade || "Clínico Geral",
                  local: consulta.unidade?.nome || "Local não especificado",
                  tipo: "Consulta",
                  tipoConsulta: consulta.tipo,
                }}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma consulta realizada recentemente.
            </p>
          )}
        </div>
      </div>

      {/* Seção de Últimos Exames */}
      <div className="mt-5">
        <h2 className="text-xs font-bold uppercase text-gray-400">
          Últimos Exames
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
          {examesPassados.length > 0 ? (
            examesPassados.map((exame) => (
              <ExameItem key={exame.id} exame={exame} />
            ))
          ) : (
            <p className="text-sm text-gray-500">
              Nenhum exame realizado recentemente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendaList;
