'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../_components/ui/dialog";
import { Label } from "../_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../_components/ui/select";
import { Loader2 } from "lucide-react";
import Header from "../_components/header";
import Link from "next/link";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades: { id: string; nome: string }[];
}

const ProfissionaisPage = () => {
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");

  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const response = await fetch("/api/profissionais");
        const data = await response.json();
        setProfissionais(data);
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfissionais();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/profissionais/${id}`, { method: "DELETE" });
      setProfissionais(profissionais.filter((p) => p.id !== id));
      setSelectedProfissional(null);
    } catch (error) {
      console.error("Erro ao deletar profissional:", error);
    }
  };

  const filteredAndSortedProfissionais = useMemo(() => {
    let filtered = profissionais;
    if (filterSpecialty && filterSpecialty !== "all") {
      filtered = profissionais.filter(
        (profissional) => profissional.especialidade === filterSpecialty
      );
    }

    return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [profissionais, filterSpecialty]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = profissionais.map(p => p.especialidade).filter(Boolean);
    return Array.from(new Set(specialties)).sort();
  }, [profissionais]);


  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <Button asChild>
            <Link href="/profissionais/novo">Adicionar Profissional</Link>
          </Button>
        </div>

        <div className="mb-6">
            <Label htmlFor="specialtyFilter" className="mr-2">Filtrar por Especialidade:</Label>
            <Select onValueChange={setFilterSpecialty} value={filterSpecialty}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas as Especialidades" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Especialidades</SelectItem>
                    {uniqueSpecialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>


        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredAndSortedProfissionais.map((profissional) => (
              <li
                key={profissional.id}
                className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/profissionais/${profissional.id}`)}
              >
                <div>
                  <p className="font-semibold text-red-600">{profissional.nome}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profissional.especialidade}</p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/profissionais/${profissional.id}/editar`} passHref>
                    <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                      Editar
                    </Button>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfissional(profissional);
                        }}
                      >
                        Apagar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <p>
                        Tem certeza que deseja apagar{" "}
                        {selectedProfissional?.nome}?
                      </p>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedProfissional(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            selectedProfissional &&
                            handleDelete(selectedProfissional.id)
                          }
                        >
                          Confirmar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfissionaisPage;
