'use client';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
import { Profissional, Consultatype } from '@prisma/client';
import { Consulta } from '@/app/_components/types';
import AgendamentoItem, { AgendamentoUnificado } from './agendamentosItem';
import ConsultaFilter from './ConsultaFilter'; // Importa o componente de filtro corrigido

interface ConsultasListProps {
  initialConsultas: Consulta[];
  profissionais: Profissional[];
  tipos: Consultatype[];
  initialNextCursor: string | null;
}

const mapConsultaToAgendamento = (consulta: Consulta): AgendamentoUnificado => ({
  id: consulta.id,
  data: new Date(consulta.data).toISOString(),
  nomeProfissional: consulta.profissional?.nome || 'Não especificado',
  especialidade: consulta.profissional?.especialidade || 'Clínico Geral',
  local: consulta.unidade?.nome || 'Local não especificado',
  tipo: 'Consulta',
  tipoConsulta: consulta.tipo,
});

const ConsultasList = ({ initialConsultas, profissionais, tipos, initialNextCursor }: ConsultasListProps) => {
  const [consultas, setConsultas] = useState<Consulta[]>(initialConsultas);
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<AgendamentoUnificado[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<AgendamentoUnificado[]>([]);

  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);

  // Estado para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [tipo, setTipo] = useState<Consultatype | '' >('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { ref, inView } = useInView({ threshold: 1.0 });

  // Função centralizada para buscar dados
  const fetchAndSetConsultas = useCallback(async (isNewFilter = false) => {
    if (isNewFilter) {
        startTransition(() => {
            setConsultas([]);
            setAgendamentosFuturos([]);
            setAgendamentosPassados([]);
        });
    } else {
        setLoadingMore(true);
    }

    const params = new URLSearchParams();
    params.append('limit', '8');
    if (cursor && !isNewFilter) params.append('cursor', cursor);
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (tipo) params.append('tipo', tipo);
    if (profissionalId) params.append('profissionalId', profissionalId);

    try {
      const response = await fetch(`/api/consultas?${params.toString()}`);
      const data: { items: Consulta[], nextCursor: string | null } = await response.json();

      setConsultas(prev => isNewFilter ? data.items : [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Erro ao buscar consultas", error);
    } finally {
      if (!isNewFilter) setLoadingMore(false);
    }
  }, [cursor, debouncedSearchTerm, tipo, profissionalId]);

  // Efeito para buscar dados quando os filtros mudam
  useEffect(() => {
    // Reseta o cursor e busca do início sempre que um filtro for alterado.
    setCursor(null);
    fetchAndSetConsultas(true);
  }, [debouncedSearchTerm, profissionalId, tipo]);

  // Efeito para carregar mais itens no scroll infinito (não deve ser acionado por mudança de filtro)
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !isPending) {
        fetchAndSetConsultas(false);
    }
  }, [inView, hasMore, loadingMore, isPending, fetchAndSetConsultas]);

  // Efeito para processar e separar as consultas em futuras e passadas
  useEffect(() => {
    const agora = new Date();
    const futuros: AgendamentoUnificado[] = [];
    const passados: AgendamentoUnificado[] = [];

    consultas.forEach(c => {
      const agendamento = mapConsultaToAgendamento(c);
      if (new Date(c.data) > agora) {
        futuros.push(agendamento);
      } else {
        passados.push(agendamento);
      }
    });

    futuros.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    // As passadas já vêm ordenadas do backend (desc)

    setAgendamentosFuturos(futuros);
    setAgendamentosPassados(passados);

  }, [consultas]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Usando o componente de filtro corrigido */}
      <ConsultaFilter 
        professionals={profissionais} 
        consultationTypes={tipos} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        profissionalId={profissionalId}
        setProfissionalId={setProfissionalId}
        tipo={tipo}
        setTipo={setTipo}
      />

      {isPending ? (
        <p className="text-center">Atualizando...</p>
      ) : (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-4">Consultas Agendadas</h2>
            {agendamentosFuturos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {agendamentosFuturos.map(ag => <AgendamentoItem key={ag.id} agendamento={ag} />)}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma consulta agendada encontrada para os filtros selecionados.</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Consultas Passadas</h2>
            {agendamentosPassados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {agendamentosPassados.map(ag => <AgendamentoItem key={ag.id} agendamento={ag} />)}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma consulta passada encontrada para os filtros selecionados.</p>
            )}
          </section>
        </>
      )}

      {loadingMore && <p className="text-center">Carregando mais...</p>}
      {!loadingMore && hasMore && <div ref={ref} className="h-10" />}
      {!loadingMore && !hasMore && consultas.length > 0 && <p className="text-center text-gray-500 py-4">Fim dos resultados.</p>}
    </div>
  );
};

export default ConsultasList;
