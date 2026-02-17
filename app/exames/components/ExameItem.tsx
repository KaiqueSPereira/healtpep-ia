"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { Paperclip } from 'lucide-react';
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";
import AnexosDialog from "./AnexosDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";

// O tipo agora espera a contagem de anexos
type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
  _count?: { anexos: number };
};

interface ExameItemProps {
  exame: ExameComRelacoes;
}

const ExameItem = ({ exame }: ExameItemProps) => {
  const [isAnexosDialogOpen, setIsAnexosDialogOpen] = useState(false);

  if (!exame) {
    return null;
  }

  const {
    id,
    profissional,
    unidades,
    dataExame,
    tipo,
    _count,
  } = exame;

  const dataObj = dataExame ? new Date(dataExame) : new Date();
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dataObj).replace(".", "");
  const dia = dataObj.getDate().toString();
  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataCompleta = dataObj.toLocaleDateString("pt-BR", { dateStyle: 'full' });

  const nomeProfissional = profissional?.nome || "Profissional não informado";
  const unidadeNome = unidades?.nome || "Unidade não informada";
  const tipoExame = tipo || "Exame";
  const linkHref = `/exames/${id}`;

  const hasAnexos = _count ? _count.anexos > 0 : false;

  const handleAnexoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnexosDialogOpen(true);
  };

  const tooltipContent = (
    <div className="p-2 text-sm">
      <p><strong>Tipo:</strong> {tipoExame}</p>
      <p><strong>Data:</strong> {dataCompleta}</p>
      <p><strong>Hora:</strong> {horaFormatada}</p>
      <p><strong>Profissional:</strong> {nomeProfissional}</p>
      <p><strong>Local:</strong> {unidadeNome}</p>
    </div>
  );

  return (
    <>
      <div className="w-full md:w-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
                <Card className="min-w-[280px] max-w-[320px] h-52 cursor-pointer transition-shadow hover:shadow-md">
                <Link href={linkHref} passHref className="block h-full w-full">
                  <CardContent className="flex p-0 overflow-hidden h-full">
                    <div className="flex flex-col gap-1 py-4 px-5 flex-grow min-w-0">
                      <Badge
                        className="w-fit mb-2 bg-blue-600 text-primary-foreground hover:bg-blue-600/80"
                      >
                        {tipoExame}
                      </Badge>

                      <h3 className="text-sm font-bold truncate">{nomeProfissional}</h3>
                      <p className="text-xs font-semibold truncate">{unidadeNome}</p>

                      <div className="flex items-center justify-between mt-auto">
                        <Button variant="secondary" size="sm" asChild>
                          <a>Ver Detalhes</a>
                        </Button>
                        {hasAnexos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleAnexoClick}
                            title="Ver anexos"
                            className="text-muted-foreground"
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="border-l-2 border-blue-600 h-full flex-shrink-0"></div>

                    <div className="flex flex-col items-center justify-center px-4 py-5 flex-shrink-0 w-24">
                      <p className="text-sm font-bold uppercase text-blue-600">{mes}</p>
                      <p className="text-2xl font-bold">{dia}</p>
                      <p className="text-sm">{horaFormatada}</p>
                    </div>
                  </CardContent>
                  </Link>
                </Card>
            </TooltipTrigger>
            <TooltipContent>{tooltipContent}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {hasAnexos && (
        <AnexosDialog
          open={isAnexosDialogOpen}
          onOpenChange={setIsAnexosDialogOpen}
          examId={id}
        />
      )}
    </>
  );
};

export default ExameItem;
