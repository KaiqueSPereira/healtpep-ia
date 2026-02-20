'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/_components/ui/card";
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
import { Consulta, Profissional } from '@/app/_components/types';
import { Consultatype } from '@prisma/client';


interface FilterState {
    search: string;
    tipo: string;
    profissionalId: string;
}

const ConsultasPage = () => {
    const router = useRouter();
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [tipos, setTipos] = useState<Consultatype[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({ search: '', tipo: '', profissionalId: '' });
    const [debouncedSearch] = useDebounce(filters.search, 500);

    const { ref, inView } = useInView({ threshold: 1.0 });

    const loadConsultas = useCallback(async (reset = false) => {
        if (loading || (!hasMore && !reset)) return;
        setLoading(true);

        const currentCursor = reset ? null : cursor;
        const params = new URLSearchParams();
        params.append('limit', '8');
        if (currentCursor) params.append('cursor', currentCursor);
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.profissionalId) params.append('profissionalId', filters.profissionalId);

        try {
            const response = await fetch(`/api/consultas?${params.toString()}`);
            const data = await response.json();
            setConsultas(prev => reset ? data.items : [...prev, ...data.items]);
            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (error) {
            console.error("Erro ao buscar consultas", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters.tipo, filters.profissionalId, cursor, hasMore, loading]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profResponse, tiposResponse] = await Promise.all([
                    fetch('/api/consultas?get=profissionais'),
                    fetch('/api/consultas?get=tipos')
                ]);
                const profData = await profResponse.json();
                const tiposData = await tiposResponse.json();
                setProfissionais(Array.isArray(profData) ? profData : []);
                setTipos(Array.isArray(tiposData) ? tiposData : []);
            } catch (error) {
                console.error("Erro ao buscar filtros", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        loadConsultas(true);
    }, [debouncedSearch, filters.tipo, filters.profissionalId, loadConsultas]);

    useEffect(() => {
        if (inView && !loading && hasMore) {
            loadConsultas();
        }
    }, [inView, loading, hasMore, loadConsultas]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Consultas</h1>
                <Button onClick={() => router.push('/consulta/nova')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nova Consulta
                </Button>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {consultas.map(consulta => (
                    <Card key={consulta.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => router.push(`/consulta/${consulta.id}`)}>
                        <CardHeader>
                            <CardTitle className="text-lg">{consulta.tipo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{new Date(consulta.data).toLocaleDateString('pt-BR')}</p>
                            <p>{consulta.profissional?.nome || 'N/A'}</p>
                            <p className="text-sm text-gray-500 truncate">{consulta.motivo}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading && <p>Carregando...</p>}
            {!loading && hasMore && <div ref={ref}></div>}
            {!loading && !hasMore && <p className="text-center text-gray-500">Fim dos resultados.</p>}
        </div>
    );
};

export default ConsultasPage;
