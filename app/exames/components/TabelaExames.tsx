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
              <td className="border p-2">
                <Input
                  value={exame.nome}
                  onChange={(e) => onExameChange(index, "nome", e.target.value)}
                  placeholder="Ex: Hemácias"
                />
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
