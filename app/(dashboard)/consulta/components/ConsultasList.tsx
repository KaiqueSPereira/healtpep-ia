'use client';
import { useState, useEffect, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
import { Profissional, Consultatype } from '@prisma/client';
import { Consulta } from '@/app/_components/types';
import AgendamentoItem, { AgendamentoUnificado } from './agendamentosItem';
import ConsultaFilter from './ConsultaFilter';
import { Skeleton } from '@/app/_components/ui/skeleton';

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

const fetchConsultasAPI = async (params: URLSearchParams) => {
    const response = await fetch(`/api/consultas?${params.toString()}`);
    if (!response.ok) {
        console.error("Erro ao buscar consultas na API");
        throw new Error('Failed to fetch consultations');
    }
    return response.json();
};

const ConsultasList = ({ initialConsultas, profissionais, tipos, initialNextCursor }: ConsultasListProps) => {
  const [consultas, setConsultas] = useState<Consulta[]>(initialConsultas);
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<AgendamentoUnificado[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<AgendamentoUnificado[]>([]);

  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);

  // Estados para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [tipo, setTipo] = useState<Consultatype | '' >('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { ref, inView } = useInView({ threshold: 1.0 });

  // Efeito para NOVAS buscas (acionado por filtros)
  useEffect(() => {
    const performSearch = async () => {
      startTransition(async () => {
        const params = new URLSearchParams();
        params.append('limit', '8');
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (tipo) params.append('tipo', tipo);
        if (profissionalId) params.append('profissionalId', profissionalId);

        try {
          const data = await fetchConsultasAPI(params);
          setConsultas(data.items);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        } catch (error) {
          console.error("Erro ao realizar nova busca", error);
        }
      });
    };

    performSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, profissionalId, tipo]);

  // Efeito para CARREGAR MAIS (scroll infinito)
  useEffect(() => {
    const loadMore = async () => {
      if (inView && hasMore && !loadingMore && !isPending) {
        setLoadingMore(true);
        const params = new URLSearchParams();
        params.append('limit', '8');
        if (cursor) params.append('cursor', cursor);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (tipo) params.append('tipo', tipo);
        if (profissionalId) params.append('profissionalId', profissionalId);

        try {
          const data = await fetchConsultasAPI(params);
          setConsultas(prev => [...prev, ...data.items]);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        } catch (error) {
          console.error("Erro ao carregar mais consultas", error);
        } finally {
          setLoadingMore(false);
        }
      }
    };
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isPending]);


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
    passados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    setAgendamentosFuturos(futuros);
    setAgendamentosPassados(passados);
  }, [consultas]);

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
    </div>
  );

  return (
    <div className="flex flex-col flex-grow p-6 space-y-6 min-h-0">
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

      <div className="flex-grow overflow-y-auto space-y-6 pb-10">
        {isPending ? (
          <>
            <section>
                <h2 className="text-xl font-semibold mb-4">Consultas Agendadas</h2>
                {renderSkeletons()}
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-4">Consultas Passadas</h2>
                {renderSkeletons()}
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-4">Consultas Agendadas</h2>
              {agendamentosFuturos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {agendamentosFuturos.map(ag => <AgendamentoItem key={`futuro-${ag.id}`} agendamento={ag} />)}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma consulta agendada encontrada para os filtros selecionados.</p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Consultas Passadas</h2>
              {agendamentosPassados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {agendamentosPassados.map(ag => <AgendamentoItem key={`passado-${ag.id}`} agendamento={ag} />)}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma consulta passada encontrada para os filtros selecionados.</p>
              )}
            </section>
            
            {loadingMore && <div className="flex justify-center"><p className="text-center">Carregando mais...</p></div>}
            {!loadingMore && hasMore && <div ref={ref} className="h-10" />}
            {!loadingMore && !hasMore && consultas.length > 0 && <p className="text-center text-gray-500 py-4">Fim dos resultados.</p>}
            {!isPending && consultas.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum resultado encontrado para os filtros selecionados.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConsultasList;
