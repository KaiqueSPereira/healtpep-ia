'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/app/_components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/_components/ui/card";
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
// Correção: Importar tipos diretamente da fonte (Prisma)
import { Profissional, Consultatype } from '@prisma/client';
import { Consulta } from '@/app/_components/types'; // O tipo Consulta é mais complexo, mantemos este
import AgendamentoItem, { AgendamentoUnificado } from './agendamentosItem';

interface ConsultasListProps {
  initialConsultas: Consulta[];
  profissionais: Profissional[]; // Agora espera o tipo Profissional do Prisma
  tipos: Consultatype[];
  initialNextCursor: string | null;
}

// Garante que a data seja sempre uma string
const mapConsultaToAgendamento = (consulta: Consulta): AgendamentoUnificado => ({
  id: consulta.id,
  data: new Date(consulta.data).toISOString(), // Converte para string ISO
  nomeProfissional: consulta.profissional?.nome || 'Não especificado',
  especialidade: consulta.profissional?.especialidade || 'Clínico Geral',
  local: consulta.unidade?.nome || 'Local não especificado',
  tipo: 'Consulta',
  tipoConsulta: consulta.tipo,
});

const ConsultasList = ({ initialConsultas, profissionais, tipos, initialNextCursor }: ConsultasListProps) => {
  const [agendamentosFuturos, setAgendamentosFuturos] = useState<AgendamentoUnificado[]>([]);
  const [agendamentosPassados, setAgendamentosPassados] = useState<AgendamentoUnificado[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);
  
  const [filters, setFilters] = useState({ search: '', tipo: '', profissionalId: '' });
  const [debouncedSearch] = useDebounce(filters.search, 500);

  const { ref, inView } = useInView({ threshold: 1.0 });

  // Efeito para processar os dados iniciais
  useEffect(() => {
    const processConsultas = (consultas: Consulta[]) => {
      const agora = new Date();
      const futuros: AgendamentoUnificado[] = [];
      const passados: AgendamentoUnificado[] = [];

      consultas.forEach(c => {
        if (new Date(c.data) > agora) {
          futuros.push(mapConsultaToAgendamento(c));
        } else {
          passados.push(mapConsultaToAgendamento(c));
        }
      });

      futuros.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      setAgendamentosFuturos(futuros);
      setAgendamentosPassados(passados);
    };

    processConsultas(initialConsultas);
  }, [initialConsultas]);


  // Callback para carregar mais consultas (apenas passadas)
  const loadMoreConsultas = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append('limit', '8');
    if (cursor) params.append('cursor', cursor);
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.profissionalId) params.append('profissionalId', filters.profissionalId);

    try {
      const response = await fetch(`/api/consultas?${params.toString()}`);
      const data: { items: Consulta[], nextCursor: string | null } = await response.json();
      
      const novosAgendamentosPassados = data.items.map(mapConsultaToAgendamento);
      setAgendamentosPassados(prev => [...prev, ...novosAgendamentosPassados]);
      
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Erro ao buscar mais consultas", error);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, debouncedSearch, filters]);

  // Efeito para o scroll infinito
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreConsultas();
    }
  }, [inView, hasMore, loading, loadMoreConsultas]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
              name="search"
              placeholder="Buscar por palavra-chave..."
              value={filters.search}
              onChange={handleFilterChange}
              className="md:col-span-2"
          />
          <select name="tipo" value={filters.tipo} onChange={handleFilterChange} className="input input-bordered w-full">
              <option value="">Todos os Tipos</option>
              {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)} 
          </select>
          <select name="profissionalId" value={filters.profissionalId} onChange={handleFilterChange} className="input input-bordered w-full">
              <option value="">Todos os Profissionais</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold mb-4">Consultas Agendadas</h2>
        {agendamentosFuturos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agendamentosFuturos.map(ag => <AgendamentoItem key={ag.id} agendamento={ag} />)}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma consulta agendada.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Consultas Passadas</h2>
        {agendamentosPassados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agendamentosPassados.map(ag => <AgendamentoItem key={ag.id} agendamento={ag} />)}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma consulta passada encontrada.</p>
        )}
      </section>

      {loading && <p className="text-center">Carregando mais...</p>}
      {!loading && hasMore && <div ref={ref} className="h-10" />}
      {!loading && !hasMore && agendamentosPassados.length > 0 && <p className="text-center text-gray-500 py-4">Fim dos resultados.</p>}
    </div>
  );
};

export default ConsultasList;
