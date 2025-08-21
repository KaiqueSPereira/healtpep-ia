// app/exames/components/ExamDetailsForm.tsx
"use client";

import { Label } from "../../_components/ui/label";
import { Input } from "../../_components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../_components/ui/select";
import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";
import { Consulta, Profissional, Unidade, Tratamento } from "../../_components/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "@/app/_hooks/use-toast";



interface ExamDetailsFormProps {
    consultas: Consulta[];
    selectedConsulta: Consulta | null;
    onConsultaSelect: (consulta: Consulta | null) => void;

    selectedUnidade: Unidade | null;
    onUnidadeSelect: (unidade: Unidade | null) => void;

    profissionais: Profissional[];
    selectedProfissional: Profissional | null;
    onProfissionalSelect: (profissional: Profissional | null) => void;

    tratamentos: Tratamento[];
    selectedTratamento: Tratamento | null;
    onTratamentoSelect: (tratamento: Tratamento | null) => void;

    dataExame: string;
    onDataExameChange: (data: string) => void;

    tipo: string;
    onTipoChange: (tipo: string) => void;

    selectorsKey: number;
}


export function ExamDetailsForm({
    selectedConsulta, onConsultaSelect,
    selectedUnidade, onUnidadeSelect,
    profissionais, selectedProfissional, onProfissionalSelect,
    tratamentos, selectedTratamento, onTratamentoSelect,
    dataExame, onDataExameChange,
    tipo, onTipoChange,
    selectorsKey
}: ExamDetailsFormProps) {
    const { data: session } = useSession();
    const [unidadesList, setUnidadesList] = useState<Unidade[]>([]);

    useEffect(() => {
        const fetchUnidades = async () => {
            if (!session?.user?.id) return;

            try {
                const response = await fetch(`/api/unidadesaude?userId=${session.user.id}`);
                if (!response.ok) {
                    throw new Error("Erro ao buscar unidades");
                }
                const data = await response.json();
                setUnidadesList(data || []);
            } catch (error) {
                console.error("Erro ao buscar unidades:", error);
                toast({
                    title: "Erro ao carregar unidades.",
                    variant: "destructive",
                    duration: 5000,
                });
            }
        };
        fetchUnidades();
    }, [session?.user?.id]);

    console.log("Value passed to MenuUnidades (selectedUnidade):", selectedUnidade); 
    console.log("Value passed to MenuProfissionais (selectedProfissional):", selectedProfissional);


    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Move the JSX for the form fields here */}
            {/* Consultas Select */}
            <div>
                <Label>Consulta</Label>
                <MenuConsultas
                    userId={session?.user?.id || ''} // Pass the user ID
                    selectedConsulta={selectedConsulta}
                    onConsultaSelect={(consulta) => {
                        onConsultaSelect(consulta);
                        // Also set professional and unit when a consulta is selected
                        if (consulta) {
                            onProfissionalSelect(consulta.profissional || null);
                            onUnidadeSelect(consulta.unidade || null);
                        } else {
                            onProfissionalSelect(null);
                            onUnidadeSelect(null);
                        }
                    }}
                />
            </div>

             {/* Unidade Select (conditionally rendered) */}
            {!selectedConsulta && (
              <>
                <div>
                  <Label>Unidade</Label>
                  <MenuUnidades // Pass the fetched units list
                    key={`unidade-selector-${selectorsKey}`}
                    unidades={unidadesList}
                    selectedUnidade={selectedUnidade} 
                    onUnidadeSelect={onUnidadeSelect}
                  />
                </div>
                {/* Profissional Select */}
                <div>
                  <Label>Profissional</Label>
                  <MenuProfissionais
                     key={`profissional-selector-${selectorsKey}`}
                    profissionais={profissionais} // Passed down from parent
                    selectedProfissional={selectedProfissional} // Passed down from parent
                    onProfissionalSelect={onProfissionalSelect} // Call parent handler
                    unidadeId={selectedUnidade?.id} // Passed down from parent
                  />
                </div>
              </>
            )}

             {/* Tratamento Select */}
            <div>
              <Label>Tratamento</Label>
              <MenuTratamentos
                 key={`tratamento-selector-${selectorsKey}`}
                tratamentos={tratamentos} // Passed down from parent
                selectedTratamento={selectedTratamento} // Passed down from parent
                onTratamentoSelect={onTratamentoSelect} // Call parent handler
              />
            </div>

             {/* Data do Exame Input */}
            <div>
              <Label>Data do Exame</Label>
              <Input
                type="date"
                value={dataExame} // Passed down from parent
                onChange={(e) => onDataExameChange(e.target.value)} // Call parent handler
              />
            </div>

             {/* Tipo de Exame Select */}
            <div>
              <Label>Tipo de Exame</Label>
              <Select value={tipo} onValueChange={onTipoChange}> {/* Call parent handler */}
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de exame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sangue">Sangue</SelectItem>
                  <SelectItem value="Urina">Urina</SelectItem>
                  <SelectItem value="USG">USG</SelectItem>
                  <SelectItem value="Raio-X">Raio-X</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
    );
}
