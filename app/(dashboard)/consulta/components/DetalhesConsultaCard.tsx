import {
    Card,
    CardDescription,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/app/_components/ui/card";
  import { ConsultaData } from "../types";
  
  interface DetalhesConsultaCardProps {
    consulta: ConsultaData;
  }
  
  const DetalhesConsultaCard = ({ consulta }: DetalhesConsultaCardProps) => {
    const { tipo, data, unidade, profissional, motivo } = consulta;
  
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