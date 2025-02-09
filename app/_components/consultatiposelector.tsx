"use client";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Label } from "@/app/_components/ui/label";
import React from "react";

type ConsultaTipoSelectorProps = {
  consultaTipos: string[];
  selectedTipo: string | undefined;
  onTipoSelect: (tipo: string) => void;
};

const ConsultaTipoSelector: React.FC<ConsultaTipoSelectorProps> = ({
  consultaTipos,
  selectedTipo,
  onTipoSelect,
}) => {
  return (
    <RadioGroup
      value={selectedTipo}
      onValueChange={onTipoSelect}
      className="flex-col gap-3 grid grid-cols-2"
    >
      {consultaTipos.map((tipo) => (
        <div key={tipo} className="flex items-center space-x-2">
          <RadioGroupItem value={tipo} id={tipo} />
          <Label htmlFor={tipo}>{tipo}</Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default ConsultaTipoSelector;
