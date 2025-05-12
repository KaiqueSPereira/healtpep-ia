"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import clsx from "clsx";

type Resultado = {
  nome: string;
  valor: string;
  unidade?: string;
  referencia?: string;
};

type Exame = {
  id: string;
  nome: string;
  dataExame: string;
  nomeArquivo?: string;
  profissional?: { nome: string };
  unidades?: { nome: string };
  tratamento?: { nome: string };
  resultados?: Resultado[];
};

type Props = {
  exames: Exame[];
};

export function ExameGrid({ exames }: Props) {
  const router = useRouter();

  if (exames.length === 0) {
    return <p className="text-muted-foreground">Nenhum exame encontrado.</p>;
  }

  const handleEdit = (id: string) => {
    router.push(`/exames/editar/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente apagar este exame?")) {
      const res = await fetch(`/api/exames?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Erro ao apagar exame.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exames.map((exame) => (
        <Card
          key={exame.id}
          onClick={() => router.push(`/exames/${exame.id}`)}
          className={clsx(
            "relative cursor-pointer border bg-background pb-16 transition-shadow duration-200 hover:shadow-lg",
          )}
        >
          <CardContent className="pt-4">
            <div className="mb-1 text-sm text-muted-foreground">
              {new Date(exame.dataExame).toLocaleDateString("pt-BR")}
            </div>

            <div className="text-lg font-bold text-primary">
              {exame.profissional?.nome || "Profissional não informado"}
            </div>

            {exame.tratamento?.nome && (
              <div className="text-sm text-muted-foreground">
                {exame.tratamento.nome}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {exame.unidades?.nome || "Unidade não informada"}
            </div>
          </CardContent>

          <div
            className="absolute bottom-2 left-2 right-2 flex justify-between gap-2 px-2"
            onClick={(e) => e.stopPropagation()} // Impede propagação para o card
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(exame.id)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(exame.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Apagar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
