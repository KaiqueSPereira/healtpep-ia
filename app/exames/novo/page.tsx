"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import { toast } from "@/app/_hooks/use-toast";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import { Profissional, Unidade, Consulta } from "@/app/_components/types";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const UploadExame = () => {
  const [tipoExame, setTipoExame] = useState("");
  const [dataExame, setDataExame] = useState("");
  const [resultados, setResultados] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conteudoExtraido, setConteudoExtraido] = useState(""); // <-- AQUI dentro do componente

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(
    null,
  );
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setError(null);

    if (file) {
      const tipo = file.type;

      if (tipo === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async () => {
          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let textoExtraido = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items
              .map((item: any) => item.str)
              .join(" ");
            textoExtraido += strings + "\n";
          }

          setConteudoExtraido(textoExtraido);
        };
        reader.readAsArrayBuffer(file);
      }

      if (tipo.startsWith("image/")) {
        const result = await Tesseract.recognize(file, "por", {
          logger: (m) => console.log(m),
        });
        setConteudoExtraido(result.data.text);
      }
    }
  };

  const discardFile = () => {
    setSelectedFile(null);
    setConteudoExtraido("");
  };

  useEffect(() => {
    const fetchConsultas = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/consultas?userId=${userId}`);
        if (!response.ok) throw new Error("Erro ao buscar consultas");
        const data = await response.json();
        setConsultas(data.consultas || []);
      } catch (err) {
        toast("Erro ao buscar consultas", "error");
      }
    };
    fetchConsultas();
  }, [userId]);

  useEffect(() => {
    const fetchProfissionais = async () => {
      if (!selectedUnidade?.id) {
        setProfissionais([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/unidadesaude?id=${selectedUnidade.id}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar profissionais");
        const data = await response.json();
        setProfissionais(data.profissionais || []);
      } catch (err) {
        toast("Erro ao buscar profissionais", "error");
      }
    };
    if (!selectedConsulta) {
      fetchProfissionais();
    }
  }, [selectedUnidade, selectedConsulta]);

  useEffect(() => {
    if (selectedConsulta) {
      setSelectedProfissional(selectedConsulta.profissional);
      setSelectedUnidade(selectedConsulta.unidade);
    } else {
      setSelectedProfissional(null);
      setSelectedUnidade(null);
    }
  }, [selectedConsulta]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !selectedFile ||
      !userId ||
      !selectedProfissional?.id ||
      !selectedUnidade?.id ||
      !tipoExame
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("tipo", tipoExame);
      formData.append("dataExame", new Date(dataExame).toISOString());
      formData.append("resultados", resultados);
      formData.append("arquivoExame", selectedFile);
      formData.append("userId", userId);
      formData.append("profissionalId", selectedProfissional.id);
      formData.append("unidadesId", selectedUnidade.id);

      const response = await fetch("/api/exames", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast("Exame enviado com sucesso!", "success");
        router.push("/exames");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao enviar exame.");
      }
    } catch (err) {
      setError("Erro no envio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="container mx-auto grid grid-cols-1 gap-8 py-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="mb-4 text-3xl font-bold">Adicionar Exame</h1>

          <div>
            <Label htmlFor="dataExame">Data do Exame</Label>
            <Input
              id="dataExame"
              type="date"
              value={dataExame}
              onChange={(e) => setDataExame(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tipoExame">Tipo de Exame</Label>
            <Input
              id="tipoExame"
              type="text"
              value={tipoExame}
              onChange={(e) => setTipoExame(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="resultados">Resultados</Label>
            <Textarea
              id="resultados"
              value={resultados}
              onChange={(e) => setResultados(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="file-upload">Arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <Label htmlFor="consulta">Consulta</Label>
            <select
              id="consulta"
              className="w-full rounded border bg-black px-3 py-2 text-white"
              value={selectedConsulta?.id || ""}
              onChange={(e) => {
                const consultaSelecionada = consultas.find(
                  (c) => c.id === e.target.value,
                );
                setSelectedConsulta(consultaSelecionada || null);
              }}
            >
              <option value="">Selecione uma consulta (opcional)</option>
              {consultas.map((consulta) => (
                <option key={consulta.id} value={consulta.id}>
                  {`${new Date(consulta.data).toLocaleDateString()} - ${consulta.profissional.nome} (${consulta.unidade.nome})`}
                </option>
              ))}
            </select>
          </div>

          {!selectedConsulta && (
            <>
              <div>
                <Label>Unidade de Saúde</Label>
                <MenuUnidades
                  selected={selectedUnidade}
                  onSelect={setSelectedUnidade}
                />
              </div>

              <div>
                <Label>Profissional</Label>
                <MenuProfissionais
                  profissionais={profissionais}
                  selected={selectedProfissional}
                  onSelect={setSelectedProfissional}
                />
              </div>
            </>
          )}

          {selectedConsulta && (
            <div className="text-sm text-gray-500">
              <p>Profissional: {selectedProfissional?.nome}</p>
              <p>Unidade: {selectedUnidade?.nome}</p>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Adicionar Exame"}
          </Button>

          {error && <p className="text-red-500">{error}</p>}
        </form>

        {/* Preview lateral */}
        <div className="space-y-4">
          {selectedFile && (
            <>
              <h2 className="text-xl font-bold">Preview do Arquivo</h2>
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="max-h-64 w-full rounded border object-contain"
                />
              ) : selectedFile.type === "application/pdf" ? (
                <iframe
                  src={URL.createObjectURL(selectedFile)}
                  className="h-64 w-full rounded border"
                  title="PDF Preview"
                />
              ) : (
                <p>Arquivo selecionado: {selectedFile.name}</p>
              )}
              <Button variant="destructive" onClick={discardFile}>
                Remover Arquivo
              </Button>
            </>
          )}

          <div className="pt-4">
            <h2 className="text-xl font-bold">Resumo</h2>
            <table className="w-full border text-sm">
              <tbody>
                <tr className="border">
                  <td className="p-2 font-semibold">Conteúdo Extraído</td>
                  <td className="max-h-48 overflow-auto whitespace-pre-wrap p-2">
                    {conteudoExtraido || "Nenhum conteúdo extraído"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadExame;
