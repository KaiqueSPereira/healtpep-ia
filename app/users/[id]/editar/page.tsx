"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/app/_components/header'; // Importe o Header
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { useRouter } from 'next/navigation'; // Importe o hook useRouter
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input"; // Importe o Input para outros campos
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/_components/ui/select"; // Importe os componentes Select
import { Loader2 } from 'lucide-react'; // Importe o ícone de carregamento
// Importe o hook useToast aqui depois


interface UserData { // Interface para os dados do usuário
  id: string;
  name?: string | null; // Pode ser null
  email: string;
  CNS?: bigint | null; // Pode ser null
  tipoSanguineo?: string | null; // Pode ser null
  sexo?: string | null; // Pode ser null
  dataNascimento?: string | null; // Pode ser null
  image?: string | null;
  // Adicione outros campos conforme necessário (historicoPeso, etc.)
}

export default function UserEditPage() {
  const params = useParams();
  const id = params.id as string; // Assumindo que o ID na rota é sempre string

  const [formData, setFormData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter(); // Chame o hook useRouter


  useEffect(() => {
     if (typeof id !== 'string' || !id) {
        setLoading(false);
        setError("ID do usuário não fornecido ou inválido.");
        // Disparar toast aqui depois
        return;
      }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = `Erro ao carregar dados: ${errorData.message || response.statusText}`;
          setError(errorMessage);
          // Disparar toast de erro aqui depois
          setLoading(false);
          return;
        }
        const data: UserData = await response.json();
        // Converter CNS para string aqui depois
        setFormData(data);
      } catch (err) {
        const errorMessage = "Ocorreu um erro inesperado ao buscar os dados do usuário.";
        setError(errorMessage);
        // Disparar toast aqui depois
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);


   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target; // Simplificado, a conversão de tipo será tratada no handleSubmit

    setFormData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        [id]: value,
      };
    });
  };


  // Função para lidar com a mudança nos Selects
  const handleSelectChange = (id: keyof UserData, value: string) => {
    setFormData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        [id]: value === '' ? null : value,
      };
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || isSaving) return;

    setIsSaving(true);

    // Converter CNS para BigInt aqui antes de enviar

    try {
      const response = await fetch(`/api/users/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Enviando formData (CNS será convertido para string antes)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = `Erro ao salvar: ${errorData.message || response.statusText}`;
        // Disparar toast de erro aqui depois
        console.error("Erro ao salvar dados:", errorData);
      } else {
        const successMessage = "Dados salvos com sucesso!";
        // Disparar toast de sucesso aqui depois
        console.log(successMessage);
        // Opcional: redirecionar
      }
    } catch (err) {
      const errorMessage = "Ocorreu um erro inesperado ao salvar os dados.";
      // Disparar toast aqui depois
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };


  // Função auxiliar para formatar a data de nascimento para o input[date]
  const formatarDataParaInput = (data: string | null | undefined) => {
    if (!data) return '';
    try {
      const date = new Date(data);
       if (isNaN(date.getTime())) {
           return '';
       }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };


  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        {/* O erro será exibido via toast */}
         <div className="container mx-auto p-4">
           {/* Conteúdo opcional */}
        </div>
      </>
    );
  }

  if (!formData) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4">Nenhum dado de usuário encontrado para edição.</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>Editar Perfil do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit}>
              {/* Campo Nome */}
              <div>
                <Label htmlFor="name">Nome:</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Campo Email */}
               <div>
                <Label htmlFor="email">Email:</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

               {/* Campo Data de Nascimento */}
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento:</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                   value={formatarDataParaInput(formData.dataNascimento)}
                  onChange={handleChange}
                />
              </div>


              {/* Campos Sexo, Tipo Sanguíneo e CNS alinhados */}
              <div className="flex gap-4">
                {/* Campo Tipo Sanguíneo como Select */}
                <div className="flex-1">
                  <Label htmlFor="tipoSanguineo">Tipo Sanguíneo:</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange('tipoSanguineo', value)}
                    value={formData.tipoSanguineo || ''}
                  >
                    <SelectTrigger id="tipoSanguineo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo Sexo como Select */}
                <div className="flex-1">
                  <Label htmlFor="sexo">Sexo:</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange('sexo', value)}
                    value={formData.sexo || ''}
                  >
                    <SelectTrigger id="sexo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo CNS como Input */}
                <div className="flex-1">
                  <Label htmlFor="CNS">CNS:</Label>
                  <Input
                    id="CNS"
                    type="number"
                     value={formData.CNS ? formData.CNS.toString() : ''}
                    onChange={handleChange}
                  />
                </div>
              </div>


              {/* Botão Salvar */}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
