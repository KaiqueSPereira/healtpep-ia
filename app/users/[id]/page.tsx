// app/users/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/app/_components/header'; // Importando o componente Header
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { Avatar, AvatarImage } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button"; // Importando o componente Button
import { Loader2 } from 'lucide-react'; // Importando o ícone de carregamento
import Link from "next/link"; // Importando o componente Link
import { useToast } from "@/app/_hooks/use-toast"; // Importando o hook useToast
import PesoHistoryChart from '@/app/users/_components/PesoHistoryChart'; // Importa o componente PesoHistoryChart

interface UserData { // Updated interface
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  // O campo dadosSaude é opcional caso o usuário ainda não tenha um registro na nova tabela
  dadosSaude?: {
    id: string;
    userId: string;
    CNS: string | null;
    tipoSanguineo: string | null;
    sexo: string | null;
    dataNascimento: string | null;
    altura: number | null; // Altura agora como number após descriptografia na API
  } | null;
}

// ... função calcularIdade existente ...
const calcularIdade = (dataNascimento: string | null | undefined): number | null => {
  if (!dataNascimento) return null;

  try {
    const today = new Date();
    const birthDate = new Date(dataNascimento); // Tenta parsear a string da data (espera formato YYYY-MM-DD)

    // Verifica se a data de nascimento é válida
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Ajusta a idade se o aniversário ainda não ocorreu este ano
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (e) {
    console.error("Erro ao calcular idade:", e);
    return null;
  }
};

  // Função auxiliar para formatar a data de nascimento
  const formatarData = (data: string | null | undefined) => {
    if (!data) return "Não informado";
    try {
      // Parse a string da data (espera formato ISO 8601 ou similar do banco de dados)
      // Usar split para evitar problemas de fuso horário com o constructor Date
      const parts = data.split('-'); // Assumindo formato YYYY-MM-DD
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      // Criar um objeto Date em UTC a partir dos componentes
      const dateObj = new Date(Date.UTC(year, month - 1, day)); // Meses em Date sao de 0-11

      // Extrai componentes da data (UTC para evitar problemas de fuso horário)
      const dia = dateObj.getUTCDate().toString().padStart(2, '0');
      const mes = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0'); // Meses sao de 0 a 11
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

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
           const errorMessage = `Erro ao carregar dados: ${response.statusText}`;
           setError(errorMessage);
           toast({
             variant: "destructive",
             title: "Erro ao carregar",
             description: errorMessage,
           });
          setLoading(false);
          return;
        }
        const data: UserData = await response.json();
        setUserData(data);

      } catch (err) {
         const errorMessage = "Ocorreu um erro inesperado ao buscar os dados do usuário.";
         setError(errorMessage);
         toast({
            variant: "destructive",
            title: "Erro na busca",
            description: errorMessage,
          });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
           null
        ) : !userData ? (
          <p>Nenhum dado de usuário encontrado.</p>
        ) : (
          // Display user data when userData is available
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
              {/* Nova estrutura para Nome, Data de Nascimento e Idade na mesma linha, e Email abaixo */}
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

              {/* Restante dos campos de dados de saúde */}
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

              {/* === ADICIONANDO O COMPONENTE PESOHISTORYCHART === */}
              {/* Verifique se userData existe antes de passar as props */}
              {userData && (
                <PesoHistoryChart
                  userId={userData.id}
                  // Passe a altura do usuário (assumindo que já é um número em metros da API)
                  userHeight={userData.dadosSaude?.altura || null}
                />
              )}

            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
