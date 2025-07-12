"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Exame } from "@/app/_components/types"; // Importe Exame da sua pasta de types
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";

// Interface para o resultado do exame (mantida, se estiver correta com o que a API retorna)
interface ExameResultadoFrontend {
    id: string; // Assumindo que o resultado tem um ID
    nome: string;
    valor: string;
    unidade: string;
    referencia?: string; // Usar a chave correta e pode ser opcional
    exameId: string; // Adicionar o ID do exame
    createdAt?: Date; // Adicionar timestamps se presentes
    updatedAt?: Date;
}

// Estender a interface Exame para incluir o array de resultados.
// Não precisamos estender para a consulta se a interface Exame em types.ts já inclui a estrutura completa da consulta.
interface ExameComResultados extends Exame {
    resultados?: ExameResultadoFrontend[];
}


export default function ExameDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const [exame, setExame] = useState<ExameComResultados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Para exibir erros

  useEffect(() => {
    if (!id) {
      setError("ID do exame não fornecido.");
      setLoading(false);
      return;
    }

    const fetchExameData = async () => {
      try {
        // Fetch exam details
        const resExame = await fetch(`/api/exames/${id}`);
        if (!resExame.ok) {
          throw new Error(`Erro ao buscar exame: ${resExame.statusText}`);
        }
        const dataExame = await resExame.json();
        setExame(dataExame?.exame);

        // Fetch the Data URL for the file
        const resArquivo = await fetch(`/api/exames/arquivo?id=${id}`);
         // Verificar se a resposta do arquivo é OK antes de tentar ler o texto
        if (!resArquivo.ok) {
             // Se for um erro 404 (não encontrado), não exibe erro, apenas não carrega o iframe
             if(resArquivo.status === 404) {
                 console.warn("Arquivo de exame não encontrado para o ID:", id);
                 // Podemos definir algum estado para indicar que não há arquivo
             } else {
                 throw new Error(`Erro ao buscar arquivo do exame: ${resArquivo.statusText}`);
             }
         } else {
             const dataUrl = await resArquivo.text(); // Get the response as text (the Data URL string)
             // Find the iframe element and set its src
             const iframe = document.querySelector('iframe[title="Arquivo do Exame"]');
             if (iframe) {
               iframe.setAttribute('src', dataUrl);
             }
         }


      } catch (err: unknown) {
        console.error("Erro durante o fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExameData();

  }, [id]);


  if (loading) {
    return <p className="p-4 text-muted-foreground">Carregando exame...</p>;
  }

  if (error) {
      return <p className="p-4 text-red-500">Erro: {error}</p>;
  }

  if (!exame) {
    return <p className="p-4 text-muted-foreground">Exame não encontrado.</p>;
  }

  // Função auxiliar para parsear e formatar a data
  const formatarDataConsulta = (dataString: string | undefined) => {
      if (!dataString) return "Data não disponível";
      try {
          const date = new Date(dataString);
           // Verificar se a data é válida
          if (isNaN(date.getTime())) {
              return "Data inválida";
          }
          return `${date.toLocaleDateString("pt-BR")} - ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
      } catch (e) {
          console.error("Erro ao formatar data:", e);
          return "Data inválida";
      }
  };


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 md:px-10 lg:px-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Exame de {exame.dataExame ? new Date(exame.dataExame).toLocaleDateString("pt-BR") : "Data não disponível"} {/* Adicionado verificação */}
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
                  {exame.resultados.map(
                    (item: ExameResultadoFrontend) => {
                      const valor = parseFloat(item.valor);
                      const referencia = item.referencia || "";
                      const [minRef, maxRef] = referencia
                        .split("-")
                        .map((v: string) => parseFloat(v.trim()));
                      const foraDoIntervalo =
                        !isNaN(minRef) &&
                        !isNaN(maxRef) &&
                        (valor < minRef || valor > maxRef);

                      return (
                        <tr key={item.id}>
                          <td className="border p-2">{item.nome}</td>
                          <td
                            className={`border p-2 font-medium ${
                              foraDoIntervalo ? "text-red-500" : ""
                            }`}
                          >
                            {item.valor}
                          </td>
                          <td className="border p-2">
                             {item.unidade}
                          </td>
                          <td className="border p-2">{item.referencia}</td>
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

          {/* Condição para exibir o iframe apenas se houver nomeArquivo */}
          {exame.nomeArquivo && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Arquivo Anexo</h2>
              {/* O src será definido no useEffect após buscar a Data URL */}
              <iframe
                src="" // Inicia com src vazio
                className="h-[1600px] w-full rounded-md border"
                title="Arquivo do Exame"
                // Adicione um manipulador onError para depuração, se necessário
                 onError={(e) => console.error("Erro ao carregar iframe:", e)}
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
                {formatarDataConsulta(exame.consulta.data)} {/* Usando a função auxiliar */}
              </p>
              {exame.consulta.queixas && (
                <p>
                  <strong>Queixas:</strong> {exame.consulta.queixas}
                </p>
              )}
               {/* Exibir profissional e unidade da consulta se existirem */}
               {exame.consulta.profissional?.nome && (
                   <p>
                       <strong>Profissional da Consulta:</strong> {exame.consulta.profissional.nome}
                   </p>
               )}
               {exame.consulta.unidade?.nome && (
                   <p>
                       <strong>Unidade da Consulta:</strong> {exame.consulta.unidade.nome}
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
    </div>
  );
}
