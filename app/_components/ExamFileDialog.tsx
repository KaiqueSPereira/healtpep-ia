// app/_components/ExamFileDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

interface ExamFileDialogProps {
  examId: string;
  hasFile: boolean | undefined; // Use boolean | undefined para refletir o tipo de exame.nomeArquivo
}

export default function ExamFileDialog({ examId, hasFile }: ExamFileDialogProps) {
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null); // Para erros específicos do arquivo

  useEffect(() => {
    const fetchExameFile = async () => {
      // Busca o arquivo apenas se o dialog estiver aberto E se existir um arquivo associado
      if (isFileDialogOpen && hasFile) {
        setFileError(null); // Limpa erros anteriores
        try {
          const resArquivo = await fetch(`/api/exames/arquivo?id=${examId}`);
          if (!resArquivo.ok) {
            if (resArquivo.status === 404) {
              console.warn("Arquivo de exame não encontrado para o ID:", examId);
              setFileError("Arquivo de exame não encontrado.");
            } else {
              throw new Error(`Erro ao buscar arquivo do exame: ${resArquivo.statusText}`);
            }
          } else {
            const dataUrl = await resArquivo.text();
            // Encontra o iframe dentro do Dialog e define o src
            const iframe = document.querySelector('iframe[title="Arquivo do Exame"]');
            if (iframe) {
              iframe.setAttribute('src', dataUrl);
            }
          }
        } catch (err: any) { // Use 'any' ou um tipo mais específico se souber o tipo do erro
          console.error("Erro durante o fetch do arquivo:", err);
          setFileError(`Erro ao carregar o arquivo: ${err.message}`);
        }
      }
    };

    fetchExameFile();

  }, [isFileDialogOpen, examId, hasFile]); // Adicione isFileDialogOpen, examId e hasFile às dependências

  // Não renderiza nada se não houver arquivo para este exame
  if (!hasFile) {
    return null;
  }

  return (
    <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Visualizar Arquivo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Arquivo Anexo</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col"> {/* Use flex-col para organizar conteúdo e erro */}
          {fileError ? (
            <div className="text-red-500 text-center mt-4">{fileError}</div>
          ) : (
             // Renderiza o iframe apenas se não houver erro
            <iframe
              src="" // Inicia com src vazio, será preenchido pelo useEffect
              className="h-full w-full rounded-md border"
              title="Arquivo do Exame"
              // Manipulador de erro no iframe (opcional, o fetch já trata erros)
              onError={(e) => console.error("Erro ao carregar iframe:", e)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}