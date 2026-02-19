import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Profissional, Unidade } from "@/app/_components/types";

interface DetalhesConsultaCardProps {
  tipo: string;
  data: string;
  unidade: Unidade | null;
  profissional: Profissional | null;
  motivo: string | null;
}

const DetalhesConsultaCard = ({ tipo, data, unidade, profissional, motivo }: DetalhesConsultaCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{tipo}</CardTitle>
        <CardDescription>
          {new Date(data).toLocaleString("pt-BR", { dateStyle: 'full', timeStyle: 'short' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p><b>Unidade:</b> {unidade?.nome || "Não informado"}</p>
        <p><b>Profissional:</b> {profissional?.nome || "Não informado"}</p>
        {motivo && <p><b>Motivo:</b> {motivo}</p>}
      </CardContent>
    </Card>
  );
};

export default DetalhesConsultaCard;