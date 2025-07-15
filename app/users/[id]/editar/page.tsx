"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/_components/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/_components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/app/_hooks/use-toast"; // Importe o hook useToast

interface DadosSaudeData {
  id?: string;
  userId: string;
  CNS?: string | null; // Tratando como string no frontend
  tipoSanguineo?: string | null;
  sexo?: string | null;
  dataNascimento?: string | null; // Armazenaremos como string no formato YYYY-MM-DD
  altura?: string | null; // Tratando como string no frontend
  createdAt?: string;
  updatedAt?: string;
}

interface UserData {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  dadosSaude?: DadosSaudeData | null; // Dados de saúde aninhados
}

export default function UserEditPage() {
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
          const errorData = await response.json();
          const errorMessage = `Erro ao carregar dados: ${errorData.message || response.statusText}`;
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
        // Certifique-se de que dadosSaude está presente na resposta, mesmo que null
        setFormData(data);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData(prevData => {
      if (!prevData) return null;

      if (id === 'name' || id === 'email') {
        return prevData;
      }

      const newData = { ...prevData };

      // Inicializa dadosSaude se não existir
      if (!newData.dadosSaude) {
        newData.dadosSaude = { userId: newData.id };
      }

      // Atualiza o campo dentro de dadosSaude
      newData.dadosSaude = {
        ...newData.dadosSaude,
        [id]: value === '' ? null : value, // Trata valor vazio como null
      };

      return newData; // Retorna a cópia modificada
    });
  };

  const handleSelectChange = (id: keyof DadosSaudeData, value: string) => {
    setFormData(prevData => {
      if (!prevData) return null;

      if (!prevData.dadosSaude) {
        prevData.dadosSaude = { userId: prevData.id };
      }

      return {
        ...prevData,
        dadosSaude: {
          ...prevData.dadosSaude,
          [id]: value === '' ? null : value, // Trata seleção vazia como null
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called");

    if (!formData || isSaving) return;

    setIsSaving(true);

    try {
      // Crie um payload contendo apenas os dados de saude editáveis
      const payloadToSend = {
          dadosSaude: formData.dadosSaude ? {
             CNS: formData.dadosSaude.CNS || null,
             tipoSanguineo: formData.dadosSaude.tipoSanguineo || null,
             sexo: formData.dadosSaude.sexo || null,
             dataNascimento: formData.dadosSaude.dataNascimento || null, // Já está no formato YYYY-MM-DD
             altura: formData.dadosSaude.altura || null,
          } : null, // Se não houver dadosSaude, pode enviar null ou um objeto vazio dependendo do backend
      };


      const response = await fetch(`/api/users/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend), // Envia o payload ajustado
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = `Erro ao salvar: ${errorData.message || response.statusText}`;
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: errorMessage,
        });
        console.error("Erro ao salvar dados:", errorData);
      } else {
        const successMessage = "Dados salvos com sucesso!";
        toast({
          variant: "default",
          title: "Sucesso!",
          description: successMessage,
        });
        console.log(successMessage);
        router.push(`/users/${formData.id}`); // Redireciona após sucesso
      }
    } catch (err) {
      const errorMessage = "Ocorreu um erro inesperado ao salvar os dados.";
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: errorMessage,
      });
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
       // Verifica se a data é válida
       if (isNaN(date.getTime())) {
           return '';
       }
      // Formata para o formato YYYY-MM-DD esperado pelo input type="date"
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
        <div className="container mx-auto p-4">
          {/* O erro será exibido via toast */}
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
                  readOnly
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
                  readOnly
                />
              </div>

              {/* Campo Data de Nascimento com input type="date" */}
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento:</Label>
                <Input
                  id="dataNascimento"
                  type="date" // Mantido type="date"
                  value={formData.dadosSaude?.dataNascimento ? formatarDataParaInput(formData.dadosSaude.dataNascimento) : ''}
                  onChange={handleChange}
                />
              </div>

               {/* Campos Altura e Sexo na mesma linha */}
              <div className="flex gap-4">
                 {/* Campo Altura */}
                <div className="flex-1">
                  <Label htmlFor="altura">Altura (cm):</Label>
                  <Input
                    id="altura"
                    type="number"
                    step="0.01"
                    value={formData.dadosSaude?.altura || ''}
                    onChange={handleChange}
                    placeholder="Digite a altura"
                  />
                </div>

                 {/* Campo Sexo como Select */}
                <div className="flex-1">
                  <Label htmlFor="sexo">Sexo:</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange('sexo', value)}
                    value={formData.dadosSaude?.sexo || ''}
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
              </div>

              {/* Campos Tipo Sanguíneo e CNS na linha de baixo */}
              <div className="flex gap-4">
                {/* Campo Tipo Sanguíneo como Select */}
                <div className="flex-1">
                  <Label htmlFor="tipoSanguineo">Tipo Sanguíneo:</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange('tipoSanguineo', value)}
                    value={formData.dadosSaude?.tipoSanguineo || ''}
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

                {/* Campo CNS como Input */}
                <div className="flex-1">
                  <Label htmlFor="CNS">CNS:</Label>
                  <Input
                    id="CNS"
                    type="text" // Mantido como text
                    value={formData.dadosSaude?.CNS || ''}
                    onChange={handleChange}
                    placeholder="Digite o CNS"
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
