"use client";

import { useEffect, useState } from "react";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { toast } from "@/app/_hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ExameGrid } from "./components/ExamesGrid";


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
  anotacao?: string;
  nomeArquivo?: string;
  profissional?: { nome: string };
  unidades?: { nome: string };
  resultados?: Resultado[];
};

export default function ExamesPage() {
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exames/exame")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          toast("Erro ao carregar exames", "erro", { duration: 5000 });
          return;
        }
        setExames(data);
      })
      .catch(() => toast("Erro ao carregar exames", "erro", { duration: 5000 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Meus Exames</h1>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ExameGrid exames={exames} />
        )}
      </main>
      <Footer />
    </div>
  );
}
