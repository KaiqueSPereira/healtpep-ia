"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import axios from "axios";
import { useInView } from "react-intersection-observer";
import AgendamentoItem from "./components/agendamentosItem";
import { AgendamentoUnificado } from "./components/agendamentolist";
import ConsultaFilter from './components/ConsultaFilter'; 
import { Consultas, Consultatype, Profissional, UnidadeDeSaude } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useDebounce } from 'use-debounce';

type ConsultaComRelacoes = Consultas & {
  profissional: Profissional | null;
  unidade: UnidadeDeSaude | null;
};

const ConsultasPage = () => {
  // Estados para os dados e paginação
  const [consultas, setConsultas] = useState<ConsultaComRelacoes[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Estados para os filtros
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [profissionalId, setProfissionalId] = useState(searchParams.get('profissionalId') || '');
  const [tipo, setTipo] = useState<Consultatype | ''>(searchParams.get('tipo') as Consultatype || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // Estados para popular os filtros
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [tiposConsulta, setTiposConsulta] = useState<Consultatype[]>([]);

  const { ref, inView } = useInView({ threshold: 0 });

  // Função para buscar dados para os filtros
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [profRes, tiposRes] = await Promise.all([
          axios.get('/api/consultas?get=profissionais'),
          axios.get('/api/consultas?get=tipos')
        ]);
        setProfissionais(profRes.data);
        setTiposConsulta(tiposRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados para os filtros:", error);
      }
    };
    fetchFilterData();
  }, []);

  // Função centralizada de busca
  const loadConsultas = useCallback(async (cursor: string | null, isNewSearch: boolean) => {
    if (loading) return;
    setLoading(true);
    if(isNewSearch) setInitialLoad(true);

    try {
      const params = new URLSearchParams();
      params.append('limit', '8');
      if (cursor) params.append('cursor', cursor);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (profissionalId) params.append('profissionalId', profissionalId);
      if (tipo) params.append('tipo', tipo);

      const response = await axios.get(`/api/consultas?${params.toString()}`);
      const { items, nextCursor: newNextCursor } = response.data;

      setConsultas(prev => isNewSearch ? items : [...prev, ...items]);
      setNextCursor(newNextCursor);
      setHasMore(!!newNextCursor);

    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [debouncedSearchTerm, profissionalId, tipo]); // CORREÇÃO: Removido 'loading' das dependências

  // Efeito para atualizar a URL com os filtros
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm); else params.delete('search');
    if (profissionalId) params.set('profissionalId', profissionalId); else params.delete('profissionalId');
    if (tipo) params.set('tipo', tipo); else params.delete('tipo');
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, profissionalId, tipo, pathname, router, searchParams]);
  
  // Efeito para buscar quando os filtros mudam
  useEffect(() => {
    loadConsultas(null, true); // Nova busca, reseta a lista
  }, [debouncedSearchTerm, profissionalId, tipo]);

  // Efeito para carregamento infinito (scroll)
  useEffect(() => {
    const isNewSearch = false;
    // Evita carregar mais se for uma busca inicial ou se não houver mais itens
    if (inView && !loading && hasMore && !initialLoad) {
      loadConsultas(nextCursor, isNewSearch);
    }
  }, [inView, loading, hasMore, nextCursor, initialLoad, loadConsultas]);
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5">
        <h1 className="text-xl font-bold mb-4">Minhas Consultas</h1>
        <ConsultaFilter
          professionals={profissionais}
          consultationTypes={tiposConsulta}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          profissionalId={profissionalId}
          setProfissionalId={setProfissionalId}
          tipo={tipo}
          setTipo={setTipo}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {consultas.map((consulta) => {
            const agendamento: AgendamentoUnificado = {
              id: consulta.id,
              data: consulta.data.toString(),
              nomeProfissional: consulta.profissional?.nome || "Não especificado",
              especialidade: consulta.profissional?.especialidade || "Clínico Geral",
              local: consulta.unidade?.nome || "Local não especificado",
              tipo: "Consulta",
              userId: consulta.userId,
            };
            return <AgendamentoItem key={consulta.id} agendamento={agendamento} />;
          })}
        </div>

        <div ref={ref} className="h-10 flex justify-center items-center my-4">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {!hasMore && consultas.length > 0 && !initialLoad && (
             <p className="text-sm text-gray-500">Você chegou ao fim.</p>
          )}
        </div>

        {!loading && !initialLoad && consultas.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Nenhum resultado encontrado com os critérios especificados.
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsultasPage;
