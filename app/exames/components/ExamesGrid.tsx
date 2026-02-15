
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Trash2, Pencil, Paperclip } from "lucide-react";
import clsx from "clsx";
import { ExameCompleto } from "../page";
import AnexosDialog from "./AnexosDialog";

type Props = {
  exames: ExameCompleto[];
  onDeleteClick: (examId: string) => void;
};

export function ExamesGrid({ exames, onDeleteClick }: Props) {
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  if (exames.length === 0) {
    return <p className="text-muted-foreground">Nenhum exame encontrado para os filtros selecionados.</p>;
  }

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/exames/${id}/editar`);
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteClick(id);
  };

  const handleViewAnexos = (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    setSelectedExamId(examId);
  };

  const formatExameDate = (dataInput: string | Date | null | undefined) => {
    const dataObj = dataInput ? new Date(dataInput) : null;

    if (!dataObj || isNaN(dataObj.getTime())) {
        return { mes: "Data inválida", dia: "!", horaFormatada: "xx:xx" };
    }
    
    const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj);
    const dia = dataObj.getDate().toString();
    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return { mes, dia, horaFormatada };
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exames.map((exame) => {
          
          const { mes, dia, horaFormatada } = formatExameDate(exame.dataExame);
          const profissionalNome = exame.profissional?.nome || "Profissional não especificado";
          const unidadeNome = exame.unidades?.nome || "Unidade não especificada";
          const anotacaoExame = exame.anotacao ? String(exame.anotacao) : null;
          const hasAnexos = exame._count ? exame._count.anexos > 0 : false;

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
                  <h3 className="text-lg font-bold text-primary truncate">{exame.tipo || 'Tipo não especificado'}</h3>
                  <p className="text-sm font-semibold truncate">{profissionalNome}</p>
                  <p className="truncate text-sm ">{unidadeNome}</p>
                  {anotacaoExame && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{anotacaoExame}</p>
                  )}
                  <div className="flex justify-start items-center gap-1 mt-auto pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleEdit(e, exame.id)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(e, exame.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Apagar
                      </Button>
                      {hasAnexos && (
                        <Button
                          variant="ghost"
                          size="icon" // Apenas ícone
                          onClick={(e) => handleViewAnexos(e, exame.id)}
                          title="Ver anexos"
                          className="text-muted-foreground"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      )}
                  </div>
                </div>
                <div className="border-l-2 border-primary h-full flex-shrink-0"></div>
                <div className="flex flex-col items-center justify-between px-5 py-5 flex-shrink-0 w-24">
                  <p className="text-sm capitalize font-semibold">{mes}</p>
                  <p className="text-3xl font-bold ">{dia}</p>
                  <p className="text-sm ">{horaFormatada}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AnexosDialog
        open={!!selectedExamId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedExamId(null);
          }
        }}
        examId={selectedExamId}
      />
    </>
  );
}
