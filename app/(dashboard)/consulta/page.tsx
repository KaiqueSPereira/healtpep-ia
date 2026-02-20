
import { Suspense } from "react";
import ConsultasList from "./components/ConsultasList";
import { fetchConsultas, fetchProfissionais, fetchTipos } from "@/app/lib/data";

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const [profissionais, tipos, consultaData] = await Promise.all([
    fetchProfissionais(),
    fetchTipos(),
    fetchConsultas({
      search: searchParams?.search,
      tipo: searchParams?.tipo,
      profissionalId: searchParams?.profissionalId,
      limit: 15,
    }),
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold">Consultas</h1>
      </div>

      <Suspense fallback={<p>Carregando...</p>}>
        <ConsultasList
          initialConsultas={consultaData.items}
          initialNextCursor={consultaData.nextCursor}
          profissionais={profissionais}
          tipos={tipos}
        />
      </Suspense>
    </div>
  );
}
