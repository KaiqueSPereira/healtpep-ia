"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, CalendarCheck } from "lucide-react";
import Header from "../_components/header";
import Footer from "../_components/footer";



const UnidadesPage = () => {
  interface Unidade {
    id: string | number;
    nome: string;
    tipo: string;
  }

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [profissionaisPorUnidade, setProfissionaisPorUnidade] = useState<Record<string | number, number>>({});
  const [consultasPorUnidade, setConsultasPorUnidade] = useState<Record<string | number, number>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resUnidades, resProfissionais, resConsultas] = await Promise.all(
          [
            fetch("/api/unidadesaude"),
            fetch("/api/profissional"),
            fetch("/api/consultas"),
          ],
        );

        if (!resUnidades.ok || !resProfissionais.ok || !resConsultas.ok) {
          throw new Error("Erro ao carregar dados");
        }

        // Unidades
        const unidadesData = await resUnidades.json();
        setUnidades(unidadesData);

        // Profissionais
        const profissionaisData = await resProfissionais.json();
        const profissionaisArray = Array.isArray(profissionaisData)
          ? profissionaisData
          : [];
        const contagemProfissionais = profissionaisArray.reduce(
          (acc, profissional) => {
            if (Array.isArray(profissional.unidades)) {
              profissional.unidades.forEach((unidade: { id: string | number; }) => {
                if (unidade.id) {
                  acc[unidade.id] = (acc[unidade.id] || 0) + 1;
                }
              });
            }
            return acc;
          },
          {},
        );
        setProfissionaisPorUnidade(contagemProfissionais);

        // Consultas
        const consultasData = await resConsultas.json();
        const consultasArray = Array.isArray(consultasData)
          ? consultasData
          : consultasData.consultas || [];
        const contagemConsultas = consultasArray.reduce((acc: { [x: string]: number; }, consulta: { unidadeId: string | number; }) => {
          if (consulta.unidadeId) {
            acc[consulta.unidadeId] = (acc[consulta.unidadeId] || 0) + 1;
          }
          return acc;
        }, {});
        setConsultasPorUnidade(contagemConsultas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (unidadeId: unknown) => {
    router.push(`/unidades/editar/${unidadeId}`);
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">Unidades de Saúde</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unidades.length === 0 ? (
            <p>Carregando unidades...</p>
          ) : (
            unidades.map((unidade) => (
              <div key={unidade.id} className="rounded-lg border p-4 shadow-lg">
                <h2 className="text-xl font-semibold">{unidade.nome}</h2>
                <p className="text-gray-600">{unidade.tipo}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {profissionaisPorUnidade[unidade.id] || 0} Profissionais
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    {consultasPorUnidade[unidade.id] || 0} Consultas
                  </span>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => handleEdit(unidade.id)}
                    className="rounded bg-blue-500 px-4 py-2 text-white"
                  >
                    Editar
                  </button>
                  <button
                    disabled
                    className="cursor-not-allowed rounded bg-red-500 px-4 py-2 text-white opacity-50"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UnidadesPage;
