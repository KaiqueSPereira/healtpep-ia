"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";
import TabelaExames from "@/app/exames/components/TabelaExames";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { toast } from "@/app/_hooks/use-toast";

import {
  Consulta,
  Profissional,
  Unidade,
  Tratamento,
} from "@/app/_components/types";

const CadastroExame = () => {
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

  const [exames, setExames] = useState([
    { nome: "", valor: "", unidade: "", ValorReferencia: "", outraUnidade: "" },
  ]);

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
    setExames([
      ...exames,
      {
        nome: "",
        valor: "",
        unidade: "",
        ValorReferencia: "",
        outraUnidade: "",
      },
    ]);
  };

  const handleRemoveExame = (index: number) => {
    setExames(exames.filter((_, i) => i !== index));
  };

  const handleExameChange = (
    index: number,
    field: keyof (typeof exames)[0],
    value: string,
  ) => {
    const newExames = [...exames];
    newExames[index][field] = value;
    setExames(newExames);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    setLoadingSubmit(true);

    if (
      !userId ||
      !selectedProfissional?.id ||
      !selectedUnidade?.id ||
      !selectedFile
    ) {
      toast("Preencha todos os campos obrigatórios.", "erro", {
        duration: 5000,
      });
      setLoadingSubmit(false);
      return;
    }

    try {
      const formData = new FormData();
      if (["urina", "sangue"].includes(tipoExame)) {
        formData.append(
          "exames",
          JSON.stringify(
            exames.map((exame) => ({
              ...exame,
              unidade:
                exame.unidade === "Outro" ? exame.outraUnidade : exame.unidade,
            })),
          ),
        );
      }

      formData.append("userId", userId);
      formData.append("profissionalId", selectedProfissional.id);
      formData.append("unidadeId", selectedUnidade.id);
      formData.append("consultaId", selectedConsulta?.id || "");
      formData.append("tratamentoId", selectedTratamento?.id || "");
      formData.append("anotacao", anotacao);
      formData.append("dataExame", dataExame);
      formData.append("file", selectedFile);

      const res = await fetch("/api/exames", {
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

          {["sangue", "urina"].includes(tipoExame) && (
            <>
              <TabelaExames
                exames={exames}
                onAddExame={handleAddExame}
                onRemoveExame={handleRemoveExame}
                onExameChange={handleExameChange}
              />
             
            </>
          )}

          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={loadingSubmit} className="w-full">
                {loadingSubmit ? "Enviando..." : "Cadastrar Exame"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Cadastro do Exame</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Tipo:</strong> {tipoExame || "Não selecionado"}
                </p>
                <p>
                  <strong>Data:</strong> {dataExame || "Não definida"}
                </p>
                <p>
                  <strong>Profissional:</strong>{" "}
                  {selectedProfissional?.nome || "Não selecionado"}
                </p>
                <p>
                  <strong>Unidade:</strong>{" "}
                  {selectedUnidade?.nome || "Não selecionada"}
                </p>
                <p>
                  <strong>Anotação:</strong> {anotacao || "Nenhuma"}
                </p>
                {["sangue", "urina"].includes(tipoExame) && (
                  <>
                    <p className="pt-2 font-semibold">Exames:</p>
                    <ul className="list-disc pl-4">
                      {exames.map((exame, idx) => (
                        <li key={idx}>
                          {exame.nome || "(sem nome)"} — {exame.valor || "-"}{" "}
                          {exame.unidade === "Outro"
                            ? exame.outraUnidade
                            : exame.unidade || ""}{" "}
                          — Ref: {exame.ValorReferencia || "-"}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={loadingSubmit}>
                  Confirmar e Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </main>
      <Footer />
    </>
  );
};

export default CadastroExame;
