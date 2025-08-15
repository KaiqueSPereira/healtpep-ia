"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "./_components/header";
import Searchbar from "./_components/searchbar"; // Assuming this is the Search component
import NovaConsulta from "./consulta/components/novaconsulta";
import AgendamentosList from "./consulta/components/agendamentolist";
import { Loader2 } from "lucide-react";
import ExameResultCard from "./_components/ExameResultCard";
import TratamentoResultCard from "./_components/TratamentoResultCard";
import ConsultaResultCard from "./_components/consultaResultCard";
import ExamesList from "./exames/components/ExamesList";


// Define interfaces for search results (adjust based on your API response structure)
// Ensure these interfaces match the props expected by the new Card components
interface ConsultaResult {
  id: string;
  tipo: string;
  profissionalNome: string;
  data: string; // Assuming date is available and maybe formatted
  unidadeNome?: string; // Assuming unit name is available (optional)
}

interface TratamentoResult {
  id: string;
  nome: string;
  // Add other fields you want to display for treatments
  consultas?: ConsultaResult[]; // Added for nested related consultations
  exames?: ExameResult[]; // Added for nested related exams
}

interface ExameResult {
  id: string;
  tipo: string;
  profissionalNome?: string; // Optional
  data: string; // Assuming date is available and maybe formatted
  unidadeNome?: string; // Assuming unit name is available (optional)
  tratamentoNome?: string; // Assuming treatment name is available (optional)
}

interface SearchResults {
  consultas: ConsultaResult[];
  tratamentos: TratamentoResult[];
  exames: ExameResult[];
}


const Home = () => {
  const { data: session, status } = useSession();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);


  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults(null);
      return;
    }
    setLoadingSearch(true);

    try {
      // Note: We still call all three APIs, but the treatments API now includes nested data
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

       // Assuming tratamentosData might return an array of treatments, each with nested consultas and exames
       // We might need to flatten or restructure if the API returns differently
       // For now, assuming searchResults.tratamentos will hold the array from the API

      setSearchResults({
        consultas: consultasData,
        tratamentos: tratamentosData, // This now contains treatments with nested data
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
    return <p>Carregando...</p>;
  }

  if (!session || !session.user?.id) {
     return null;
  }

  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Check if there are any search results to display
  const hasSearchResults = searchResults && (searchResults.consultas.length > 0 || searchResults.tratamentos.length > 0 || searchResults.exames.length > 0);


  return (
    <div>
      <Header />
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
          // Display search results
          <div className="mt-5">
            <h3 className="text-xl font-bold mb-4">Resultados da Busca:</h3>

            {/* Display Treatments with nested Consultas and Exames */}
            {searchResults.tratamentos.length > 0 && (
                 <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Tratamentos Encontrados:</h4>
                     {searchResults.tratamentos.map(tratamento => (
                         <div key={tratamento.id} className="mb-8 p-4 border rounded-md"> {/* Container for each treatment group */}
                              <TratamentoResultCard tratamento={tratamento} /> {/* Display the treatment card */}

                             {/* Display related Consultas for this treatment */}
                             {tratamento.consultas && tratamento.consultas.length > 0 && (
                                  <div className="mt-4">
                                      <h5 className="text-md font-semibold mb-2">Consultas Relacionadas:</h5>
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                           {tratamento.consultas.map(consulta => (
                                               // Use ConsultaResultCard for related consultations
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
                                               // Use ExameResultCard for related exames
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
          // Display default components if no search results and no search term
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
