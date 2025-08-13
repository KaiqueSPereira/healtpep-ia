import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import Link from "next/link";

interface Agendamento {
  id: string;
  tipo: string;
  data: Date;
  profissional?: { nome: string };
  unidade?: { nome: string };
  tratamento?: { nome: string }; // Campo opcional para o tratamento
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
    tratamento,
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
  const tratamentoNome = tratamento?.nome;


  return (
    <div className="w-full md:w-auto">
      <Card className="min-w-[280px] max-w-[320px] h-48"> {/* Increased height slightly if needed */}
        {/* Adicionado overflow-hidden ao CardContent */}
        <CardContent className="flex p-0 overflow-hidden h-full"> {/* Added h-full to CardContent */}
          {/* Informações do agendamento */}
          <div className="flex flex-col gap-2 py-5 pl-5 pr-4 flex-grow"> {/* Added flex-grow and adjusted padding */}
            <h3 className="text-lg font-bold ">{tipo}</h3>
            <p className="text-sm font-semibold ">
              {profissionalNome}
            </p>
            <p className="truncate text-sm ">{unidadeNome}</p>
            {tratamentoNome && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Tratamento: {tratamentoNome}</p>
            )}
            <Button variant="secondary" className="mt-2 w-20" asChild>
              <Link href={`/consulta/${consultas.id}`}>Detalhes</Link>
            </Button>
          </div>
          {/* Data e hora do agendamento com borda */}
          {/* Separador com a borda. Posicionado para ocupar 0 espaço flex, apenas a borda. */}
 <div className="border-l-2 border-red-500 h-full flex-shrink-0"></div> {/* Added flex-shrink-0 */}
          {/* Data e hora do agendamento. Usando w-24 para largura fixa. */}
          <div className="flex flex-col items-center justify-between px-5 py-5 flex-shrink-0 w-24">
            <p className="text-sm capitalize ">{mes}</p>
            <p className="text-2xl font-bold ">{dia}</p>
            <p className="text-sm ">{horaFormatada}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoItem;
