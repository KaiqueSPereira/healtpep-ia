"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronRight, ChevronLeft, Edit} from "lucide-react";
import Header from "@/app/_components/header";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import AgendamentoItem from "@/app/consulta/components/agendamentosItem";
import Link from "next/link";
import TratamentoSelectorMultiple from "@/app/tratamentos/_Components/TratamentoSelectorMultiple";


// Interfaces (mantidas)
interface UnidadeSaude { id: string; nome: string; tipo: string; }
interface Consulta { id: string; data: string; tipo: string; usuario: { nome: string }; unidade: { nome: string }; }
interface Exame { id: string; nome: string; anotacao?: string | null; dataExame: string; tipo: string; usuario: { nome: string }; unidades?: UnidadeSaude | null; }
interface Tratamento { id: string; nome: string; descricao?: string | null; }
interface Profissional { id: string; nome: string; especialidade: string; NumClasse: string; unidades?: UnidadeSaude[]; consultas?: Consulta[]; exames?: Exame[]; tratamentos?: Tratamento[]; }


const ProfissionalDetalhesPage = () => {
  const { profissionalId } = useParams<{ profissionalId: string }>();
  const router = useRouter();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profRes = await fetch(`/api/profissional/${profissionalId}`);
        if (!profRes.ok) {
          const errorData = await profRes.json();
          throw new Error( errorData.error || "Erro ao carregar dados do profissional" );
        }
        const profData: Profissional = await profRes.json();
        setProfissional(profData);
        setConsultas(profData.consultas || []);
        setExames(profData.exames || []);
        setTratamentos(profData.tratamentos || []);
      } catch (error: unknown) {
        console.error("Erro ao carregar dados:", error);
        setError( error instanceof Error ? error.message : "Erro ao carregar dados desconhecido" );
      } finally { setLoading(false); }
    };
    if (profissionalId) fetchData();
  }, [profissionalId]);

   
   const handleExameClick = (exameId: string) => { router.push(`/exames/${exameId}`); };
   const handleConsultaClick = (consultaId: string) => { router.push(`/consulta/${consultaId}`); };
   const handleTratamentosChange = (updatedTratamentos: Tratamento[]) => {
       setTratamentos(updatedTratamentos);
        setProfissional(prev => {
            if (prev) { return {...prev, tratamentos: updatedTratamentos}; }
            return null;
        });
   };

  if (loading) return ( <div className="flex min-h-screen items-center justify-center py-10"> <Loader2 className="h-8 w-8 animate-spin" /> </div> );
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!profissional) return <div className="text-center py-10">Profissional não encontrado.</div>;


  return (
    <div className="flex flex-col">
      <Header />
       {/* Div que contém os botões - RESTAURADO */}
       <div className="p-4 flex justify-between items-center">
            {/* Botão Voltar - RESTAURADO E CORRIGIDO COM FRAGMENT */}
            <Button variant="secondary" asChild>
                <Link href="/profissionais"> {/* AJUSTAR ROTA LISTAGEM */}
                    <> {/* Fragment para envolver múltiplos filhos */}
                        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Profissionais
                    </>
                </Link>
            </Button>
            <div className="flex space-x-2">
                 <Button variant="outline" size="icon" asChild>
                     <Link href={`/profissionais/${profissional.id}/editar`}> {/* AJUSTAR ROTA EDIÇÃO */} <Edit className="h-4 w-4" /> </Link>
                 </Button>
            </div>
        </div>

      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold text-center">{profissional.nome}</h1>

        {/* GRID PRINCIPAL */}
        <div className=" mx-auto grid gap-4">

            {/* Card Especialidade */}
            <Card className="border-none"> {/* Este Card ocupará 1 coluna em md+ */}
                <CardHeader> <CardTitle>Especialidade</CardTitle> </CardHeader>
                <CardContent> <p>{profissional.especialidade}</p> </CardContent>
            </Card>

             {/* Card Número de Classe */}
             <Card className="border-none"> {/* Este Card ocupará 1 coluna em md+ */}
                <CardHeader> <CardTitle>Número de Classe</CardTitle> </CardHeader>
                <CardContent> <p>{profissional.NumClasse}</p> </CardContent>
            </Card>

             {/* Card Unidades Vinculadas (se o componente UnidadeSelectorMultiple NÃO estiver nesta tela) */}
            {profissional.unidades && profissional.unidades.length > 0 && (
                 <Card className="md:col-span-2 border-none">
                    <CardHeader> <CardTitle>Unidades Vinculadas</CardTitle> </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside pl-4">
                            {profissional.unidades.map(unidade => (
                                <li key={unidade.id}>{unidade.nome} ({unidade.tipo})</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

             {/* ADICIONADO: Card Gerenciar Tratamentos (com componente) */}
            <Card>
                 <CardHeader> <CardTitle>Gerenciar Tratamentos</CardTitle> </CardHeader>
                 <CardContent>
                     {profissional && (
                        <TratamentoSelectorMultiple
                           profissionalId={profissional.id}
                           currentTratamentos={tratamentos}
                           onTratamentosChange={handleTratamentosChange}
                        />
                     )}
                 </CardContent>
            </Card>

            {/* Card Últimas Consultas */}
             <Card className="flex-1">
              <CardHeader> <CardTitle>Últimas Consultas</CardTitle> </CardHeader>
              <CardContent>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {consultas.length > 0 ? (
                      consultas.map((consulta) => (
                         <div key={consulta.id} onClick={() => handleConsultaClick(consulta.id)} className="cursor-pointer hover:bg-gray-100 rounded-lg transition-colors">
                            <AgendamentoItem consultas={{ id: consulta.id, tipo: consulta.tipo, data: new Date(consulta.data), profissional: { nome: profissional.nome || "" }, unidade: { nome: consulta.unidade.nome }, }} />
                        </div>
                      ))
                  ) : ( <p className="text-center text-gray-500">Nenhuma consulta encontrada.</p> )}
                </div>
              </CardContent>
            </Card>

          {/* Card Últimos Exames */}
           <Card className="flex-1">
              <CardHeader> <CardTitle>Últimos Exames</CardTitle> </CardHeader>
              <CardContent>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                   {exames.length > 0 ? (
                      exames.map((exame) => (
                        <div key={exame.id} className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-100" onClick={() => handleExameClick(exame.id)}>
                          <div>
                            <p className="font-medium">{exame.anotacao}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(exame.dataExame).toLocaleDateString()} -{" "}
                              {exame.tipo}
                            </p>
                            {exame.usuario && exame.usuario.nome && ( <p className="text-sm text-gray-500"> Usuário: {exame.usuario.nome} </p> )}
                            {exame.unidades && exame.unidades.nome && ( <p className="text-sm text-gray-500"> Unidade: {exame.unidades.nome} </p> )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      ))
                   ) : ( <p className="text-center text-gray-500">Nenhum exame encontrado.</p> )}
                </div>
              </CardContent>
            </Card>

        </div> {/* FIM DO GRID PRINCIPAL */}

      </main>


    </div>
  );
};

export default ProfissionalDetalhesPage;
