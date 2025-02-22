"use client";

import { FilePenLine } from "lucide-react";
import { Button } from "@/app/_components/ui/button";


interface BotaoEditarConsultaProps {
  consultaId: string;
}

const BotaoEditarConsulta: React.FC<BotaoEditarConsultaProps> = ({
  consultaId,
}) => {
  

  const handleEdit = async () => {
    try {
      const response = await fetch(`/api/consultas/${consultaId}`);
      if (!response.ok) throw new Error("Erro ao buscar a consulta");

    } catch (error) {
      console.error("Erro ao buscar consulta:", error);
    }
  };

  return (
    <>
      <Button onClick={handleEdit} variant="outline">
        <FilePenLine className="mr-2 h-4 w-4" />
        Editar consulta
      </Button>
    </>
  );
};

export default BotaoEditarConsulta;
