"use client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { Exame } from "@/app/_components/types"; // Importe os tipos necessários


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
  } = exame;

  // Formata a data e hora
  const dataObj = dataExame ? new Date(dataExame) : null;

  const mes = dataObj
    ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj)
    : "Mês não especificado";

  const dia = dataObj ? dataObj.getDate().toString() : "Dia não especificado";

  // Lida com dados opcionais de profissional e unidade
  // Usamos profissional?.nome e unidades?.nome conforme a estrutura esperada
  const profissionalNome =
    profissional?.nome || "Profissional não especificado";
  const unidadeNome = unidades?.nome || "Unidade não especificada"; // Acessando o nome da unidade

  // Exibe a anotação se existir
  const anotacaoExame = anotacao;


  return (
    <div className="w-full md:w-auto">
      {/* Ajuste a altura conforme necessário */}
      <Card className="min-w-[280px] max-w-[320px] h-52">
        <CardContent className="flex p-0 overflow-hidden h-full">
          {/* Informações do exame */}
          <div className="flex flex-col gap-1 py-5 pl-5 pr-4 flex-grow">
            {/* Exibe o nome/tipo do exame */}
            <h3 className="text-lg font-bold ">{tipo || 'Tipo não especificado'}</h3>
            {/* Exibe o nome do profissional */}
            <p className="text-sm font-semibold ">{profissionalNome}</p>
            {/* Exibe o nome da unidade */}
            <p className="truncate text-sm ">{unidadeNome}</p>
            {/* Exibe a anotação se existir */}
            {anotacaoExame && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{anotacaoExame}</p>
            )}
            {/* Botão de detalhes */}
            {/* mt-auto para alinhar o botão na parte inferior */}
            <Button variant="secondary" className="mt-auto w-20" asChild>
              {/* Link para a rota de detalhes de exame */}
              <Link href={`/exames/${id}`}>Detalhes</Link>
            </Button>
          </div>
          {/* Data e hora do exame com borda */}
          {/* Separador com a borda. Posicionado para ocupar 0 espaço flex, apenas a borda. */}
           {/* Cor da borda ajustada para diferenciar (ex: azul) */}
           <div className="border-l-2 border-blue-500 h-full flex-shrink-0"></div>
          {/* Data e hora do exame. Usando w-24 para largura fixa. */}
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
