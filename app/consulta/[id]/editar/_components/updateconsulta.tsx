"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/app/_hooks/use-toast";
import { Button } from "@/app/_components/ui/button";
import DescriptionEditor from "@/app/consulta/components/descriptioneditor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ChevronLeftIcon } from "lucide-react";
import Header from "@/app/_components/header";

interface Consulta {
  id: string;
  tipo: string;
  data: string;
  unidade: {
    id: string;
    nome: string;
    tipo: string;
  };
  profissional: {
    id: string;
    nome: string;
    especialidade: string;
    NumClasse: string;
  };
  queixas: string;
}

interface ConsultaPageProps {
  params: {
    id: string;
  };
}

const UpdateConsulta = ({ params }: ConsultaPageProps) => {
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const response = await fetch(`/api/consultas/${params.id}`);
        const data = await response.json();
        setConsulta(data);
      } catch (error) {
        console.error("Erro ao buscar consulta:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsulta();
  }, [params.id]);

  const handleUpdateConsulta = async () => {
    try {
      const response = await fetch(`/api/consultas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* Dados atualizados */
        }),
      });

      if (response.ok) {
        toast("Consulta atualizada com sucesso!", "success", { duration: 5000 });
      } else {
        toast("Erro ao atualizar consulta.", "error", { duration: 5000 });
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  if (loading) return <h1>Carregando...</h1>;
  if (!consulta) return <h1>Consulta não encontrada</h1>;

  return (
    <div>
      {/* Header */}
      <Header />
      <header className="flex items-center justify-between p-5">
        <Link href={`/consulta/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <Button onClick={handleUpdateConsulta}>Salvar alterações</Button>
      </header>

      {/* Informações da Consulta */}
      <main className="p-5">
        <div className="flex items-center gap-5 p-3">
          <h1 className="text-xl font-bold">
            <select
              defaultValue={consulta.tipo}
              className="rounded border border-none bg-black px-3 py-2 text-white"
              disabled={!editando}
            >
              <option value="Consulta">Consulta</option>
              <option value="Exame">Exame</option>
            </select>
          </h1>

          {/* Data */}
          <input
            type="date"
            defaultValue={
              consulta.data
                ? new Date(consulta.data).toISOString().split("T")[0]
                : ""
            }
            className="rounded border border-none bg-black px-3 py-2 text-white"
            disabled={!editando}
          />

          <p>às</p>

          {/* Hora */}
          <input
            type="time"
            defaultValue={new Date(consulta.data).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            className="rounded border border-none bg-black px-3 py-2 text-white"
            disabled={!editando}
          />
        </div>

        {/* Unidade de Saúde */}
        <div className="flex items-center gap-3 p-3">
          <h2 className="text-xl font-bold">
            <select
              defaultValue={consulta.unidade?.id || ""}
              className="rounded border border-none bg-black px-3 py-2 text-white"
              disabled={!editando}
            >
              {consulta.unidade ? (
                <option value={consulta.unidade.id}>
                  {consulta.unidade.nome}
                </option>
              ) : (
                <option value="">Selecione uma unidade</option>
              )}
            </select>
          </h2>

          <p>-</p>
          <p>{consulta.unidade?.tipo || "Tipo não informado"}</p>
        </div>

        {/* Profissional */}
        <div className="flex items-center gap-3 p-3">
          <h2 className="text-xl font-bold">
            <select
              defaultValue={consulta.profissional?.id || ""}
              className="rounded border border-none bg-black px-3 py-2 text-white"
              disabled={!editando}
            >
              {consulta.profissional ? (
                <option value={consulta.profissional.id}>
                  {consulta.profissional.nome}
                </option>
              ) : (
                <option value="">Selecione um profissional</option>
              )}
            </select>
          </h2>

          <p>-</p>
          <h3 className="font-bold">
            {consulta.profissional?.especialidade ||
              "Especialidade não informada"}
          </h3>
        </div>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>Registros sobre a consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{consulta.queixas || "Nenhuma queixa registrada"}</p>
            <DescriptionEditor
              descricao={consulta.queixas}
              consultaId={consulta.id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UpdateConsulta;
