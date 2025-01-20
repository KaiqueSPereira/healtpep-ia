"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";

interface Unidade {
  id?: string;
  nome: string;
  tipo: string;
  endereco: string;
}

const UnidadeForm: React.FC = () => {
  const router = useRouter();
  const [unidade, setUnidade] = useState<Unidade>({
    nome: "",
    tipo: "",
    endereco: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pegando o id da unidade da URL
  const { unidadeid } = router.query;

  // Carregar dados da unidade caso esteja editando
  useEffect(() => {
    if (unidadeid) {
      const fetchUnidade = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/unidadesaude?id=${unidadeid}`);
          if (res.ok) {
            const data = await res.json();
            setUnidade(data);
          } else {
            alert("Erro ao carregar os dados da unidade");
          }
        } catch (err) {
          alert("Erro ao carregar os dados da unidade");
        } finally {
          setIsLoading(false);
        }
      };
      fetchUnidade();
    }
  }, [unidadeid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = unidade.id ? "PATCH" : "POST";
      const url = unidade.id ? `/api/unidadesaude` : "/api/unidadesaude";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(unidade),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar a unidade");
      }

      // Após sucesso, redirecionar para a lista de unidades
      router.push("/unidades");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a unidade");
    }
  };

  return (
    <div>
      <h1>{unidade.id ? "Editar Unidade" : "Adicionar Unidade"}</h1>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              value={unidade.nome}
              onChange={(e) => setUnidade({ ...unidade, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="tipo">Tipo:</label>
            <input
              type="text"
              id="tipo"
              value={unidade.tipo}
              onChange={(e) => setUnidade({ ...unidade, tipo: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="endereco">Endereço:</label>
            <input
              type="text"
              id="endereco"
              value={unidade.endereco}
              onChange={(e) =>
                setUnidade({ ...unidade, endereco: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit">
            {unidade.id ? "Atualizar" : "Cadastrar"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default UnidadeForm;
