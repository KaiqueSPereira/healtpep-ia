import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { AgendamentoUnificado } from "./agendamentolist";
import { Badge } from "@/app/_components/ui/badge";

interface AgendamentoItemProps {
  agendamento: AgendamentoUnificado;
}

const AgendamentoItem = ({ agendamento }: AgendamentoItemProps) => {
  if (!agendamento) {
    return null;
  }

  const {
    id,
    tipo,
    data,
    nomeProfissional,
    especialidade,
    local,
  } = agendamento;

  const dataObj = new Date(data);
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dataObj).replace(".", "");
  const dia = dataObj.getDate().toString();
  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const linkHref = `/${tipo.toLowerCase()}s/${id}`;

  return (
    <div className="w-full md:w-auto">
      <Card className="min-w-[280px] max-w-[320px] h-48">
        <CardContent className="flex p-0 overflow-hidden h-full">
          {/* CORREÇÃO: Adicionado `min-w-0` para permitir que o `truncate` funcione corretamente em um container flex */}
          <div className="flex flex-col gap-1 py-4 px-5 flex-grow min-w-0">
            <Badge 
              variant={tipo === 'Consulta' ? 'default' : 'secondary'} 
              className="w-fit mb-2"
            >
              {tipo}
            </Badge>
            <h3 className="text-md font-bold truncate">{especialidade}</h3>
            {/* CORREÇÃO: Adicionada a classe `truncate` para evitar quebra de linha */}
            <p className="text-sm font-semibold truncate">{nomeProfissional}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{local}</p>
            <div className="flex-grow" /> {/* Spacer */}
            <Button variant="secondary" className="mt-2 w-28" asChild>
              <Link href={linkHref}>Ver Detalhes</Link>
            </Button>
          </div>
          
          <div className="border-l-2 border-primary h-full flex-shrink-0"></div>

          <div className="flex flex-col items-center justify-center px-4 py-5 flex-shrink-0 w-24">
            <p className="text-sm font-bold uppercase text-primary">{mes}</p>
            <p className="text-3xl font-bold">{dia}</p>
            <p className="text-sm">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoItem;
