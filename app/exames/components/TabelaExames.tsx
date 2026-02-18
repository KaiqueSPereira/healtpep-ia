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

interface TabelaExamesProps {
  exames: Partial<ResultadoExame>[];
  onAddExame: () => void;
  onRemoveExame: (index: number) => void;
  onExameChange: (index: number, field: keyof ResultadoExame, value: string) => void;
}

const unidadesMedida = [
  "g/dL", "mg/dL", "mg/L", "mg/mL", "mg/g", "mg/kg", "μg/dL", "µg/dL", "μg/mL", "µg/mL", "μg/L", "µg/L",
  "ng/mL", "ng/dL", "pg/mL", "pg/dL", "pg", "mmol/L", "μmol/L", "µmol/L", "mcmol/L", "mcmol/mol",
  "nmol/L", "pmol/L","mEq/L", "Eq/L","U/L", "IU/L", "UI/L", "KU/L", "μIU/mL", "µIU/mL", "uUI/mL", "µUI/mL", "mUI/mL","%", "milhões/mm³", "mil/mm³",
  "mm³", "mm/h","células/μL", "celulas/μL", "células/uL", "celulas/uL", "10³/μL", "10³/uL","10⁶/μL", "10⁶/uL", "x10⁶/uL","fL", "pL","g/L", "g/mL",
  "mL/min", "L/min","uL", "μL", "µL","mL", "L","mL/kg/min","g/24h", "mg/24h", "μg/24h", "µg/24h",
  "cópias/mL", "Cópias/ML", "UI/mL", "IU/mL","log", "log10", "log copies/mL","ratio", "Índice", "Index",
  "segundos", "s","bpm","mmHg","°C","mOsm/kg", "mOsm/L","U/mL","RFU","S/CO","AU/mL","--","Outro",
]

export default function TabelaExames({
  exames,
  onAddExame,
  onRemoveExame,
  onExameChange,
}: TabelaExamesProps) {

  // A lógica de sugestões foi removida para simplificar e corrigir bugs.
  // Esta responsabilidade pode ser reimplementada no futuro, se necessário.

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
            // CORREÇÃO: Usa o índice como chave, pois o ID pode não existir para novos itens
            <tr key={index} className="hover:bg-muted/50">
              <td className="border p-2 relative">
                <Input
                  // CORREÇÃO: Usa optional chaining e um fallback para evitar erros
                  value={exame.nome || ""}
                  onChange={(e) => onExameChange(index, "nome", e.target.value)}
                  placeholder="Ex: Hemácias"
                />
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
                  onValueChange={(value) => onExameChange(index, "unidade", value)}
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
                {/* Esta lógica para "Outra" unidade precisa ser reavaliada, por enquanto foi removida para evitar erros */}
              </td>
              <td className="border p-2">
                <Input
                  value={exame.referencia || ""}
                  onChange={(e) => onExameChange(index, "referencia", e.target.value)}
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
