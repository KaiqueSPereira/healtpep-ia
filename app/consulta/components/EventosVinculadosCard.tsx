import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import ExameItem from "@/app/exames/components/ExameItem";
import { Consultatype } from "@prisma/client";
import { Exame, Profissional, Unidade } from "@/app/_components/types";
import { AgendamentoUnificado } from "./agendamentolist";
import AgendamentoItem from "./agendamentosItem";

type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: Unidade | null;
};

interface Retorno {
  id: string;
  userId: string;
  tipo: string;
  data: string;
  profissional?: Profissional | null;
  unidade?: Unidade | null;
}

interface EventosVinculadosCardProps {
  isRetorno: boolean;
  exames: ExameComRelacoes[];
  retornos: Retorno[];
}

const EventosVinculadosCard = ({ isRetorno, exames, retornos }: EventosVinculadosCardProps) => {
  if (exames.length === 0 && (isRetorno || retornos.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRetorno ? "Exames (da Consulta de Origem)" : "Eventos Vinculados"}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exames.map((exame) => <ExameItem key={`exame-${exame.id}`} exame={exame} />)}
        
        {!isRetorno && retornos && retornos.map(retorno => {
          const agendamentoParaRetorno: AgendamentoUnificado = {
            id: retorno.id,
            userId: retorno.userId,
            tipo: 'Consulta',
            tipoConsulta: retorno.tipo as Consultatype,
            data: retorno.data,
            nomeProfissional: retorno.profissional?.nome || "Não informado",
            especialidade: retorno.profissional?.especialidade || "Não informada",
            local: retorno.unidade?.nome || "Não informado",
          };
          return <AgendamentoItem key={`retorno-${retorno.id}`} agendamento={agendamentoParaRetorno} />;
        })}
      </CardContent>
    </Card>
  );
};

export default EventosVinculadosCard;