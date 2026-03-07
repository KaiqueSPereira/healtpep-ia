"use client";

import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Label } from "@/app/_components/ui/label";
// CORREÇÃO: Importando o tipo correto com 'T' maiúsculo.
import { ConsultaType } from "@/app/_components/types"; 

// A props foram atualizadas para receber 'tipos' e 'loading'.
type ConsultaTipoSelectorProps = {
  tipos: ConsultaType[];
  loading: boolean;
  selectedTipo: ConsultaType | undefined;
  onTipoSelect: (tipo: ConsultaType) => void;
};

const ConsultaTipoSelector: React.FC<ConsultaTipoSelectorProps> = ({
  tipos,
  loading,
  selectedTipo,
  onTipoSelect,
}) => {
  // Toda a lógica de fetch (useEffect, useState) foi removida daqui.
  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando tipos de consulta...</p>
      ) : tipos && tipos.length > 0 ? (
        <RadioGroup
          value={selectedTipo}
          onValueChange={(value) => onTipoSelect(value as ConsultaType)}
          className="grid grid-cols-2 flex-col gap-3"
        >
          {tipos.map((tipo) => (
            <div key={tipo} className="flex items-center space-x-2">
              <RadioGroupItem value={tipo} id={tipo} />
              <Label htmlFor={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <p className="text-gray-500">Nenhum tipo de consulta disponível.</p>
      )}
    </div>
  );
};

export default ConsultaTipoSelector;