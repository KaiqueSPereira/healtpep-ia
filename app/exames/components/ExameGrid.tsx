"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import Image from 'next/image';


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
  // Novo estado para controlar qual exame está sendo hoverado
  const [hoveredExamId, setHoveredExamId] = useState<string | null>(null);
  // Novo estado para armazenar Data URLs das prévias
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});
   // Novo estado para rastrear erros de pré-visualização por exame
  const [previewErrors, setPreviewErrors] = useState<{ [key: string]: string | null }>({});


  // useEffect para buscar a Data URL da prévia quando hoveredExamId muda
  useEffect(() => {
      let timeoutId: NodeJS.Timeout | null = null;

      const fetchPreview = async (id: string) => {
         // Só busca se o arquivo existir e a prévia ainda não foi carregada e não houve erro anterior
         const exameHovered = exames.find(e => e.id === id);
         if (exameHovered?.nomeArquivo && !filePreviews[id] && previewErrors[id] === undefined) { // Verifique se não houve erro anterior
             setPreviewErrors(prev => ({ ...prev, [id]: null })); // Limpa erro anterior para este ID
             try {
                 const res = await fetch(`/api/exames/arquivo?id=${id}`);
                 if (res.ok) {
                     const dataUrl = await res.text();
                     // Adiciona uma verificação básica se a resposta parece ser uma Data URL
                     if (dataUrl.startsWith('data:')) {
                         setFilePreviews(prev => ({ ...prev, [id]: dataUrl }));
                     } else {
                         console.error("Resposta da API não é uma Data URL válida:", dataUrl);
                         setPreviewErrors(prev => ({ ...prev, [id]: "Formato de arquivo inválido." }));
                     }
                 } else {
                     console.error("Erro ao buscar prévia do arquivo:", res.statusText);
                     setPreviewErrors(prev => ({ ...prev, [id]: `Erro ao buscar arquivo: ${res.statusText}` }));
                 }
             } catch (error: unknown) { // Use any ou unknown e verifique o tipo
                 console.error("Erro no fetch da prévia:", error);
                  if (error instanceof Error) {
                     setPreviewErrors(prev => ({ ...prev, [id]: `Erro inesperado: ${error.message}` }));
                 } else {
                     setPreviewErrors(prev => ({ ...prev, [id]: "Ocorreu um erro desconhecido." }));
                 }
             }
         }
      };

      if (hoveredExamId) {
          // Adicione um pequeno atraso para evitar buscas excessivas ao mover o mouse rapidamente
          // Ajuste o tempo (300ms) conforme a necessidade
          timeoutId = setTimeout(() => {
              fetchPreview(hoveredExamId);
          }, 300);
      }

      // Função de limpeza para cancelar o timeout se o mouse sair antes do fetch
      return () => {
          if (timeoutId) {
              clearTimeout(timeoutId);
          }
      };

    }, [hoveredExamId, exames, filePreviews, previewErrors]); // Adicionado previewErrors às dependências


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
        const isHovered = hoveredExamId === exame.id; // Adicionado para facilitar a leitura


        return (
          <Card
            key={exame.id}
            // O onMouseEnter continua aqui para INICIAR a pré-visualização
            onMouseEnter={() => setHoveredExamId(exame.id)}
            // O onMouseLeave foi removido daqui para evitar que o preview feche ao entrar no modal
            onClick={() => router.push(`/exames/${exame.id}`)}
            className={clsx(
              "relative cursor-pointer border bg-background transition-shadow duration-200 hover:shadow-lg", 
            )}
          >
            {/* Conteúdo do Card replicando a estrutura do ExameItem */}
            <CardContent className="flex p-0 overflow-hidden h-full"> {/* h-full para ocupar a altura do Card */}
              {/* Informações do exame (lado esquerdo) */}
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

            {/* Área de pré-visualização do anexo */}
             {isHovered && exame.nomeArquivo && (
                 <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    // CORREÇÃO: Adicionado onMouseLeave ao container do modal
                    onMouseLeave={() => setHoveredExamId(null)}
                 > 
                     <div className="relative bg-white rounded-lg shadow-xl p-4 w-11/12 max-w-3xl h-5/6 flex flex-col overflow-hidden"> 
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold">Pré-visualização do Arquivo</h3>
                         </div>
                         <div className="flex-1 flex items-center justify-center overflow-hidden"> 
             {filePreviews[exame.id] ? (
                 exame.nomeArquivo.toLowerCase().endsWith('.pdf') ? (
                     <iframe src={filePreviews[exame.id]} className="w-full h-full border-0" title="Prévia do Exame"></iframe>
                 ) : (
                     <div className="relative w-full h-full"> 
                         <Image
                             src={filePreviews[exame.id]}
                             alt="Prévia do Exame"
                             fill 
                             className="object-contain" 
                             unoptimized 
                         />
                     </div>
                 )

             ) : previewErrors[exame.id] ? (
                 <div className="text-red-500 text-center">{previewErrors[exame.id]}</div>
             ) : (
                 <div className="text-muted-foreground text-sm">Carregando prévia...</div>
             )}
          </div>

                     </div>
                 </div>
             )}

          </Card>
        );
      })}
    </div>
  );
}
