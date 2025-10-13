"use client";

import { useEffect, useState, useCallback } from "react"; // CORREÇÃO: Adicionado useCallback
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { ListFilter } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface ExameTypeFilterProps {
    allTypes: string[];
}

export function ExameTypeFilter({ allTypes }: ExameTypeFilterProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // CORREÇÃO: Função envolvida em useCallback para estabilizá-la
    const getInitialSelectedTypes = useCallback(() => {
        const typesFromUrl = searchParams.get('tipos');
        return typesFromUrl ? new Set(typesFromUrl.split(',')) : new Set();
    }, [searchParams]);

    const [selectedTypes, setSelectedTypes] = useState(getInitialSelectedTypes);

    // Update URL when selectedTypes change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedTypes.size > 0) {
            params.set('tipos', Array.from(selectedTypes).join(','));
        } else {
            params.delete('tipos');
        }
        // Using router.replace to avoid adding to history
        router.replace(`${pathname}?${params.toString()}`);
    }, [selectedTypes, pathname, router, searchParams]);
    

    const handleSelectAll = () => {
        if (selectedTypes.size === allTypes.length) {
            // If all are selected, deselect all
            setSelectedTypes(new Set());
        } else {
            // Otherwise, select all
            setSelectedTypes(new Set(allTypes));
        }
    };

    const handleTypeChange = (type: string, checked: boolean) => {
        const newSelectedTypes = new Set(selectedTypes);
        if (checked) {
            newSelectedTypes.add(type);
        } else {
            newSelectedTypes.delete(type);
        }
        setSelectedTypes(newSelectedTypes);
    };
    
    // Handle browser back/forward navigation
    // CORREÇÃO: `getInitialSelectedTypes` adicionada como dependência
    useEffect(() => {
        setSelectedTypes(getInitialSelectedTypes());
    }, [searchParams, getInitialSelectedTypes]);


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filtrar Tipos</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuCheckboxItem
                    checked={selectedTypes.size === allTypes.length}
                    onSelect={() => handleSelectAll()} >
                    Selecionar Todos
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {allTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                        key={type}
                        checked={selectedTypes.has(type)}
                        onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                    >
                        {type}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
