import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Paperclip, FileText } from "lucide-react";
import Link from "next/link";
import { AnexoConsulta } from "@prisma/client";

interface Anotacao {
  id: string;
  anotacao: string;
}

interface ConsultaOrigem {
  id: string;
  tipo: string;
  data: string;
  motivo?: string | null;
  Anotacoes?: Anotacao[];
  anexos?: AnexoConsulta[];
}

interface ConsultaOrigemCardProps {
  consultaOrigem: ConsultaOrigem;
}

const ConsultaOrigemCard = ({ consultaOrigem }: ConsultaOrigemCardProps) => {
  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Consulta de Origem</CardTitle>
            <CardDescription>
              {consultaOrigem.tipo} - {new Date(consultaOrigem.data).toLocaleDateString("pt-BR")}
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href={`/consulta/${consultaOrigem.id}`}>Ver Detalhes</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {consultaOrigem.motivo && (
          <div>
            <h4 className="font-semibold mb-1">Motivo da Consulta</h4>
            <p className="text-sm text-muted-foreground">{consultaOrigem.motivo}</p>
          </div>
        )}
        {consultaOrigem.Anotacoes && consultaOrigem.Anotacoes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Anotações da Consulta Original</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {consultaOrigem.Anotacoes.map((anotacao) => (
                <li key={anotacao.id} className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-primary" />
                  <span>{anotacao.anotacao}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {consultaOrigem.anexos && consultaOrigem.anexos.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Anexos da Consulta Original</h4>
            <div className="flex flex-wrap gap-2">
              {consultaOrigem.anexos.map((anexo) => (
                <Button key={anexo.id} variant="outline" size="sm" asChild>
                  <a
                    href={`/api/consultas/anexos/${anexo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    {anexo.nomeArquivo}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsultaOrigemCard;