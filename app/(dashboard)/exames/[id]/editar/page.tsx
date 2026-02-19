"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ExameFormWrapper } from "../../components/ExameFormWrapper";
import { useParams } from "next/navigation";
import { toast } from "@/app/_hooks/use-toast";
import { Exame, Profissional, UnidadeDeSaude, ResultadoExame } from "@prisma/client";


type ExameComRelacoes = Exame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: UnidadeDeSaude | null;
};

export default function EditExamePage() {
  const params = useParams();
  const examId = params.id as string;
  // CORREÇÃO: Usa o novo tipo para o estado
  const [existingExamData, setExistingExamData] = useState<ExameComRelacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      setError("ID do exame não fornecido.");
      toast({
        title: "Erro",
        description: "ID do exame não fornecido para edição.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const fetchExame = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/exames/${examId}`);
        const data = await res.json();

        if (res.ok) {
          setExistingExamData(data.exame); // A API retorna { exame: {...} }
        } else {
          setError(data.error || "Erro ao carregar dados do exame.");
          toast({
            title: "Erro",
            description: data.error || "Erro ao carregar dados do exame.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (err) {
        console.error("Erro ao buscar exame:", err);
        setError("Erro ao carregar dados do exame.");
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do exame.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExame();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20 text-red-500">
        {error}
      </div>
    );
  }

  if (!existingExamData) {
      return (
        <div className="flex min-h-screen items-center justify-center pb-20 text-gray-500">
            Nenhum dado de exame encontrado para o ID fornecido.
        </div>
      );
  }

  return (
    <div className="pb-20">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-gray-600" />}>
        {/* O ExameFormWrapper agora recebe dados com o tipo correto */}
        <ExameFormWrapper existingExamData={existingExamData} />
      </Suspense>
    </div>
  );
}
