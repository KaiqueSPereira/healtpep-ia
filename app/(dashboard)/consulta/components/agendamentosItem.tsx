import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";
import { AgendamentoUnificado } from "./agendamentolist";
import { Badge } from "@/app/_components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";

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
  const dataCompleta = dataObj.toLocaleDateString("pt-BR", { dateStyle: 'full' });

  const linkHref = `/${tipo.toLowerCase()}/${id}`;

  const tipoAgendamento = tipo === 'Consulta' && tipoConsulta ? tipoConsulta : tipo;

  const tooltipContent = (
    <div className="p-2 text-sm">
      <p><strong>Tipo:</strong> {tipoAgendamento}</p>
      {especialidade && <p><strong>Especialidade:</strong> {especialidade}</p>}
      <p><strong>Data:</strong> {dataCompleta}</p>
      <p><strong>Hora:</strong> {horaFormatada}</p>
      <p><strong>Profissional:</strong> {nomeProfissional}</p>
      <p><strong>Local:</strong> {local}</p>
    </div>
  );

  return (
    <div className="w-full md:w-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
              <Card className="min-w-[280px] max-w-[320px] h-52">
                <CardContent className="flex p-0 overflow-hidden h-full">
                  <div className="flex flex-col gap-1 py-4 px-5 flex-grow min-w-0">
                    <Badge
                      variant={tipo === 'Consulta' ? 'default' : 'secondary'}
                      className="w-fit mb-2"
                    >
                      {tipoAgendamento}
                    </Badge>
                    <h3 className="text-sm font-bold">{especialidade}</h3>
                    <p className="text-xs font-semibold">{nomeProfissional}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{local}</p>

                    <div className="mt-auto">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={linkHref}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-2 border-primary h-full flex-shrink-0"></div>

                  <div className="flex flex-col items-center justify-center px-4 py-5 flex-shrink-0 w-24">
                    <p className="text-sm font-bold uppercase text-primary">{mes}</p>
                    <p className="text-2xl font-bold">{dia}</p>
                    <p className="text-sm">{horaFormatada}</p>
                  </div>
                </CardContent>
              </Card>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AgendamentoItem;
