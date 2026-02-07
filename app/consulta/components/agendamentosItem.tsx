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
    tipoConsulta,
    data,
    nomeProfissional,
    especialidade,
    local,
  } = agendamento;

  const dataObj = new Date(data);
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dataObj).replace(".", "");
  const dia = dataObj.getDate().toString();
  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const linkHref = `/${tipo.toLowerCase()}/${id}`;

  return (
    <div className="w-full md:w-auto">
      {/* CORREÇÃO: Altura do card igualada ao ExameItem (h-52) */}
      <Card className="min-w-[280px] max-w-[320px] h-52">
        <CardContent className="flex p-0 overflow-hidden h-full">
          <div className="flex flex-col gap-1 py-4 px-5 flex-grow min-w-0">
            <Badge 
              variant={tipo === 'Consulta' ? 'default' : 'secondary'} 
              className="w-fit mb-2"
            >
              {tipo === 'Consulta' && tipoConsulta ? tipoConsulta : tipo}
            </Badge>
            {/* CORREÇÃO: Fontes reduzidas e truncamento removido */}
            <h3 className="text-sm font-bold">{especialidade}</h3>
            <p className="text-xs font-semibold">{nomeProfissional}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{local}</p>
            
            {/* CORREÇÃO: Layout do botão alinhado com o ExameItem */}
            <div className="mt-auto">
              <Button variant="secondary" size="sm" asChild>
                <Link href={linkHref}>Ver Detalhes</Link>
              </Button>
            </div>
          </div>
          
          <div className="border-l-2 border-primary h-full flex-shrink-0"></div>

          <div className="flex flex-col items-center justify-center px-4 py-5 flex-shrink-0 w-24">
            <p className="text-sm font-bold uppercase text-primary">{mes}</p>
            {/* CORREÇÃO: Tamanho da fonte do dia reduzido */}
            <p className="text-2xl font-bold">{dia}</p>
            <p className="text-sm">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoItem;
