"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import { Profissional, Unidade, Consulta } from "@/app/_components/types";
import { toast } from "@/app/_hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const unidadesMedida = [
  "g/dL",
  "mg/dL",
  "milhões/mm³",
  "mil/mm³",
  "mm³",
  "mm/h",
  "mg/L",
  "ng/mL",
  "pg",
  "fL",
  "U/L",
  "mEq/L",
  "%",
  "uUI/mL",
  "mL/min",
  "mg",
  "μg/dL",
  "μIU/mL",
  "μmol/L",
  "mcmol/L",
  "mcmol/mol",
  "mg/g",
  "IU/L",
  "μg/mL",
  "Outro",
];

const CadastroExame = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(
    null,
  );
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [exames, setExames] = useState([
    { nome: "", valor: "", unidade: "", ValorReferencia: "", outraUnidade: "" },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [anotacao, setAnotacao] = useState<string>("");
  const [dataExame, setDataExame] = useState<string>("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/consultas?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setConsultas(d.consultas || []))
      .catch(() =>
        toast({
          title: "Erro",
          description: "Erro ao buscar consultas",
          variant: "destructive",
        }),
      );
  }, [userId]);

  useEffect(() => {
    if (!selectedUnidade?.id) return setProfissionais([]);
    fetch(`/api/unidadesaude?id=${selectedUnidade.id}`)
      .then((r) => r.json())
      .then((d) => setProfissionais(d.profissionais || []))
      .catch(() =>
        toast({
          title: "Erro",
          description: "Erro ao buscar profissionais",
          variant: "destructive",
        }),
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
    const newExames = exames.filter((_, i) => i !== index);
    setExames(newExames);
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
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !userId ||
      !selectedProfissional?.id ||
      !selectedUnidade?.id ||
      exames.length === 0 ||
      !selectedFile
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingSubmit(true);
      const formData = new FormData();
      formData.append("arquivoExame", selectedFile);
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
      formData.append("userId", userId);
      formData.append("profissionalId", selectedProfissional.id);
      formData.append("unidadeId", selectedUnidade.id);
      formData.append("consultaId", selectedConsulta?.id || "");
      formData.append("anotacao", anotacao || "");
      formData.append("dataExame", dataExame || "");

      const res = await fetch("/api/exames", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Exame cadastrado com sucesso!",
          variant: "default",
        });
        router.push("/exames");
      } else {
        toast({
          title: "Erro",
          description: "Erro ao enviar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro no envio.",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-32 pt-24">
      <Header />
      <main className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Cadastrar Exame</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Consulta</Label>
              <Select
                value={selectedConsulta?.id || "none"}
                onValueChange={(value) => {
                  const consulta = consultas.find((c) => c.id === value);
                  setSelectedConsulta(consulta || null);
                  setSelectedProfissional(consulta?.profissional || null);
                  setSelectedUnidade(consulta?.unidade || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {consultas.map((consulta) => (
                    <SelectItem key={consulta.id} value={consulta.id}>
                      {new Date(consulta.data).toLocaleDateString()} -{" "}
                      {consulta.profissional?.nome || "Sem Profissional"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedConsulta && (
              <>
                <div>
                  <Label>Profissional</Label>
                  <MenuProfissionais
                    profissionais={profissionais}
                    selected={selectedProfissional}
                    onSelect={setSelectedProfissional}
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <MenuUnidades
                    selected={selectedUnidade}
                    onSelect={setSelectedUnidade}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Data do Exame</Label>
              <Input
                type="date"
                value={dataExame}
                onChange={(e) => setDataExame(e.target.value)}
              />
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
            <h2 className="mb-2 text-xl font-bold">Exames</h2>
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <table className="w-full table-auto text-sm text-gray-700">
                <thead className="bg-muted">
                  <tr>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2 text-left">Valor</th>
                    <th className="border p-2 text-left">Unidade</th>
                    <th className="border p-2 text-left">
                      Valor de Referência
                    </th>
                    <th className="border p-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {exames.map((exame, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border p-2">
                        <Input
                          value={exame.nome}
                          onChange={(e) =>
                            handleExameChange(index, "nome", e.target.value)
                          }
                          placeholder="Ex: Hemácias"
                        />
                      </td>
                      <td className="border p-2">
                        <Input
                          value={exame.valor}
                          onChange={(e) =>
                            handleExameChange(index, "valor", e.target.value)
                          }
                          placeholder="Ex: 5.2"
                        />
                      </td>
                      <td className="border p-2">
                        <Select
                          value={exame.unidade}
                          onValueChange={(value) =>
                            handleExameChange(index, "unidade", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {exame.unidade === "Outro" && (
                          <Input
                            placeholder="Digite a unidade"
                            value={exame.outraUnidade}
                            onChange={(e) =>
                              handleExameChange(
                                index,
                                "outraUnidade",
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="border p-2">
                        <Input
                          value={exame.ValorReferencia}
                          onChange={(e) =>
                            handleExameChange(
                              index,
                              "ValorReferencia",
                              e.target.value,
                            )
                          }
                          placeholder="Ex: 5.2"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          type="button"
                          onClick={() => handleRemoveExame(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              onClick={handleAddExame}
              variant="secondary"
              className="mt-4 flex items-center gap-2"
            >
              <Plus size={18} /> Adicionar exame
            </Button>
          </div>

          <div>
            <Label>Anexar Arquivo (PDF ou imagem)</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </div>

          <Button type="submit" disabled={loadingSubmit} className="w-full">
            {loadingSubmit ? "Enviando..." : "Cadastrar Exame"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CadastroExame;
