import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";

interface Agendamento {
  id: string;
  tipo: string;
  data: string;
  profissional?: { nome: string };
  unidade?: { nome: string };
}

interface AgendamentoItemProps {
  consultas: Agendamento;
}

const AgendamentoItem = ({ consultas }: AgendamentoItemProps) => {
  if (!consultas) {
    return (
      <p className="text-gray-300">Dados do agendamento não encontrados.</p>
    );
  }

  const {
    tipo = "Tipo não especificado",
    profissional,
    unidade,
    data,
  } = consultas;

  // Formata a data e hora
  const dataObj = data ? new Date(data) : null;

  const mes = dataObj
    ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(dataObj)
    : "Mês não especificado";

  const dia = dataObj ? dataObj.getDate().toString() : "Dia não especificado";

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
          {/* Informações do agendamento */}
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
          {/* Data e hora do agendamento */}
          <div className="flex flex-col items-center justify-between border-l-2 border-red-500 px-5 py-5">
            <p className="text-sm capitalize text-gray-400">{mes}</p>
            <p className="text-2xl font-bold text-gray-300">{dia}</p>
            <p className="text-sm text-gray-400">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoItem;
