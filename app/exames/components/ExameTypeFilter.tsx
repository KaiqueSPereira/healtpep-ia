"use client";

import React, { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger, 
    DropdownMenuCheckboxItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuGroup 
} from '@/app/_components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface ExameTypeFilterProps {
    title: string;
    options: string[];
    selectedOptions: string[];
    onSelectionChange: (selected: string[]) => void;
}

export default function ExameTypeFilter({ title, options, selectedOptions, onSelectionChange }: ExameTypeFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectAll = () => {
        onSelectionChange(options);
    };

    const handleClearAll = () => {
        onSelectionChange([]);
    };

    const handleCheckboxChange = (option: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedOptions, option]);
        } else {
            onSelectionChange(selectedOptions.filter(item => item !== option));
        }
    };

    const buttonText = () => {
        const numSelected = selectedOptions.length;
        if (numSelected === 0) return `Nenhum selecionado`;
        if (numSelected === options.length) return `Todos selecionados`;
        if (numSelected === 1) return selectedOptions[0];
        return `${numSelected} selecionados`;
    };

    const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{title}</label>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild className="mt-1">
                    <Button variant="outline" className="w-56 justify-between">
                        <span className="truncate pr-2">{buttonText()}</span>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
                    <DropdownMenuLabel>Opções de Filtro</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                         <DropdownMenuCheckboxItem onSelect={preventDefault} onClick={handleSelectAll}>
                            Selecionar Todos
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem onSelect={preventDefault} onClick={handleClearAll}>
                            Limpar Seleção
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {options.map(option => (
                            <DropdownMenuCheckboxItem
                                key={option}
                                checked={selectedOptions.includes(option)}
                                onCheckedChange={(checked: boolean) => handleCheckboxChange(option, !!checked)}
                            >
                                {option}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
