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
import { ResultadoExame } from "@/app/_components/types";
import { useState, useEffect } from "react"; // Importar useState e useEffect

// Defina uma interface para os dados completos do exame retornados pela API,
// incluindo a estrutura aninhada de 'resultados'.
// Ajuste conforme a estrutura exata que sua API retorna após a descriptografia.
interface ExameAPI {
  id: string;
  nome: string | null; // Nome do arquivo, pode ser null
  nomeArquivo: string | null; // Nome único do arquivo, pode ser null
  dataExame: string; // Ou Date, dependendo de como você lida com datas
  anotacao: string | null; // Anotação, pode ser null
  tipo: string;
  userId: string;
  createdAt: string; // Ou Date
  updatedAt: string; // Ou Date
  resultados: ResultadoExame[]; // Array de resultados de exame
  profissional: any; // Defina uma interface mais específica se for usar dados do profissional
  unidades: any; // Defina uma interface mais específica se for usar dados da unidade
  // ... outros campos que a API retorna no nível raiz do exame
}

// app/exames/components/TabelaExames.tsx
interface TabelaExamesProps {
  exames: ResultadoExame[]; // Use o mesmo tipo
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
  const [availableResults, setAvailableResults] = useState<ResultadoExame[]>([]); // Estado para armazenar todos os resultados disponíveis
  const [suggestions, setSuggestions] = useState<ResultadoExame[]>([]); // Estado para as sugestões filtradas
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false); // Estado para controlar a visibilidade das sugestões


  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        const response = await fetch("/api/exames");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ExameAPI[] = await response.json();

        const allResults: ResultadoExame[] = data.reduce((acc, exame) => {
          if (exame.resultados && Array.isArray(exame.resultados)) {
             const formattedResults = exame.resultados.map(resultado => ({
               id: resultado.id,
               nome: resultado.nome,
               valor: resultado.valor, // Incluir valor caso precise para algo, embora não para preencher autocompletar
               unidade: resultado.unidade,
               referencia: resultado.referencia,
             }));
            return acc.concat(formattedResults);
          }
          return acc;
        }, [] as ResultadoExame[]);

        // Opcional: Remover duplicatas com base no nome do exame para sugestões mais limpas
        // Mantemos apenas o primeiro resultado encontrado para cada nome de exame único
        const uniqueResults = Array.from(new Map(allResults.map(item => [item.nome, item])).values());


        setAvailableResults(uniqueResults);
      } catch (error) {
        console.error("Erro ao buscar exames disponíveis:", error);
      }
    };

    fetchAvailableExams();
  }, []);


  // Função para lidar com a mudança no input do nome do exame
  const handleNameInputChange = (index: number, value: string) => {
    onExameChange(index, "nome", value); // Atualiza o estado do componente pai com o novo nome

    if (value.length > 0) {
      // Filtrar sugestões com base no valor digitado (case-insensitive)
      const filteredSuggestions = availableResults.filter(result =>
        result.nome?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true); // Exibir sugestões se houver input
    } else {
      setSuggestions([]); // Limpar sugestões se o input estiver vazio
      setShowSuggestions(false); // Ocultar sugestões
    }
  };

  // Função para lidar com a seleção de uma sugestão
  const handleSuggestionClick = (index: number, suggestion: ResultadoExame) => {
    // Preencher o input de nome com o nome da sugestão
    onExameChange(index, "nome", suggestion.nome || "");

    // Preencher unidade e referência com os dados da sugestão
    onExameChange(index, "unidade", suggestion.unidade || "");
    onExameChange(index, "referencia", suggestion.referencia || "");

    setSuggestions([]); // Limpar sugestões após a seleção
    setShowSuggestions(false); // Ocultar sugestões
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
            <tr key={exame.id} className="hover:bg-muted/50">
              <td className="border p-2 relative"> {/* Adicionar 'relative' para posicionar as sugestões */}
                <Input
                  value={exame.nome}
                  onChange={(e) => handleNameInputChange(index, e.target.value)} // Usar a nova função de handler
                  placeholder="Ex: Hemácias"
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Ocultar sugestões ao perder o foco, com um pequeno delay
                  onFocus={() => { // Opcional: mostrar sugestões novamente ao focar se houver input
                    if (exame.nome && exame.nome.length > 0) {
                       const filteredSuggestions = availableResults.filter(result =>
                        result.nome?.toLowerCase().includes(exame.nome!.toLowerCase())
                      );
                      setSuggestions(filteredSuggestions);
                      setShowSuggestions(true);
                    }
                  }}
                />
                {/* Exibir sugestões */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map((suggestion, sugIndex) => (
                      <li
                        key={sugIndex} // Usar sugIndex ou um ID único da sugestão, se disponível
                        className="p-2 cursor-pointer hover:bg-gray-100 text-gray-800"
                        onClick={() => handleSuggestionClick(index, suggestion)} // Lidar com o clique na sugestão
                      >
                        {suggestion.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.valor}
                  onChange={(e) =>
                    onExameChange(index, "valor", e.target.value)
                  }
                  placeholder="Ex: 5.2"
                />
              </td>
              <td className="border p-2">
                <Select
                  value={exame.unidade}
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
                    value={exame.outraUnidade}
                    onChange={(e) =>
                      onExameChange(index, "outraUnidade", e.target.value)
                    }
                  />
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.referencia}
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
