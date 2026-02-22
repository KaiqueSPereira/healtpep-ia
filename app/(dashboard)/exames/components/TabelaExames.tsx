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
import { ResultadoExame } from "@prisma/client";
import { useState, useEffect } from "react";
import { useDebounce } from "@/app/_hooks/use-debounce";

interface TabelaExamesProps {
  exames: Partial<ResultadoExame>[];
  onAddExame: () => void;
  onRemoveExame: (index: number) => void;
  onExameChange: (
    index: number,
    field: keyof ResultadoExame,
    value: string
  ) => void;
}

const unidadesMedida = [
  "g/dL", "mg/dL", "mg/L", "mg/mL", "mg/g", "mg/kg", "μg/dL", "µg/dL", "μg/mL", "µg/mL", "μg/L", "µg/L",
  "ng/mL", "ng/dL", "pg/mL", "pg/dL", "pg", "mmol/L", "μmol/L", "µmol/L", "mcmol/L", "mcmol/mol",
  "nmol/L", "pmol/L","mEq/L", "Eq/L","U/L", "IU/L", "UI/L", "KU/L", "μIU/mL", "µIU/mL", "uUI/mL", "µUI/mL", "mUI/mL","%", "milhões/mm³", "mil/mm³",
  "mm³", "mm/h","células/μL", "células/uL", "10³/μL", "10³/uL","10⁶/μL", "10⁶/uL", "x10⁶/uL","fL", "pL","g/L", "g/mL",
  "mL/min", "L/min","uL", "μL", "µL","mL", "L","mL/kg/min","g/24h", "mg/24h", "μg/24h", "µg/24h",
  "cópias/mL", "UI/mL", "IU/mL","log", "log10", "log cópias/mL","ratio", "Índice", "Index",
  "segundos", "s","bpm","mmHg","°C","mOsm/kg", "mOsm/L","U/mL","RFU","S/CO","AU/mL","--","Outro",
];

export default function TabelaExames({
  exames,
  onAddExame,
  onRemoveExame,
  onExameChange,
}: TabelaExamesProps) {
  const [sugestoes, setSugestoes] = useState<Partial<ResultadoExame>[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchSugestoes = async () => {
      if (debouncedSearchQuery && debouncedSearchQuery.length > 1) {
        try {
          const response = await fetch(
            `/api/exames/search?q=${debouncedSearchQuery}`
          );
          if (response.ok) {
            const data = await response.json();
            setSugestoes(data);
          } else {
            setSugestoes([]);
          }
        } catch (error) {
          console.error("Erro ao buscar sugestões:", error);
          setSugestoes([]);
        }
      } else {
        setSugestoes([]);
      }
    };

    if (activeIndex !== null) {
      fetchSugestoes();
    }
  }, [debouncedSearchQuery, activeIndex]);

  const handleNomeChange = (index: number, value: string) => {
    onExameChange(index, "nome", value);
    setSearchQuery(value);
    setActiveIndex(index);
  };

  const handleSuggestionClick = (
    index: number,
    sugestao: Partial<ResultadoExame>
  ) => {
    onExameChange(index, "nome", sugestao.nome || "");
    onExameChange(index, "unidade", sugestao.unidade || "");
    onExameChange(index, "referencia", sugestao.referencia || "");
    setSugestoes([]);
    setSearchQuery("");
    setActiveIndex(null);
  };

  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="border p-2 text-left font-medium w-2/5">Nome</th>
            <th className="border p-2 text-left font-medium">Valor</th>
            <th className="border p-2 text-left font-medium">Unidade</th>
            <th className="border p-2 text-left font-medium">Valor de Referência</th>
            <th className="border p-2 text-center font-medium w-[100px]">Ações</th>
          </tr>
        </thead>
        <tbody>
          {exames.map((exame, index) => (
            <tr key={index} className="hover:bg-muted/50">
              <td className="border p-2 relative">
                <Input
                  value={exame.nome || ""}
                  onChange={(e) => handleNomeChange(index, e.target.value)}
                  onFocus={() => {
                    setActiveIndex(index);
                    setSearchQuery(exame.nome || "");
                  }}
                  placeholder="Ex: Hemácias"
                />
                {activeIndex === index && sugestoes.length > 0 && (
                  <ul className="absolute z-10 w-full bg-background mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {sugestoes.map((sugestao) => (
                      <li
                        key={sugestao.id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onMouseDown={() => handleSuggestionClick(index, sugestao)}
                      >
                        {sugestao.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.valor || ""}
                  onChange={(e) => onExameChange(index, "valor", e.target.value)}
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

      <div className="p-4">
        <Button
          type="button"
          onClick={onAddExame}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar exame
        </Button>
      </div>
    </div>
  );
}
