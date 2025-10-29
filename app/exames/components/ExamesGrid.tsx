"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Trash2, Pencil, FileText } from "lucide-react";
import clsx from "clsx";
import { ExameCompleto } from "../page";

type Props = {
  exames: ExameCompleto[];
  onDeleteClick: (examId: string) => void;
};

export function ExamesGrid({ exames, onDeleteClick }: Props) {
  const router = useRouter();

  if (exames.length === 0) {
    return <p className="text-muted-foreground">Nenhum exame encontrado para os filtros selecionados.</p>;
  }

  const handleEdit = (id: string) => {
    router.push(`/exames/${id}/editar`);
  };
  
  const handleViewReport = (examId: string) => {
    window.open(`/api/exames/arquivo?id=${examId}`, "_blank");
  };

  // CORREÇÃO: A função agora trata a data de entrada (string da API) e valida antes de formatar.
  const formatExameDate = (dataInput: string | Date | null | undefined) => {
    const dataObj = dataInput ? new Date(dataInput) : null;

    // Verifica se o objeto Date é válido antes de tentar formatar
    if (!dataObj || isNaN(dataObj.getTime())) {
        return { mes: "Data inválida", dia: "!", horaFormatada: "xx:xx" };
    }
    
    const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj);
    const dia = dataObj.getDate().toString();
    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return { mes, dia, horaFormatada };
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exames.map((exame) => {
        
        const { mes, dia, horaFormatada } = formatExameDate(exame.dataExame);
        const profissionalNome = exame.profissional?.nome || "Profissional não especificado";
        const unidadeNome = exame.unidades?.nome || "Unidade não especificada";
        const anotacaoExame = exame.anotacao;

        return (
          <Card
            key={exame.id}
            onClick={() => router.push(`/exames/${exame.id}`)}
            className={clsx(
              "relative cursor-pointer border bg-background transition-shadow duration-200 hover:shadow-lg",
            )}
          >
            <CardContent className="flex p-0 overflow-hidden h-full">
              <div className="flex flex-col gap-1 py-5 pl-5 pr-4 flex-grow">
                <h3 className="text-lg font-bold text-primary">{exame.tipo || 'Tipo não especificado'}</h3>
                <p className="text-sm font-semibold ">{profissionalNome}</p>
                <p className="truncate text-sm ">{unidadeNome}</p>
                {anotacaoExame && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{anotacaoExame}</p>
                )}
                <div
                    className="flex justify-start gap-2 mt-auto pt-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(exame.id)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteClick(exame.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Apagar
                    </Button>
                    {exame.nomeArquivo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReport(exame.id)}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Laudo
                      </Button>
                    )}
                </div>
              </div>
              <div className="border-l-2 border-primary h-full flex-shrink-0"></div>
              <div className="flex flex-col items-center justify-between px-5 py-5 flex-shrink-0 w-24">
                <p className="text-sm capitalize ">{mes}</p>
                <p className="text-2xl font-bold ">{dia}</p>
                <p className="text-sm ">{horaFormatada}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
