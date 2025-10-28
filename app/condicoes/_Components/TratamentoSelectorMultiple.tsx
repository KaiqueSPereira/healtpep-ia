"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // Importa o hook para obter a sessão
import { Check, XCircle, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/_components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { toast } from "@/app/_hooks/use-toast";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";
import { CondicaoSaude } from "@/app/_components/types";

interface CondicaoSaudeSelectorMultipleProps {
  profissionalId: string;
  currentCondicoes: CondicaoSaude[];
  onCondicoesChange?: (updatedCondicoes: CondicaoSaude[]) => void;
}

const CondicaoSaudeSelectorMultiple: React.FC<CondicaoSaudeSelectorMultipleProps> = ({
  profissionalId,
  currentCondicoes,
  onCondicoesChange,
}) => {
  const { data: session } = useSession(); // Obtém a sessão do usuário
  const [allCondicoes, setAllCondicoes] = useState<CondicaoSaude[]>([]);
  const [selectedCondicoes, setSelectedCondicoes] = useState<CondicaoSaude[]>(currentCondicoes);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // A função só será executada se a sessão e o ID do usuário estiverem disponíveis
    if (!session?.user?.id) return;

    const fetchAllCondicoes = async () => {
      try {
        // Envia o userId como query param para a API
        const response = await fetch(`/api/condicoes?userId=${session.user.id}`); 
        if (!response.ok) throw new Error("Erro ao buscar condições de saúde disponíveis");
        const data: CondicaoSaude[] = await response.json();
        setAllCondicoes(data);
      } catch (error) {
        console.error("Erro ao buscar todas as condições de saúde:", error);
        toast({ title: "Erro ao carregar lista de condições.", variant: "destructive" });
      }
    };
    fetchAllCondicoes();
  }, [session]); // Adiciona a sessão como dependência do useEffect

  useEffect(() => {
    setSelectedCondicoes(currentCondicoes);
  }, [currentCondicoes]);

  const handleAddCondicao = async (condicao: CondicaoSaude) => {
    if (selectedCondicoes.find((c) => c.id === condicao.id)) {
      setPopoverOpen(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/profissionais/${profissionalId}/condicoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condicaoId: condicao.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao associar condição de saúde");
      }
      const updatedList: CondicaoSaude[] = await response.json();
      setSelectedCondicoes(updatedList);
      if (onCondicoesChange) {
        onCondicoesChange(updatedList);
      }
      toast({ title: "Condição de saúde associada com sucesso." });
      setPopoverOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar condição:", error);
      toast({ title: "Falha ao associar condição.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCondicao = async (condicaoId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profissionais/${profissionalId}/condicoes/${condicaoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao desassociar condição");
      }
      const updatedList: CondicaoSaude[] = await response.json();
      setSelectedCondicoes(updatedList);
      if (onCondicoesChange) {
        onCondicoesChange(updatedList);
      }
      toast({ title: "Condição de saúde desassociada com sucesso." });
    } catch (error) {
      console.error("Erro ao remover condição:", error);
      toast({ title: "Falha ao desassociar condição.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Condições de Saúde Associadas:</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCondicoes.map((condicao) => (
            <Badge key={condicao.id} variant="secondary" className="flex items-center">
              {condicao.nome}
              <Button
                 variant="ghost"
                 size="sm"
                 className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                 onClick={() => handleRemoveCondicao(condicao.id)}
                 disabled={loading}
              >
                 <XCircle className="h-3 w-3" />
                 <span className="sr-only">Remover {condicao.nome}</span>
              </Button>
            </Badge>
          ))}
        </div>
        {selectedCondicoes.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">Nenhuma condição de saúde associada.</p>
        )}
      </div>
      <div>
        <Label>Adicionar Condição:</Label>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between mt-2" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Condição...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar Condição..." />
              <CommandList>
                <CommandEmpty>Nenhuma condição encontrada.</CommandEmpty>
                <CommandGroup>
                  {allCondicoes
                    .filter(c => !selectedCondicoes.find(sc => sc.id === c.id))
                    .map((condicao) => (
                      <CommandItem key={condicao.id} onSelect={() => handleAddCondicao(condicao)}>
                        {condicao.nome}
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...
        </div>
      )}
    </div>
  );
};

export default CondicaoSaudeSelectorMultiple;
