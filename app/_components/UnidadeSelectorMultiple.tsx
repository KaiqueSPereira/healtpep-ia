// app/_components/UnidadeSelectorMultiple.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, XCircle, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Badge } from "./ui/badge";
import { toast } from "@/app/_hooks/use-toast";
import { Label } from "./ui/label";

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

// Não parece que ProfissionalUnidadeLink é usado diretamente no componente, pode ser removido se não for o caso.
// interface ProfissionalUnidadeLink { /* ... */ }


interface UnidadeSelectorMultipleProps {
  profissionalId: string;
  currentUnidades: Unidade[];
  onUnidadesChange?: (updatedUnidades: Unidade[]) => void;
}


const UnidadeSelectorMultiple: React.FC<UnidadeSelectorMultipleProps> = ({
  profissionalId,
  currentUnidades,
  onUnidadesChange,
}) => {
  const [allUnidades, setAllUnidades] = useState<Unidade[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<Unidade[]>(currentUnidades);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllUnidades = async () => {
      try {
        const response = await fetch("/api/unidadesaude");
        if (!response.ok) throw new Error("Erro ao buscar unidades disponíveis");
        const data: Unidade[] = await response.json();
        setAllUnidades(data);
      } catch (error) {
        console.error("Erro ao buscar todas as unidades:", error);
        toast({
          title: "Erro ao carregar lista de unidades.",
          variant: "destructive",
        });
      }
    };

    fetchAllUnidades();
  }, []);

   useEffect(() => {
       setSelectedUnidades(currentUnidades);
   }, [currentUnidades]);


  const handleAddUnidade = async (unidade: Unidade) => {
    if (selectedUnidades.find((u) => u.id === unidade.id)) {
      setPopoverOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/profissionais/${profissionalId}/unidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unidadeId: unidade.id }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Erro ao associar unidade ao profissional");
      }


      // Assumindo que a API POST retorna a lista atualizada de unidades do profissional
      const updatedUnidadesList: Unidade[] = await response.json();

      // Atualiza o estado local COM A LISTA RETORNADA PELA API
      setSelectedUnidades(updatedUnidadesList);

      // CHAMA O CALLBACK APENAS SE ELE EXISTIR
      if (onUnidadesChange) {
         onUnidadesChange(updatedUnidadesList);
      }

      toast({ title: "Unidade associada com sucesso." });
      setPopoverOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar unidade:", error);
      toast({
        title: "Falha ao associar unidade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveUnidade = async (unidadeId: string) => {
     setLoading(true);
    try {
      const response = await fetch(`/api/profissionais/${profissionalId}/unidades/${unidadeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Erro ao desassociar unidade do profissional");
      }

       // Assumindo que a API DELETE retorna a lista atualizada de unidades do profissional
       const updatedUnidadesList: Unidade[] = await response.json();

       // Atualiza o estado local COM A LISTA RETORNADA PELA API
       setSelectedUnidades(updatedUnidadesList);

       // CHAMA O CALLBACK APENAS SE ELE EXISTIR
       if (onUnidadesChange) {
          onUnidadesChange(updatedUnidadesList);
       }

      toast({ title: "Unidade desassociada com sucesso." });
    } catch (error) {
      console.error("Erro ao remover unidade:", error);
      toast({
        title: "Falha ao desassociar unidade.",
        variant: "destructive",
      });
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <Label>Unidades Vinculadas:</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUnidades.map((unidade) => (
            <Badge key={unidade.id} variant="secondary" className="flex items-center">
              {unidade.nome} ({unidade.tipo})
              <Button
                 variant="ghost"
                 size="sm"
                 className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                 onClick={() => handleRemoveUnidade(unidade.id)}
                 disabled={loading}
              >
                 <XCircle className="h-3 w-3" />
                 <span className="sr-only">Remover {unidade.nome}</span>
              </Button>
            </Badge>
          ))}
        </div>
        {selectedUnidades.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Nenhuma unidade associada.</p>
        )}
      </div>

      <div>
         <Label>Adicionar Unidade:</Label>
         <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
               <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between mt-2"
                   disabled={loading}
               >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Unidade...
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
               <Command>
                  <CommandInput placeholder="Buscar Unidade..." />
                  <CommandList>
                     <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                     <CommandGroup>
                        {allUnidades
                           .filter(u => !selectedUnidades.find(su => su.id === u.id))
                           .map((unidade) => (
                           <CommandItem
                              key={unidade.id}
                              onSelect={() => handleAddUnidade(unidade)}
                           >
                              {unidade.nome} - {unidade.tipo}
                              <Check className="ml-auto h-4 w-4 opacity-0" />
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
      </div>

       {loading && (
           <div className="flex items-center justify-center text-sm text-gray-500">
               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando unidades...
           </div>
       )}
    </div>
  );
};

export default UnidadeSelectorMultiple;
