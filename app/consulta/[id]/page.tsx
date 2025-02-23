import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {ChevronLeftIcon} from "lucide-react";
import Link from "next/link";
import { db } from "@/app/_lib/prisma";
import Header from "@/app/_components/header";
import BotaoEditarConsulta from "../components/buttoneditConsulta";

interface ConsultaPageProps {
  params: {
    id: string;
  };
}

const ConsultaPage = async ({ params }: ConsultaPageProps) => {
  // Verifica a ausencia do ID
  if (!params.id) {
    return <h1>Consulta não encontrada</h1>;
  }

  const consultas = await db.consultas.findUnique({
    where: { id: params.id },
    include: {
      usuario: true,
      profissional: true,
      unidade: true,
    },
  });

  if (!consultas) {
    return (
      <div className="p-8 text-center">
        <h1>Consulta não encontrada</h1>
        <Link href="/">
          <Button variant="secondary">Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <header>
        <div className="flex items-center justify-between p-5">
          <Button
            size="icon"
            variant="secondary"
            className="left-5 top-6"
            asChild
          >
            <Link href="/">
              <ChevronLeftIcon />
            </Link>
          </Button>
          <BotaoEditarConsulta consultaId={params.id} />
        </div>
      </header>

      <main className="pl-5 pt-20">
        <div className="flex items-center gap-5 p-3">
          <h1 className="text-2xl font-bold">{consultas.tipo}</h1>
          <p>{consultas.data.toLocaleDateString("pt-BR")}</p>
          <p>ás</p>
          <p>{consultas.data.toLocaleTimeString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-3 p-3">
          <h2 className="text-xl font-bold">{consultas.unidade?.nome}</h2>
          <p>-</p>
          <p>{consultas.unidade?.tipo || ""}</p>
        </div>
        <div className="flex items-center gap-3 p-3">
          <h2 className="text-xl font-bold">{consultas.profissional?.nome}</h2>
          <p>-</p>
          <h3 className="font-bold">
            {consultas.profissional?.especialidade}{" "}
          </h3>
          <p>-</p>
          <p>{consultas.profissional?.NumClasse || ""}</p>
        </div>

        {consultas.tipo !== "Exame" && (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Registros sobre a consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{consultas.queixas || "Nenhuma queixa registrada"}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ConsultaPage;
