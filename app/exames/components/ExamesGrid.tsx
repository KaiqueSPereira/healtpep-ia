// app/exames/components/ExameGrid.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import clsx from "clsx";

type Resultado = {
  nome: string;
  valor: string;
  unidade?: string;
  referencia?: string;
};

type Exame = {
  id: string;
  nome: string; // Mantido, embora 'tipo' pareça ser usado para o nome/tipo do exame agora
  dataExame: string;
  nomeArquivo?: string;
  profissional?: { nome: string };
  unidades?: { nome: string };
  tratamento?: { nome: string }; // Tratamento parece não ser usado no layout final do Item, mas mantido no type
  tipo?: string; // Usado para o tipo do exame (Sangue, Urina, etc.)
  anotacao?: string; // Adicionado 'anotacao' ao type
  resultados?: Resultado[]; // Mantido, embora não exibido no layout do Item
};

type Props = {
  exames: Exame[];
  onDeleteClick: (examId: string) => void;
};

export function ExameGrid({ exames, onDeleteClick }: Props) {
  const router = useRouter();

  if (exames.length === 0) {
    return <p className="text-muted-foreground">Nenhum exame encontrado.</p>;
  }

  const handleEdit = (id: string) => {
    router.push(`/exames/${id}/editar`);
  };

  // Formata a data e hora de forma similar ao ExameItem
  const formatExameDate = (dateString: string) => {
    const dataObj = dateString ? new Date(dateString) : null;

    const mes = dataObj
      ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj)
      : "Mês não especificado";

    const dia = dataObj ? dataObj.getDate().toString() : "Dia não especificado";

    const horaFormatada = dataObj
      ? dataObj.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Hora não especificado";

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
              "relative cursor-pointer border bg-background transition-shadow duration-200 hover:shadow-lg", // Removido pb-16 para melhor controle do padding
            )}
          >
            {/* Conteúdo do Card replicando a estrutura do ExameItem */}
            <CardContent className="flex p-0 overflow-hidden h-full"> {/* h-full para ocupar a altura do Card */}
              {/* Informações do exame (lado esquerdo) */}
              {/* Adicionado padding p-4 ou p-5 similar ao ExameItem */}
              <div className="flex flex-col gap-1 py-5 pl-5 pr-4 flex-grow">
                {/* Exibe o nome/tipo do exame com a cor de destaque */}
                <h3 className="text-lg font-bold text-primary">{exame.tipo || 'Tipo não especificado'}</h3>
                {/* Exibe o nome do profissional */}
                <p className="text-sm font-semibold ">{profissionalNome}</p>
                {/* Exibe o nome da unidade */}
                <p className="truncate text-sm ">{unidadeNome}</p>
                {/* Exibe a anotação se existir */}
                {anotacaoExame && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{anotacaoExame}</p>
                )}
                {/* Os botões agora estarão dentro deste flex container, mas alinhados ao fundo */}
                {/* Adicionado mt-auto para empurrar os botões para baixo */}
                <div
                    className="flex justify-between gap-2 mt-auto pt-4" // pt-4 para adicionar espaço acima dos botões
                    onClick={(e) => e.stopPropagation()} // Impede propagação para o card
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
                </div>
              </div>
              {/* Separador com a cor de destaque */}
              <div className="border-l-2 border-primary h-full flex-shrink-0"></div> {/* <-- Adicionado border-primary aqui */}
              {/* Data e hora do exame (lado direito) */}
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
