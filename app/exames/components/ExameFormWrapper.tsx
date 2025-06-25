"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Header from "../../_components/header";
import Footer from "../../_components/footer";
import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import TabelaExames from "./TabelaExames";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../_components/ui/select";
import { Textarea } from "../../_components/ui/textarea";
import { toast } from "../../_hooks/use-toast";

import {
  Consulta,
  Profissional,
  Unidade,
  Tratamento,
  ResultadoExame,
} from "../../_components/types";
import { ConfirmarExameDialog } from "./ConfirmarExameDialog";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";

export function  ExameFormWrapper() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(
    null,
  );
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);

  const [tipoExame, setTipoExame] = useState<string>("");
  const [dataExame, setDataExame] = useState<string>("");
  const [anotacao, setAnotacao] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false); // Novo estado para o loading da análise


  const [exame, setExame] = useState<{
    nome: string;
    dataExame: string;
    anotacao: string;
    resultados: ResultadoExame[];
  }>({
    nome: "",
    dataExame: "",
    anotacao: "",
    resultados: [
      {
        nome: "",
        valor: "",
        unidade: "",
        valorReferencia: "",
        outraUnidade: "",
      },
    ],
  });

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/consultas?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setConsultas(d.consultas || []))
      .catch(() =>
        toast("Erro ao buscar consultas", "erro", { duration: 5000 }),
      );
  }, [userId]);

  useEffect(() => {
    const fetchTratamentos = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(
          `/api/tratamento?userId=${session.user.id}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar tratamentos");

        const data = await response.json();
        setTratamentos(data || []);
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
        toast("Erro ao carregar tratamentos.", "error", { duration: 5000 });
      }
    };

    fetchTratamentos();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!selectedUnidade?.id) {
      setProfissionais([]);
      return;
    }
    fetch(`/api/unidadesaude?id=${selectedUnidade.id}`)
      .then((r) => r.json())
      .then((d) => setProfissionais(d.profissionais || []))
      .catch(() =>
        toast("Erro ao buscar profissionais", "erro", { duration: 5000 }),
      );
  }, [selectedUnidade]);


  const handleAddExame = () => {
    setExame((prev) => ({
      ...prev,
      resultados: [
        ...(prev.resultados || []),
        {
          nome: "",
          valor: "",
          unidade: "",
          valorReferencia: "",
          outraUnidade: "",
        },
      ],
    }));
  };

  const handleRemoveExame = (index: number) => {
    setExame((prev) => ({
      ...prev,
      resultados: (prev.resultados || []).filter((_, i) => i !== index),
    }));
  };

  const handleExameChange = (
    index: number,
    field: keyof ResultadoExame,
    value: string,
  ) => {
    setExame((prev) => {
      const novosResultados = [...(prev.resultados || [])];
      novosResultados[index] = { ...novosResultados[index], [field]: value };
      return { ...prev, resultados: novosResultados };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    // Limpa os resultados e anotação ao selecionar um novo arquivo
    setExame((prev) => ({
      ...prev,
      resultados: [],
      anotacao: "",
    }));
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) {
      toast("Por favor, selecione um arquivo primeiro.", "aviso", { duration: 5000 });
      return;
    }

    setLoadingAnalysis(true); // Inicia o loading da análise

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/exames/analise", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro ao analisar exame:", errorText);
        toast("Erro ao analisar exame", "erro", { duration: 5000 });
        // Limpa os resultados e anotação em caso de erro na análise
        setExame((prev) => ({
          ...prev,
          resultados: [],
          anotacao: "",
        }));
        return;
      }

      const data = await res.json();

      console.log("Resposta da API /api/exames/analise:", data);

      if (data.resultados?.length) {
        setExame((prev) => ({
          ...prev,
          resultados: data.resultados,
        }));
         toast("Análise concluída com sucesso!", "success", { duration: 5000 });
      } else {
         toast("Análise concluída, mas nenhum resultado encontrado.", "aviso", { duration: 5000 });
         setExame((prev) => ({ // Garante que os resultados sejam limpos se nada for encontrado
            ...prev,
            resultados: [],
         }));
      }


      if (data.anotacao) {
        setExame((prev) => ({
          ...prev,
          anotacao: data.anotacao,
        }));
      } else {
         setExame((prev) => ({ // Garante que a anotação seja limpa se nada for retornado
            ...prev,
            anotacao: "",
         }));
      }

    } catch (error) {
      console.error("Erro na chamada da API de análise:", error);
      toast("Erro ao analisar arquivo", "erro", { duration: 5000 });
       setExame((prev) => ({ // Limpa os resultados e anotação em caso de erro na chamada
          ...prev,
          resultados: [],
          anotacao: "",
       }));
    } finally {
      setLoadingAnalysis(false); // Finaliza o loading da análise
    }
  };


  const handleSubmit = async () => {
    setLoadingSubmit(true);

    // Adicionado verificação se a análise foi realizada e retornou resultados (ou se não é tipo sangue/urina)
    const needsAnalysis = ["urina", "sangue"].includes(tipoExame);
    const analysisDone = needsAnalysis ? exame.resultados?.length > 0 : true;


    if (
      !userId ||
      !selectedProfissional?.id ||
      !selectedUnidade?.id ||
      !selectedFile ||
      (needsAnalysis && !analysisDone) // Verifica se a análise foi feita e retornou resultados para tipos que precisam
    ) {
      let errorMessage = "Preencha todos os campos obrigatórios.";
      if (needsAnalysis && !analysisDone) {
          errorMessage = "Por favor, analise o arquivo e garanta que resultados foram extraídos.";
      }
      toast(errorMessage, "erro", {
        duration: 5000, // Corrigido duração
      });
      setLoadingSubmit(false);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("userId", userId);
      formData.append("profissionalId", selectedProfissional.id);
      formData.append("unidadeId", selectedUnidade.id);
      formData.append("consultaId", selectedConsulta?.id || "");
      formData.append("tratamentoId", selectedTratamento?.id || "");
      formData.append("anotacao", anotacao);
      formData.append("dataExame", dataExame);
      formData.append("file", selectedFile);

      if (needsAnalysis && exame.resultados) { // Usa needsAnalysis aqui
        formData.append(
          "exames",
          JSON.stringify(
            exame.resultados.map((resultado) => ({
              ...resultado,
              unidade:
                resultado.unidade === "Outro"
                  ? resultado.outraUnidade
                  : resultado.unidade,
            })),
          ),
        );
      }

      const res = await fetch("/api/exames/exame", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast("Exame cadastrado com sucesso!", "success", { duration: 5000 });
        router.push("/exames");
      } else {
        const error = await res.json();
        toast("Erro ao enviar o exame", "erro", { duration: 5000 });
        console.error(error);
      }
    } catch (err) {
      toast("Erro inesperado", "erro", { duration: 5000 });
      console.error(err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold">Cadastrar Exame</h1>
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Consulta</Label>
              <Select
                value={selectedConsulta?.id || "none"}
                onValueChange={(id) => {
                  if (id === "none") {
                    setSelectedConsulta(null);
                    setSelectedProfissional(null);
                    setSelectedUnidade(null);
                  } else {
                    const consulta = consultas.find((c) => c.id === id);
                    setSelectedConsulta(consulta || null);
                    setSelectedProfissional(consulta?.profissional || null);
                    setSelectedUnidade(consulta?.unidade || null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {consultas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {new Date(c.data).toLocaleDateString()} -{" "}
                      {c.profissional?.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedConsulta && (
              <>
                <div>
                  <Label>Unidade</Label>
                  <MenuUnidades
                    selectedUnidade={selectedUnidade}
                    onUnidadeSelect={setSelectedUnidade}
                  />
                </div>
                <div>
                  <Label>Profissional</Label>
                  <MenuProfissionais
                    profissionais={profissionais}
                    selectedProfissional={selectedProfissional}
                    onProfissionalSelect={setSelectedProfissional}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Tratamento</Label>
              <MenuTratamentos
                tratamentos={tratamentos}
                selectedTratamento={selectedTratamento}
                onTratamentoSelect={setSelectedTratamento}
              />
            </div>

            <div>
              <Label>Data do Exame</Label>
              <Input
                type="date"
                value={dataExame}
                onChange={(e) => setDataExame(e.target.value)}
              />
            </div>

            <div>
              <Label>Tipo de Exame</Label>
              <Select value={tipoExame} onValueChange={setTipoExame}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de exame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sangue">Sangue</SelectItem>
                  <SelectItem value="urina">Urina</SelectItem>
                  <SelectItem value="usg">USG</SelectItem>
                  <SelectItem value="raiox">Raio-X</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Anotação</Label>
            <Textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
            />
          </div>
          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
               <Button
                onClick={handleAnalyzeFile}
                disabled={!selectedFile || loadingAnalysis}
                type="button" // Importante para não submeter o formulário
              >
                {loadingAnalysis ? "Analisando..." : "Analisar Arquivo"}
              </Button>
            </div>
            {selectedFile && (
              <p className="mt-1 text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>
          {["sangue", "urina"].includes(tipoExame) && (
            <>
              <TabelaExames
                exames={exame.resultados || []}
                onAddExame={handleAddExame}
                onRemoveExame={handleRemoveExame}
                onExameChange={handleExameChange}
              />
            </>
          )}

          <ConfirmarExameDialog
            loadingSubmit={loadingSubmit}
            tipoExame={tipoExame}
            dataExame={exame.dataExame}
            selectedProfissional={selectedProfissional}
            selectedUnidade={selectedUnidade}
            anotacao={exame.anotacao || ""}
            exames={exame.resultados || []}
            onSubmit={handleSubmit}
          >
            <Button
              disabled={loadingSubmit || !selectedFile} // Pode adicionar || loadingAnalysis aqui se quiser impedir o cadastro enquanto analisa
              className="w-full"
            >
              {loadingSubmit ? "Enviando..." : "Cadastrar Exame"}
            </Button>
          </ConfirmarExameDialog>
        </form>
      </main>
      <Footer />
    </>
  );
};
