import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ChevronLeftIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import DescriptionEditor from "../components/descriptioneditor";
import { db } from "@/app/_lib/prisma";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import Sidebarbotton from "@/app/_components/sidebar";

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
        <h1>Consulta n?o encontrada</h1>
        <Link href="/">
          <Button variant="secondary">Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header>
        <Button
          size="icon"
          variant="secondary"
          className="absolute left-5 top-5"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="absolute right-4 top-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <Sidebarbotton />
        </Sheet>
      </header>

      <main className="pl-5 pt-20">
        <div className="flex items-center gap-5 p-3">
          <h1 className="text-2xl font-bold">{consultas.tipo}</h1>
          <p>{consultas.data.toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-3 p-3">
          <h2 className="text-xl font-bold">{consultas.profissional?.nome}</h2>
          <p>-</p>
          <p>{consultas.profissional?.NumClasse || ""}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Anotações sobre a consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{consultas.queixas || "Nenhuma queixa registrada"}</p>
            <DescriptionEditor
              descricao={consultas.queixas || ""}
              consultaId={params.id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ConsultaPage;
