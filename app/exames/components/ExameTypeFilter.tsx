"use client";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { ListFilter } from "lucide-react";

interface ExameTypeFilterProps {
    allTypes: string[];
    selectedTypes: string[];
    onTypeChange: (types: string[]) => void;
}

export function ExameTypeFilter({ allTypes, selectedTypes, onTypeChange }: ExameTypeFilterProps) {

    const handleSelectAll = () => {
        if (selectedTypes.length === allTypes.length) {
            onTypeChange([]); // Desmarca todos
        } else {
            onTypeChange([...allTypes]); // Marca todos
        }
    };

    const handleTypeChange = (type: string, checked: boolean) => {
        const newSelectedTypes = new Set(selectedTypes);
        if (checked) {
            newSelectedTypes.add(type);
        } else {
            newSelectedTypes.delete(type);
        }
        onTypeChange(Array.from(newSelectedTypes));
    };

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
                    checked={allTypes.length > 0 && selectedTypes.length === allTypes.length}
                    onCheckedChange={handleSelectAll}
                >
                    Selecionar Todos
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {allTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                        key={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                    >
                        {type}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
