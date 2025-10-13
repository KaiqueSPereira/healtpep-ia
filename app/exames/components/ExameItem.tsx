"use client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { Exame } from "@/app/_components/types"; // Importe os tipos necessários
import { FileText } from 'lucide-react'; // Importar o ícone

interface ExameItemProps {
  exame: Exame;
}

const ExameItem = ({ exame }: ExameItemProps) => {
  if (!exame) {
    return (
      <p className="text-gray-300">Dados do exame não encontrados.</p>
    );
  }

  const {
    id, // Pegamos o ID para o link
    profissional,
    unidades, // Usamos 'unidades' conforme a API retorna a relação
    dataExame,
    anotacao,
    tipo, // Adicionado a propriedade tipo
    nomeArquivo, // Adicionado nomeArquivo
  } = exame;

  // Formata a data e hora
  const dataObj = dataExame ? new Date(dataExame) : null;

  const mes = dataObj
    ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj)
    : "Mês não especificado";

  const dia = dataObj ? dataObj.getDate().toString() : "Dia não especificado";

  // Lida com dados opcionais de profissional e unidade
  const profissionalNome =
    profissional?.nome || "Profissional não especificado";
  const unidadeNome = unidades?.nome || "Unidade não especificada"; // Acessando o nome da unidade

  // Exibe a anotação se existir
  const anotacaoExame = anotacao;


  return (
    <div className="w-full md:w-auto">
      <Card className="min-w-[280px] max-w-[320px] h-52">
        <CardContent className="flex p-0 overflow-hidden h-full">
          <div className="flex flex-col gap-1 py-5 pl-5 pr-4 flex-grow">
            <h3 className="text-lg font-bold ">{tipo || 'Tipo não especificado'}</h3>
            <p className="text-sm font-semibold ">{profissionalNome}</p>
            <p className="truncate text-sm ">{unidadeNome}</p>
            {anotacaoExame && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{anotacaoExame}</p>
            )}
            {/* Botões de ação */}
            <div className="flex items-center gap-2 mt-auto">
              <Button variant="secondary" asChild>
                <Link href={`/exames/${id}`}>Detalhes</Link>
              </Button>
              {nomeArquivo && (
                <Button variant="ghost" asChild>
                  <Link href={`/api/exames/arquivo?id=${id}`} target="_blank">
                    <FileText className="mr-1 h-4 w-4" />
                    Laudo
                  </Link>
                </Button>
              )}
            </div>
          </div>
           <div className="border-l-2 border-blue-500 h-full flex-shrink-0"></div>
          <div className="flex flex-col items-center justify-between px-5 py-5 flex-shrink-0 w-24">
            <p className="text-sm capitalize ">{mes}</p>
            <p className="text-2xl font-bold ">{dia}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExameItem;
