'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';

interface LogToolbarProps {
  componentNames: string[];
  initialFilters: {
    query?: string;
    component?: string;
  };
  actions?: ReactNode;
}

export function LogToolbar({ componentNames, initialFilters, actions }: LogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialFilters.query || '');
  const [component, setComponent] = useState(initialFilters.component || '');

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set('query', query);
    } else {
      params.delete('query');
    }

    // Lógica corrigida: Se o componente for selecionado e não for "all", defina o parâmetro.
    // Caso contrário (se for "all" ou vazio), remova o parâmetro.
    if (component && component !== 'all') {
      params.set('component', component);
    } else {
      params.delete('component');
    }

    // Remove filtros de data legados se existirem
    params.delete('startDate');
    params.delete('endDate');

    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    setQuery('');
    setComponent('');
    startTransition(() => {
        router.push(pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-muted/50 rounded-lg">
      <Input
        placeholder="Buscar em logs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Select value={component} onValueChange={setComponent}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Componente" />
        </SelectTrigger>
        <SelectContent>
          {/* Valor corrigido para "all" em vez de "" */}
          <SelectItem value="all">Todos</SelectItem>
          {componentNames.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleFilterChange} disabled={isPending}>
        {isPending ? 'Buscando...' : 'Buscar'}
      </Button>
       <Button variant="outline" onClick={handleClearFilters} disabled={isPending}>
        Limpar Filtros
      </Button>
      
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}
