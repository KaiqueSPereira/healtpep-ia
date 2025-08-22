"use client";

import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { ResultadoExame, Exame } from "@/app/_components/types";
import { useState, useEffect } from "react";

interface TabelaExamesProps {
  exames: ResultadoExame[];
  onAddExame: () => void;
  onRemoveExame: (index: number) => void;
  onExameChange: (index: number, field: keyof ResultadoExame, value: string) => void;
}

const unidadesMedida = [
  "g/dL",
  "mg/dL",
  "milhões/mm³",
  "mil/mm³",
  "mm³",
  "mm/h",
  "mg/L",
  "ng/mL",
  "pg",
  "fL",
  "U/L",
  "mEq/L",
  "%",
  "uUI/mL",
  "mL/min",
  "mg",
  "μg/dL",
  "μIU/mL",
  "μmol/L",
  "mcmol/L",
  "mcmol/mol",
  "mg/g",
  "IU/L",
  "μg/mL",
  "mmol/L",
  "nmol/L",
  "10³/ul",
  "Cópias/ML",
  "log",
  "células/μL",
  "x106/uL",
  "pg/mL",
  "µg/dL",
  "uL",
  "µUI/mL",
  "mL",
  "--",
  "Outro",
];

export default function TabelaExames({
  exames,
  onAddExame,
  onRemoveExame,
  onExameChange,
}: TabelaExamesProps) {
  const [availableResults, setAvailableResults] = useState<ResultadoExame[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean[]>(exames.map(() => false));
  const [suggestions, setSuggestions] = useState<ResultadoExame[]>([]);

  useEffect(() => {
    setShowSuggestions(exames.map(() => false));
  }, [exames.length]);


  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        const response = await fetch("/api/exames");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Exame[] = await response.json();

        const allResults: ResultadoExame[] = data.reduce((acc, exame) => {
          if (exame.resultados && Array.isArray(exame.resultados)) {
             const formattedResults = exame.resultados.map(resultado => ({
               id: resultado.id,
               nome: resultado.nome,
               valor: resultado.valor,
               unidade: resultado.unidade,
               referencia: resultado.referencia,
             }));
            return acc.concat(formattedResults);
          }
          return acc;
        }, [] as ResultadoExame[]);

        const uniqueResults = Array.from(new Map(allResults.map(item => [item.nome, item])).values());

        setAvailableResults(uniqueResults);
      } catch (error) {
        console.error("Erro ao buscar exames disponíveis:", error);
        setAvailableResults([]);
      }
    };

    fetchAvailableExams();
  }, []);

  // Função de normalização
  const normalizeExamName = (name: string): string => {
    return name
      .toLowerCase() // Converte para minúsculas
      .trim() // Remove espaços em branco no início e fim
      .replace(/\s+/g, ' '); // Substitui múltiplos espaços por um único espaço
      // Adicione outras regras de normalização aqui, se necessário (ex: remover acentos)
  };

  const handleNameInputChange = (index: number, value: string) => {
    // Normaliza o valor antes de passá-lo para onExameChange
    const normalizedValue = normalizeExamName(value);
    onExameChange(index, "nome", normalizedValue);

    if (normalizedValue.length > 0) {
      const filteredSuggestions = availableResults.filter(result =>
        result.nome?.toLowerCase().includes(normalizedValue.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(prev => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    } else {
      setSuggestions([]);
       setShowSuggestions(prev => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }
  };

  const handleSuggestionClick = (index: number, suggestion: ResultadoExame) => {
    // Ao selecionar uma sugestão, use o nome normalizado da sugestão
    const normalizedSuggestionName = normalizeExamName(suggestion.nome || "");
    onExameChange(index, "nome", normalizedSuggestionName);
    onExameChange(index, "unidade", suggestion.unidade || "");
    onExameChange(index, "referencia", suggestion.referencia || "");

    setSuggestions([]);
    setShowSuggestions(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  const handleInputFocus = (index: number, currentValue: string) => {
      if (currentValue && currentValue.length > 0) {
         const filteredSuggestions = availableResults.filter(result =>
          // Filtra sugestões com base no valor normalizado
          result.nome?.toLowerCase().includes(normalizeExamName(currentValue).toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      } else {
         setSuggestions(availableResults);
         setShowSuggestions(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }
  }

  const handleInputBlur = (index: number) => {
    setTimeout(() => {
       setShowSuggestions(prev => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }, 200);
  }


  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full table-auto text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="border p-2 text-left">Nome</th>
            <th className="border p-2 text-left">Valor</th>
            <th className="border p-2 text-left">Unidade</th>
            <th className="border p-2 text-left">Valor de Referência</th>
            <th className="border p-2 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {exames.map((exame, index) => (
            <tr key={exame.id || index} className="hover:bg-muted/50">
              <td className="border p-2 relative">
                <Input
                  value={exame.nome || ""}
                  onChange={(e) => handleNameInputChange(index, e.target.value)}
                  placeholder="Ex: Hemácias"
                  onBlur={() => handleInputBlur(index)}
                  onFocus={() => handleInputFocus(index, exame.nome || "")}
                />
                {showSuggestions[index] && suggestions.length > 0 && (
                  <ul className="absolute z-10 bg-background border border-gray-200 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto text-foreground">
                    {suggestions.map((suggestion, sugIndex) => (
                      <li
                        key={suggestion.id || sugIndex}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSuggestionClick(index, suggestion)}
                      >
                        {normalizeExamName(suggestion.nome || "")} {/* Exibe o nome normalizado na sugestão */}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.valor || ""}
                  onChange={(e) =>
                    onExameChange(index, "valor", e.target.value)
                  }
                  placeholder="Ex: 5.2"
                />
              </td>
              <td className="border p-2">
                <Select
                  value={exame.unidade || ""}
                  onValueChange={(value) =>
                    onExameChange(index, "unidade", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {exame.unidade === "Outro" && (
                  <Input
                    placeholder="Digite a unidade"
                    value={exame.outraUnidade || ""}
                    onChange={(e) =>
                      onExameChange(index, "outraUnidade", e.target.value)
                    }
                  />
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.referencia || ""}
                  onChange={(e) =>
                    onExameChange(index, "referencia", e.target.value)
                  }
                  placeholder="Ex: 4.5 - 6.0"
                />
              </td>
              <td className="border p-2 text-center">
                <Button
                  variant="destructive"
                  size="icon"
                  type="button"
                  onClick={() => onRemoveExame(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        type="button"
        onClick={onAddExame}
        variant="secondary"
        className="mt-4 flex items-center gap-2"
      >
        <Plus size={18} /> Adicionar exame
      </Button>
    </div>
  );
}
