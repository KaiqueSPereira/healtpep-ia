"use client";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { FileText } from 'lucide-react';
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";

// Define o tipo para o Exame com suas relações, para garantir a tipagem correta
type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
};

interface ExameItemProps {
  exame: ExameComRelacoes;
}

const ExameItem = ({ exame }: ExameItemProps) => {
  if (!exame) {
    return null; // Retorna nulo se o exame não for fornecido
  }

  const {
    id,
    profissional,
    unidades,
    dataExame,
    tipo,
    nomeArquivo,
  } = exame;

  // Formatação de data e hora
  const dataObj = dataExame ? new Date(dataExame) : new Date();
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dataObj).replace(".", "");
  const dia = dataObj.getDate().toString();
  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Extração de dados com valores padrão
  const nomeProfissional = profissional?.nome || "Profissional não informado";
  const unidadeNome = unidades?.nome || "Unidade não informada";
  const tipoExame = tipo || "Exame";

  const linkHref = `/exames/${id}`;

  return (
    <div className="w-full md:w-auto">
      {/* Altura do card aumentada para dar mais espaço ao conteúdo */}
      <Card className="min-w-[280px] max-w-[320px] h-52">
        <CardContent className="flex p-0 overflow-hidden h-full">
          {/* Seção principal de conteúdo (esquerda) */}
          <div className="flex flex-col gap-1 py-4 px-5 flex-grow min-w-0">
            <Badge 
              className="w-fit mb-2 bg-blue-600 text-primary-foreground hover:bg-blue-600/80"
            >
              {tipoExame}
            </Badge>

            {/* Textos sem truncamento para permitir quebra de linha */}
            <h3 className="text-md font-bold">{nomeProfissional}</h3>
            <p className="text-sm font-semibold">{unidadeNome}</p>
            
            {/* Botões na parte inferior com tamanho reduzido */}
            <div className="flex items-center gap-2 mt-auto">
              <Button variant="secondary" size="sm" asChild>
                <Link href={linkHref}>Ver Detalhes</Link>
              </Button>
              {nomeArquivo && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/api/exames/arquivo?id=${id}`} target="_blank">
                    <FileText className="mr-1 h-4 w-4" />
                    Laudo
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Borda vertical azul */}
          <div className="border-l-2 border-blue-600 h-full flex-shrink-0"></div>

          {/* Seção de data (direita) */}
          <div className="flex flex-col items-center justify-center px-4 py-5 flex-shrink-0 w-24">
            <p className="text-sm font-bold uppercase text-blue-600">{mes}</p>
            <p className="text-3xl font-bold">{dia}</p>
            <p className="text-sm">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExameItem;