"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
 // Assuming you have this component
import ExamChart from "../_components/ExamChart"; // Import the ExamChart component
import Header from "../_components/header";
import ExameItem from "../_components/ExameItem";
import Footer from "../_components/footer";

interface Exame {
  id: string;
  nome: string;
  dataExame: Date;
  resultados: Record<string, number | string>; // Adjust the type according to your data structure
  tipo: string;
  data: Date;
  profissional: string;
}

const ListaExames = () => {
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    const fetchExames = async () => {
      try {
        const response = await fetch(`/api/exames/user/${session.user.id}`); // Replace with your actual endpoint
        if (!response.ok) {
          throw new Error(`Failed to fetch exames: ${response.status}`);
        }
        const data = await response.json();
        setExames(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching exames:", err);
          setError(err.message || "Ocorreu um erro ao carregar os exames.");
        } else {
          console.error("Unexpected error:", err);
          setError("Ocorreu um erro desconhecido ao carregar os exames.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExames();
  }, [session, status, router]);

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <h1 className="mb-6 text-3xl font-bold">Meus Exames</h1>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && (
          <div>
            {/* Display the chart above the list */}
            {exames.length > 0 ? (
              <ExamChart examData={exames} />
            ) : (
              <p>No exams found.</p>
            )}

            {exames.length > 0 && (
              <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exames.map((exame, index) => (
                  <li key={index}>
                    <ExameItem exame={exame} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ListaExames;
