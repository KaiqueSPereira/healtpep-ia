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
import { ResultadoExame, Exame } from "@/app/_components/types"; // Importe Exame aqui
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
  const [suggestions, setSuggestions] = useState<ResultadoExame[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        const response = await fetch("/api/exames");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // A API agora retorna um array de Exame[]
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
        setAvailableResults([]); // Garante que availableResults seja um array vazio em caso de erro
      }
    };

    fetchAvailableExams();
  }, []);

  const handleNameInputChange = (index: number, value: string) => {
    onExameChange(index, "nome", value);

    if (value.length > 0) {
      const filteredSuggestions = availableResults.filter(result =>
        result.nome?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (index: number, suggestion: ResultadoExame) => {
    onExameChange(index, "nome", suggestion.nome || "");
    onExameChange(index, "unidade", suggestion.unidade || "");
    onExameChange(index, "referencia", suggestion.referencia || "");

    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full table-auto text-sm text-white">
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
            <tr key={exame.id || index} className="hover:bg-muted/50"> {/* Use index como fallback para key */}
              <td className="border p-2 relative">
                <Input
                  value={exame.nome || ""} // Garante que o valor não seja null/undefined
                  onChange={(e) => handleNameInputChange(index, e.target.value)}
                  placeholder="Ex: Hemácias"
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  onFocus={() => {
                    if (exame.nome && exame.nome.length > 0) {
                       const filteredSuggestions = availableResults.filter(result =>
                        result.nome?.toLowerCase().includes(exame.nome!.toLowerCase())
                      );
                      setSuggestions(filteredSuggestions);
                      setShowSuggestions(true);
                    } else { // Se o input estiver vazio ao focar, mostre todas as sugestões únicas
                       setSuggestions(availableResults);
                       setShowSuggestions(true);
                    }
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map((suggestion, sugIndex) => (
                      <li
                        key={suggestion.id || sugIndex} // Use o ID da sugestão ou sugIndex como fallback
                        className="p-2 cursor-pointer hover:bg-gray-100 text-gray-800"
                        onClick={() => handleSuggestionClick(index, suggestion)}
                      >
                        {suggestion.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.valor || ""} // Garante que o valor não seja null/undefined
                  onChange={(e) =>
                    onExameChange(index, "valor", e.target.value)
                  }
                  placeholder="Ex: 5.2"
                />
              </td>
              <td className="border p-2">
                <Select
                  value={exame.unidade || ""} // Garante que o valor não seja null/undefined
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
                    value={exame.outraUnidade || ""} // Garante que o valor não seja null/undefined
                    onChange={(e) =>
                      onExameChange(index, "outraUnidade", e.target.value)
                    }
                  />
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.referencia || ""} // Garante que o valor não seja null/undefined
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
