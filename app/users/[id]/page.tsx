// app/users/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/app/_components/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { Avatar, AvatarImage } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { Loader2 } from 'lucide-react';
import Link from "next/link";
import { useToast } from "@/app/_hooks/use-toast";
import PesoHistoryChart from '@/app/users/_components/PesoHistoryChart';
import IMCChart from '../_components/IMCChart'; // Importe o componente IMCChart

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  dadosSaude?: {
    id: string;
    userId: string;
    CNS: string | null;
    tipoSanguineo: string | null;
    sexo: string | null;
    dataNascimento: string | null;
    altura: number | null;
  } | null;
}

interface PesoRegistro {
  id: string;
  userId: string;
  peso: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}


const calcularIdade = (dataNascimento: string | null | undefined): number | null => {
  if (!dataNascimento) return null;

  try {
    const today = new Date();
    const birthDate = new Date(dataNascimento);

    if (isNaN(birthDate.getTime())) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (e) {
    console.error("Erro ao calcular idade:", e);
    return null;
  }
};

const formatarData = (data: string | null | undefined) => {
  if (!data) return "Não informado";
  try {
    const parts = data.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const dateObj = new Date(Date.UTC(year, month - 1, day));

    const dia = dateObj.getUTCDate().toString().padStart(2, '0');
    const mes = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const ano = dateObj.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
  } catch {
    return "Data inválida";
  }
};


export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicoPeso, setHistoricoPeso] = useState<PesoRegistro[]>([]); // Estado para histórico de peso
  const [loadingHistorico, setLoadingHistorico] = useState(true); // Estado de loading para histórico de peso
  const [errorHistorico, setErrorHistorico] = useState<string | null>(null); // Estado de erro para histórico de peso


  const { toast } = useToast();


  useEffect(() => {
    if (typeof id !== 'string' || !id) {
      setLoading(false);
      const errorMessage = "ID do usuário não fornecido ou inválido.";
      setError(errorMessage);
       toast({
         variant: "destructive",
         title: "Erro de rota",
         description: errorMessage,
       });
      return;
    }

    const fetchUserDataAndPeso = async () => { // Função única para buscar dados do usuário e peso
      setLoading(true);
      setLoadingHistorico(true);
      try {
        // Busca dados do usuário
        const userResponse = await fetch(`/api/users/${id}`);
        if (!userResponse.ok) {
           const errorMessage = `Erro ao carregar dados do usuário: ${userResponse.statusText}`;
           setError(errorMessage);
           toast({
             variant: "destructive",
             title: "Erro ao carregar",
             description: errorMessage,
           });
           setLoading(false);
          return;
        }
        const userData: UserData = await userResponse.json();
        setUserData(userData);
        console.log("Dados do Usuário:", userData); // Log para verificar dados do usuário


        // Busca histórico de peso
        const pesoResponse = await fetch(`/api/pesos/${id}`);
        if (!pesoResponse.ok) {
          const errorData = await pesoResponse.json();
          throw new Error(errorData.error || 'Erro ao buscar histórico de peso');
        }
        const pesoData: PesoRegistro[] = await pesoResponse.json();
        setHistoricoPeso(pesoData);
        console.log("Dados do Histórico de Peso:", pesoData); // Log para verificar dados do histórico de peso


      } catch (err) {
         const errorMessage = "Ocorreu um erro inesperado ao buscar os dados.";
         setError(errorMessage);
         toast({
            variant: "destructive",
            title: "Erro na busca",
            description: errorMessage,
          });
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingHistorico(false);
      }
    };

    fetchUserDataAndPeso(); // Chama a nova função de busca combinada
  }, [id, toast]);


  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : error ? (
           <p className="text-red-500">{error}</p> // Exibe erro de dados do usuário
        ) : !userData ? (
          <p>Nenhum dado de usuário encontrado.</p>
        ) : (
          <Card className="border-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Perfil do Usuário</CardTitle>
                <Link href={`/users/${userData.id}/editar`} passHref>
                  <Button variant="outline" size="sm">Editar</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name" className="text-lg font-semibold">Nome:</Label>
                    <p id="name" className="text-lg text-gray-900 dark:text-gray-100">
                      {userData.name || "Não informado"}
                      {userData.dadosSaude?.dataNascimento && ` (${calcularIdade(userData.dadosSaude.dataNascimento)} anos)`}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">Email:</Label>
                    <p id="email" className="text-sm text-gray-500 dark:text-gray-300">{userData.email}</p>
                  </div>
                </div>
                {userData.image && (
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.image} alt={userData.name || "User Image"} />
                  </Avatar>
                )}
              </div>

              <div>
                <Label htmlFor="tipoSanguineo">Tipo Sanguíneo:</Label>
                <p id="tipoSanguineo" className="text-sm text-gray-700 dark:text-gray-300">
                  {userData.dadosSaude?.tipoSanguineo || "Não informado"}
                </p>
              </div>
              <div>
                <Label htmlFor="sexo">Sexo:</Label>
                <p id="sexo" className="text-sm text-gray-700 dark:text-gray-300">
                  {userData.dadosSaude?.sexo || "Não informado"}
                </p>
              </div>
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento:</Label>
                <p id="dataNascimento" className="text-sm text-gray-700 dark:text-gray-300">
                  {formatarData(userData.dadosSaude?.dataNascimento)}
                </p>
              </div>
              <div>
                <Label htmlFor="cns">CNS:</Label>
                <p id="cns" className="text-sm text-gray-700 dark:text-gray-300">{userData.dadosSaude?.CNS || "Não informado"}</p>
              </div>

              {/* Container para os gráficos (lado a lado em telas maiores) */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Gráfico de Histórico de Peso */}
                <div className="md:w-4/5">
                   {userData && (
                      <PesoHistoryChart
                         userId={userData.id}
                         userHeight={userData.dadosSaude?.altura || null} // Passa a altura para o gráfico de Peso
                     />
                   )}
                </div>

                {/* Gráfico de IMC */}
                <div className="flex-1">
                   {userData && userData.dadosSaude?.altura !== null && ( // Renderize apenas se userData e altura existirem
                      <IMCChart
                         userId={userData.id}
                         userHeight={userData.dadosSaude?.altura || null} // Passa a altura (number | null)
                         historicoPeso={historicoPeso} // Passa o histórico de peso buscado no pai
                         loadingHistorico={loadingHistorico} // Passa o estado de loading
                         errorHistorico={errorHistorico} // Passa o estado de erro
                     />
                   )}
                </div>
              </div>


            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
