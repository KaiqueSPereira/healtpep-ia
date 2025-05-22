"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Exame } from "@/app/_components/types";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { Button } from "@/app/_components/ui/button";

export default function ExameDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const [exame, setExame] = useState<Exame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/exames/${id}`)
      .then((res) => res.json())
      .then((data) => setExame(data?.exame))
      .catch((err) => console.error("Erro ao buscar exame:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="p-4 text-muted-foreground">Carregando exame...</p>;
  }

  if (!exame) {
    return <p className="p-4 text-muted-foreground">Exame não encontrado.</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 md:px-10 lg:px-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Exame de {new Date(exame.dataExame).toLocaleDateString("pt-BR")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {exame.unidades?.nome && `Unidade: ${exame.unidades.nome}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {exame.profissional?.nome &&
                `Profissional: ${exame.profissional.nome}`}
            </p>
            {exame.anotacao && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                Anotação: {exame.anotacao}
              </p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Resultados</h2>
            {exame.resultados && typeof exame.resultados === "object" ? (
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">Nome</th>
                    <th className="border p-2">Valor</th>
                    <th className="border p-2">Unidade</th>
                    <th className="border p-2">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(exame.resultados).map(
                    (
                      [key, item]: [
                        string,
                        {
                          nome: string;
                          valor: string;
                          unidade: string;
                          outraUnidade?: string;
                          ValorReferencia?: string;
                        }
                      ]
                    ) => {
                      const valor = parseFloat(item.valor);
                      const referencia = item.ValorReferencia || "";
                      const [minRef, maxRef] = referencia
                        .split("-")
                        .map((v: string) => parseFloat(v.trim()));
                      const foraDoIntervalo =
                        !isNaN(minRef) &&
                        !isNaN(maxRef) &&
                        (valor < minRef || valor > maxRef);

                      return (
                        <tr key={key}>
                          <td className="border p-2">{item.nome}</td>
                          <td
                            className={`border p-2 font-medium ${
                              foraDoIntervalo ? "text-red-500" : ""
                            }`}
                          >
                            {item.valor}
                          </td>
                          <td className="border p-2">
                            {item.unidade === "Outro"
                              ? item.outraUnidade
                              : item.unidade}
                          </td>
                          <td className="border p-2">{item.ValorReferencia}</td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            ) : (
              <p className="text-sm">Sem dados de resultados.</p>
            )}
          </div>

          {exame.nomeArquivo && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Arquivo Anexo</h2>
              <iframe
                src={`/api/exames/arquivo?id=${exame.id}`}
                className="h-[600px] w-full rounded-md border"
                title="Arquivo do Exame"
              />
            </div>
          )}

          {exame.consulta && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <h2 className="mb-2 text-lg font-semibold">
                Consulta Relacionada
              </h2>
              <p>
                <strong>Tipo:</strong> {exame.consulta.tipo}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(exame.consulta.data).toLocaleDateString("pt-BR")} -{" "}
                {new Date(exame.consulta.data).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {exame.consulta.queixas && (
                <p>
                  <strong>Queixas:</strong> {exame.consulta.queixas}
                </p>
              )}
            </div>
          )}

          <div>
            <Button variant="destructive" onClick={() => history.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
