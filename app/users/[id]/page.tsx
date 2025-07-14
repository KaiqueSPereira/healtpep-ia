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

interface UserData { // Updated interface
  id: string;
  name?: string | null; // Pode ser null
  email: string;
  CNS?: bigint | null; // Pode ser null
  tipoSanguineo?: string | null; // Pode ser null
  sexo?: string | null; // Pode ser null
  dataNascimento?: string | null; // Pode ser null
  image?: string | null; // Adicionado campo image
}

export default function UserProfilePage() {
  // Tipando o retorno de useParams para garantir que 'id' seja string | string[]
  const params = useParams();
  const id = params.id as string; // Assumindo que o ID na rota é sempre string

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Chame o hook useToast


  useEffect(() => {
    // Verifica se o ID é uma string e não está vazio antes de buscar
    if (typeof id !== 'string' || !id) {
      setLoading(false);
      const errorMessage = "ID do usuário não fornecido ou inválido.";
      setError(errorMessage);
       toast({ // Dispara toast para erro de ID
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
          const errorData = await response.json();
           const errorMessage = `Erro ao carregar dados: ${response.statusText}`;
           setError(errorMessage); // Define o estado de erro
           toast({ // Dispara toast de erro de carregamento da API
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
         setError(errorMessage); // Define o estado de erro
         toast({ // Dispara toast em caso de exceção
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
  }, [id, toast]); // Adicione toast como dependencia do useEffect


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
    } catch (e) {
      return "Data inválida";
    }
  };

  return (
    <> {/* Use Fragment para incluir o Header antes do conteúdo */}
      <Header /> {/* Header is always rendered */}

      {/* Main content area with padding */}
      <div className="container mx-auto p-4">
        {loading ? (
          // Display loading spinner when loading
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : error ? (
          // Display error message if there's an error (agora via toast)
          // Podemos retornar null ou um placeholder vazio aqui
          null
        ) : !userData ? (
          // Display "No data" message if no user data is found
          <p>Nenhum dado de usuário encontrado.</p>
        ) : (
          // Display user data when userData is available
          <Card className="border-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Perfil do Usuário</CardTitle>
                {/* Link para a página de edição - usa userData.id diretamente */}
                <Link href={`/users/${userData.id}/editar`} passHref>
                  <Button variant="outline" size="sm">Editar</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="name">Nome:</Label>
                  <p id="name" className="text-sm">{userData.name || "Não informado"}</p>
                  <Label htmlFor="email">Email:</Label>
                  <p id="email" className="text-sm">{userData.email}</p>
                </div>
                {/* Avatar alinhado à direita - usa userData.image diretamente */}
                {userData.image && (
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.image} alt={userData.name || "User Image"} />
                  </Avatar>
                )}
              </div>
              <div>
                <Label htmlFor="tipoSanguineo">Tipo Sanguíneo:</Label>
                {/* Usa userData.tipoSanguineo diretamente */}
                <p id="tipoSanguineo" className="text-sm">{userData.tipoSanguineo || "Não informado"}</p>

                <Label htmlFor="sexo">Sexo:</Label>
                 {/* Usa userData.sexo diretamente */}
                <p id="sexo" className="text-sm">{userData.sexo || "Não informado"}</p>

                <Label htmlFor="dataNascimento">Data de Nascimento:</Label>
                {/* Usa userData.dataNascimento diretamente */}
                <p id="dataNascimento" className="text-sm">{formatarData(userData.dataNascimento)}</p>

                <Label htmlFor="cns">CNS:</Label>
                 {/* Usa userData.CNS diretamente */}
                <p id="cns" className="text-sm">{userData.CNS ? userData.CNS.toString() : "Não informado"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
