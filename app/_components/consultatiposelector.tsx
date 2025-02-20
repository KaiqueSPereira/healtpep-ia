"use client";

import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Label } from "@/app/_components/ui/label";
import { toast } from "@/app/_hooks/use-toast";
import { Consultatype } from "@prisma/client";

type ConsultaTipoSelectorProps = {
  selectedTipo: Consultatype | undefined;
  onTipoSelect: (tipo: Consultatype) => void;
};

const ConsultaTipoSelector: React.FC<ConsultaTipoSelectorProps> = ({
  selectedTipo,
  onTipoSelect,
}) => {
  const [consultaTipos, setConsultaTipos] = useState<Consultatype[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await fetch("/api/consultas?tipo=true");
        if (!res.ok) throw new Error("Erro ao buscar tipos de consulta");

        const tipos = await res.json();
        setConsultaTipos(tipos);
      } catch (error) {
        console.error("Erro ao buscar tipos de consulta:", error);
        toast({
          title: "Erro ao carregar tipos de consulta.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  }, []);

  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Carregando tipos de consulta...</p>
      ) : consultaTipos.length > 0 ? (
        <RadioGroup
          value={selectedTipo}
          onValueChange={(value) => onTipoSelect(value as Consultatype)}
          className="grid grid-cols-2 flex-col gap-3"
        >
          {consultaTipos.map((tipo) => (
            <div key={tipo} className="flex items-center space-x-2">
              <RadioGroupItem value={tipo} id={tipo} />
              <Label htmlFor={tipo}>{tipo}</Label>
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
