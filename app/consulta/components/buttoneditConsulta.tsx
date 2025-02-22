"use client";

import { useRouter } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface BotaoEditarConsultaProps {
  consultaId: string;
}

const BotaoEditarConsulta: React.FC<BotaoEditarConsultaProps> = ({
  consultaId,
}) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/consulta/${consultaId}/editar`); // Redireciona para a tela de edição
  };

  return (
    <Button onClick={handleEdit} variant="outline">
      <FilePenLine className="mr-2 h-4 w-4" />
      Editar consulta
    </Button>
  );
};

export default BotaoEditarConsulta;
