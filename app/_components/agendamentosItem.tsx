import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface AgendamentoItemProps {
  consultas: {
    id: string;
    tipo: string;
    data: string;
    profissional?: { nome: string };
    unidade?: { nome: string };
  };
}

const AgendamentoItem = ({ consultas }: AgendamentoItemProps) => {
  if (!consultas) {
    return (
      <p className="text-gray-300">Dados do agendamento nĂŁo disponĂ­Â­veis.</p>
    );
  }

  const {
    tipo = "Tipo nĂŁo especificado",
    profissional,
    unidade,
    data,
  } = consultas;

  // Formata a data e hora
  const dataObj = data ? new Date(data) : null;

  const mes = dataObj
    ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj)
    : "Mês não especificado";

  const dia = dataObj ? dataObj.getDate().toString() : "Dia nâo especificado";

  const horaFormatada = dataObj
    ? dataObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Hora não especificada";

  // Lida com dados opcionais
  const profissionalNome =
    profissional?.nome || "Profissional não especificado";
  const unidadeNome = unidade?.nome || "Unidade não especificada";

  return (
    <div className="w-full md:w-auto">
      <Card className="min-w-[280px] max-w-[320px] text-gray-300">
        <CardContent className="flex justify-between p-0">
          {/* InformaÄ‚Â§Ä‚Âµes do agendamento */}
          <div className="flex flex-col gap-2 py-5 pl-5">
            <h3 className="text-lg font-bold text-red-500">{tipo}</h3>
            <p className="truncate text-sm font-semibold text-gray-300">
              {profissionalNome}
            </p>
            <p className="truncate text-sm text-gray-400">{unidadeNome}</p>
            <Button variant="secondary" className="mt-2 w-20" asChild>
              <Link href={`/consulta/${consultas.id}`}>Detalhes</Link>
            </Button>
          </div>

          {/* InformaÄ‚Â§Ä‚Âµes de data e hora */}
          <div className="flex flex-col items-center justify-between py-5 px-5 border-l-2 border-red-500">
            <p className="text-sm text-gray-400 capitalize">{mes}</p>
            <p className="text-2xl font-bold text-gray-300">{dia}</p>
            <p className="text-sm text-gray-400">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoItem;
