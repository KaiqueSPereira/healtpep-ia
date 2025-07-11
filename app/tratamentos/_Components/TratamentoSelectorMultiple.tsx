// app/_components/TratamentoSelectorMultiple.tsx
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
import { toast } from "@/app/_hooks/use-toast";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";

// Interfaces básicas (podem vir de um arquivo de tipos compartilhado)
interface Tratamento {
  id: string;
  nome: string;
  descricao?: string | null; // Adicione outros campos se necessário
}

// Props esperadas pelo componente TratamentoSelectorMultiple
interface TratamentoSelectorMultipleProps {
  profissionalId: string; // O ID do profissional
  // Prop para receber os tratamentos atualmente associados
  currentTratamentos: Tratamento[];
  // Callback para notificar a página pai sobre os tratamentos atualizados
  onTratamentosChange?: (updatedTratamentos: Tratamento[]) => void;
}


const TratamentoSelectorMultiple: React.FC<TratamentoSelectorMultipleProps> = ({
  profissionalId,
  currentTratamentos,
  onTratamentosChange,
}) => {
  const [allTratamentos, setAllTratamentos] = useState<Tratamento[]>([]);
  const [selectedTratamentos, setSelectedTratamentos] = useState<Tratamento[]>(currentTratamentos);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar todos os tratamentos disponíveis
    const fetchAllTratamentos = async () => {
      try {
        const response = await fetch("/api/tratamento"); // Endpoint para listar todos os tratamentos
        if (!response.ok) throw new Error("Erro ao buscar tratamentos disponíveis");
        const data: Tratamento[] = await response.json();
        setAllTratamentos(data);
      } catch (error) {
        console.error("Erro ao buscar todos os tratamentos:", error);
        toast({
          title: "Erro ao carregar lista de tratamentos.",
          variant: "destructive",
        });
      }
    };

    fetchAllTratamentos();
  }, []); // Executa apenas uma vez ao montar

   // Atualizar tratamentos selecionados se a prop currentTratamentos mudar
   useEffect(() => {
       setSelectedTratamentos(currentTratamentos);
   }, [currentTratamentos]);


  // Função para adicionar um tratamento ao profissional
  const handleAddTratamento = async (tratamento: Tratamento) => {
    if (selectedTratamentos.find((t) => t.id === tratamento.id)) {
      setPopoverOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Chamar um NOVO endpoint de API para associar tratamento
      const response = await fetch(`/api/profissional/${profissionalId}/tratamentos`, { // Exemplo de endpoint POST
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tratamentoId: tratamento.id }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Erro ao associar tratamento ao profissional");
      }

      // Assumindo que a API POST retorna a lista atualizada de tratamentos do profissional
      const updatedTratamentosList: Tratamento[] = await response.json();

      setSelectedTratamentos(updatedTratamentosList);
      if (onTratamentosChange) {
         onTratamentosChange(updatedTratamentosList);
      }

      toast({ title: "Tratamento associado com sucesso." });
      setPopoverOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar tratamento:", error);
      toast({
        title: "Falha ao associar tratamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Função para remover um tratamento do profissional
  const handleRemoveTratamento = async (tratamentoId: string) => {
     setLoading(true);
    try {
      // Chamar um NOVO endpoint de API para desassociar tratamento
      const response = await fetch(`/api/profissional/${profissionalId}/tratamentos/${tratamentoId}`, { // Exemplo de endpoint DELETE
        method: "DELETE",
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Erro ao desassociar tratamento do profissional");
      }

       // Assumindo que a API DELETE retorna a lista atualizada de tratamentos do profissional
       const updatedTratamentosList: Tratamento[] = await response.json();

       setSelectedTratamentos(updatedTratamentosList);
       if (onTratamentosChange) {
          onTratamentosChange(updatedTratamentosList);
       }

      toast({ title: "Tratamento desassociado com sucesso." });
    } catch (error) {
      console.error("Erro ao remover tratamento:", error);
      toast({
        title: "Falha ao desassociar tratamento.",
        variant: "destructive",
      });
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <Label>Tratamentos Responsável:</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Exibir os tratamentos atualmente selecionados/associados */}
          {selectedTratamentos.map((tratamento) => (
            <Badge key={tratamento.id} variant="secondary" className="flex items-center">
              {tratamento.nome}
              {/* Botão para remover o tratamento */}
              <Button
                 variant="ghost"
                 size="sm"
                 className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                 onClick={() => handleRemoveTratamento(tratamento.id)}
                 disabled={loading}
              >
                 <XCircle className="h-3 w-3" />
                 <span className="sr-only">Remover {tratamento.nome}</span>
              </Button>
            </Badge>
          ))}
        </div>
         {/* Mensagem se não houver tratamentos associados */}
        {selectedTratamentos.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Nenhum tratamento associado.</p>
        )}
      </div>

      {/* Seletor de Tratamentos para Adicionar */}
      <div>
         <Label>Adicionar Tratamento:</Label>
         <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
               <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between mt-2"
                   disabled={loading}
               >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tratamento...
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
               <Command>
                  <CommandInput placeholder="Buscar Tratamento..." />
                  <CommandList>
                     <CommandEmpty>Nenhum tratamento encontrado.</CommandEmpty>
                     <CommandGroup>
                        {/* Mapear sobre TODOS os tratamentos disponíveis */}
                        {allTratamentos
                           // Opcional: Filtrar tratamentos que já estão associados
                           .filter(t => !selectedTratamentos.find(st => st.id === t.id))
                           .map((tratamento) => (
                           <CommandItem
                              key={tratamento.id}
                              onSelect={() => handleAddTratamento(tratamento)} // Chamar função para adicionar
                           >
                              {tratamento.nome}
                              {/* Se o tratamento tiver descrição, pode exibir aqui */}
                              {tratamento.descricao && ` - ${tratamento.descricao}`}
                              <Check className="ml-auto h-4 w-4 opacity-0" /> {/* Placeholder */}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
      </div>

       {/* Indicador de Loading para operações de associação/desassociação */}
       {loading && (
           <div className="flex items-center justify-center text-sm text-gray-500">
               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando tratamentos...
           </div>
       )}
    </div>
  );
};

export default TratamentoSelectorMultiple;
