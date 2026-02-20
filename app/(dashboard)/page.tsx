"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import useAuthStore from "../_stores/authStore";
import Searchbar from "../_components/searchbar";
import NovaConsulta from "./consulta/components/novaconsulta";
import AgendamentosList from "./consulta/components/agendamentolist";
import { Loader2 } from "lucide-react";
import ExameResultCard from "../_components/ExameResultCard";
import TratamentoResultCard from "../_components/TratamentoResultCard";
import ConsultaResultCard from "../_components/consultaResultCard";
import ExamesList from "./exames/components/ExamesList";

// Interfaces for search results
interface ConsultaResult {
  id: string;
  tipo: string;
  profissionalNome: string;
  data: string;
  unidadeNome?: string;
}

interface TratamentoResult {
  id: string;
  nome: string;
  consultas?: ConsultaResult[];
  exames?: ExameResult[];
}

interface ExameResult {
  id: string;
  tipo: string;
  profissionalNome?: string;
  data: string;
  unidadeNome?: string;
  tratamentoNome?: string;
}

interface SearchResults {
  consultas: ConsultaResult[];
  tratamentos: TratamentoResult[];
  exames: ExameResult[];
}

const Home = () => {
  const { session, status } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [formattedDate, setFormattedDate] = useState(""); // State for the date

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  // Set the date only on the client-side after hydration
  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults(null);
      return;
    }
    setLoadingSearch(true);

    try {
      const [consultasRes, tratamentosRes, examesRes] = await Promise.all([
        fetch(`/api/search/consultas?term=${encodeURIComponent(term)}`),
        fetch(`/api/search/tratamentos?term=${encodeURIComponent(term)}`),
        fetch(`/api/search/exames?term=${encodeURIComponent(term)}`),
      ]);

      const [consultasData, tratamentosData, examesData] = await Promise.all([
        consultasRes.json(),
        tratamentosRes.json(),
        examesRes.json(),
      ]);

      setSearchResults({
        consultas: consultasData,
        tratamentos: tratamentosData,
        exames: examesData,
      });

    } catch (error) {
      console.error("Error during search:", error);
      setSearchResults({ consultas: [], tratamentos: [], exames: [] });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
  };

  if (status === "loading") {
    // We use the new global loading component, but this can be a fallback
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!session || !session.user?.id) {
     return null;
  }

  const hasSearchResults = searchResults && (searchResults.consultas.length > 0 || searchResults.tratamentos.length > 0 || searchResults.exames.length > 0);

  return (
    <div className="h-full overflow-y-auto"> {/* <-- AQUI ESTÁ A CORREÇÃO */}
      <div className="p-5">
        <h2 className="text-2xl font-bold">Olá, {session.user.name}</h2>
        <p>{formattedDate}</p>
        <div className="mt-6">
          <Searchbar onSearch={handleSearch} searchTerm={searchTerm} onClear={handleClearSearch} />
        </div>

        {loadingSearch ? (
           <div className="flex items-center justify-center py-10">
             <Loader2 className="h-8 w-8 animate-spin" />
           </div>
        ) : hasSearchResults ? (
          <div className="mt-5">
            <h3 className="text-xl font-bold mb-4">Resultados da Busca:</h3>

            {searchResults.tratamentos.length > 0 && (
                 <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Tratamentos Encontrados:</h4>
                     {searchResults.tratamentos.map(tratamento => (
                         <div key={tratamento.id} className="mb-8 p-4 border rounded-md">
                              <TratamentoResultCard tratamento={tratamento} />

                             {tratamento.consultas && tratamento.consultas.length > 0 && (
                                  <div className="mt-4">
                                      <h5 className="text-md font-semibold mb-2">Consultas Relacionadas:</h5>
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                           {tratamento.consultas.map(consulta => (
                                                <ConsultaResultCard key={consulta.id} consulta={consulta} />
                                           ))}
                                       </div>
                                   </div>
                             )}

                             {tratamento.exames && tratamento.exames.length > 0 && (
                                  <div className="mt-4">
                                      <h5 className="text-md font-semibold mb-2">Exames Relacionados:</h5>
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                           {tratamento.exames.map(exame => (
                                               <ExameResultCard key={exame.id} exame={exame} />
                                           ))}
                                       </div>
                                   </div>
                             )}
                         </div>
                     ))}
                 </div>
            )}

             {searchResults.consultas.length > 0 && (
                 <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Outras Consultas:</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {searchResults.consultas.map(consulta => (
                             <ConsultaResultCard key={consulta.id} consulta={consulta} />
                         ))}
                     </div>
                 </div>
             )}

             {searchResults.exames.length > 0 && (
                 <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">Outros Exames:</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {searchResults.exames.map(exame => (
                              <ExameResultCard key={exame.id} exame={exame} />
                         ))}
                     </div>
                 </div>
             )}

            {!hasSearchResults && searchTerm && !loadingSearch && (
                <p>Nenhum resultado encontrado para &quot;{searchTerm}&quot;.</p>
            )}

          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-row items-center gap-5">
              <NovaConsulta />
            </div>
            <div>
              <AgendamentosList userId={session.user.id} />
            </div>
            <div>
             <ExamesList userId={session.user.id} />
             </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
