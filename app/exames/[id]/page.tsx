"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Exame } from "@/app/_components/types";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { Button } from "@/app/_components/ui/button";

// Interface para o resultado do exame (pode ser a mesma usada na API ou uma adaptada para o frontend)
interface ExameResultadoFrontend {
    id: string; // Assumindo que o resultado tem um ID
    nome: string;
    valor: string;
    unidade: string;
    referencia: string; // Usar a chave correta
    exameId: string; // Adicionar o ID do exame
    createdAt: Date; // Adicionar timestamps se presentes
    updatedAt: Date;
}

// Estender a interface Exame para incluir o array de resultados com a nova interface
interface ExameComResultados extends Exame {
    resultados?: ExameResultadoFrontend[];
}


export default function ExameDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const [exame, setExame] = useState<ExameComResultados | null>(null); // Usar a interface estendida
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch exam details
    fetch(`/api/exames/${id}`)
      .then((res) => res.json())
      .then((data) => setExame(data?.exame))
      .catch((err) => console.error("Erro ao buscar exame:", err))
      .finally(() => setLoading(false));

    // Fetch the Data URL for the file
    fetch(`/api/exames/arquivo?id=${id}`)
      .then((res) => res.text()) // Get the response as text (the Data URL string)
      .then((dataUrl) => {
        // Find the iframe element and set its src
        const iframe = document.querySelector('iframe[title="Arquivo do Exame"]');
        if (iframe) {
          iframe.setAttribute('src', dataUrl);
        }
      })
      .catch((err) => console.error("Erro ao buscar arquivo do exame:", err));

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
            {/* Alterado: Verificar se resultados é um array e iterar diretamente */}
            {exame.resultados && Array.isArray(exame.resultados) && exame.resultados.length > 0 ? (
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
                  {/* Alterado: Iterar diretamente sobre o array de resultados */}
                  {exame.resultados.map( // Iterando sobre o array
                    (item: ExameResultadoFrontend) => { // Desestruturando o item diretamente
                      // Lógica para verificar se o valor está fora do intervalo de referência
                      const valor = parseFloat(item.valor);
                      const referencia = item.referencia || ""; // Usar item.referencia (minúsculo)
                      const [minRef, maxRef] = referencia
                        .split("-")
                        .map((v: string) => parseFloat(v.trim()));
                      const foraDoIntervalo =
                        !isNaN(minRef) &&
                        !isNaN(maxRef) &&
                        (valor < minRef || valor > maxRef);

                      return (
                        <tr key={item.id}> {/* Usar o ID do resultado como key */}
                          <td className="border p-2">{item.nome}</td>
                          <td
                            className={`border p-2 font-medium ${
                              foraDoIntervalo ? "text-red-500" : ""
                            }`}
                          >
                            {item.valor}
                          </td>
                          <td className="border p-2">
                             {/* Verificar se item.unidade ou item.outraUnidade existe, dependendo da sua estrutura final */}
                             {item.unidade} {/* Assumindo que a unidade já vem formatada */}
                          </td>
                          <td className="border p-2">{item.referencia}</td> {/* Usar item.referencia (minúsculo) */}
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
                src={`/api/exames/arquivo?id=${exame.id}`} // Caminho da API ajustado
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
