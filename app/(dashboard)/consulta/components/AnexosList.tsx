'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { FileText, Trash2, Download } from "lucide-react";
import { Anexo } from "@/app/_components/types";


interface AnexosListProps {
  anexos: Anexo[];
  onDeleteAnexo: (anexoId: string) => void;
  onAnexoClick: (anexo: Anexo) => void;
}

const AnexosList = ({ anexos, onDeleteAnexo, onAnexoClick }: AnexosListProps) => {

  const handleDownload = (anexo: Anexo) => {
    if (!anexo.arquivo) return;

    // anexo.arquivo já é o array de bytes. Não precisa acessar .data
    const blob = new Blob([anexo.arquivo], { type: anexo.mimetype || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', anexo.nomeArquivo);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!anexos || anexos.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Anexos</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Nenhum anexo encontrado.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Anexos</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {anexos.map((anexo) => (
            <li key={anexo.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
              <button 
                onClick={() => onAnexoClick(anexo)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{anexo.nomeArquivo}</span>
              </button>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="icon" onClick={() => handleDownload(anexo)} aria-label="Baixar anexo">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteAnexo(anexo.id)} aria-label="Apagar anexo">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default AnexosList;
