// app/exames/components/ExamDetailsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { Label } from "../../_components/ui/label";
import { Input } from "../../_components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../_components/ui/select";

import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";

import { Consulta, Profissional, Unidade, Tratamento } from "../../_components/types";
import { toast } from "../../_hooks/use-toast";


// Define the props for this component
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
    consultas, selectedConsulta, onConsultaSelect,
    selectedUnidade, onUnidadeSelect,
    profissionais, selectedProfissional, onProfissionalSelect,
    tratamentos, selectedTratamento, onTratamentoSelect,
    dataExame, onDataExameChange,
    tipo, onTipoChange,
    selectorsKey
}: ExamDetailsFormProps) {

    console.log("Value passed to MenuUnidades (selectedUnidade):", selectedUnidade); 
    console.log("Value passed to MenuProfissionais (selectedProfissional):", selectedProfissional);

     const { data: session } = useSession();
     const userId = session?.user?.id;


     // Fetch professionals based on selected unit - this logic can stay here
      useEffect(() => {
        if (!selectedUnidade?.id) {
          setProfissionais([]);
          return;
        }
        fetch(`/api/unidadesaude?id=${selectedUnidade.id}`)
          .then((r) => r.json())
           .then((d) => setProfissionais(d.profissionais || []))
           .catch(() =>
            toast({ title: "Erro ao buscar profissionais", variant: "destructive", duration: 5000 }),
           );
      }, [selectedUnidade]); // Dependency array


    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Move the JSX for the form fields here */}
            {/* Consultas Select */}
             <div>
                  <Label>Consulta</Label>
                  <Select
                    value={selectedConsulta?.id || "none"}
                    onValueChange={(id) => {
                      if (id === "none") {
                        onConsultaSelect(null);
                        onProfissionalSelect(null);
                        onUnidadeSelect(null);
                      } else {
                        const consulta = consultas.find((c) => c.id === id);
                        onConsultaSelect(consulta || null);
                        onProfissionalSelect(consulta?.profissional || null);
                        onUnidadeSelect(consulta?.unidade || null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedConsulta ? (
        
                        `${new Date(selectedConsulta.data).toLocaleDateString()} - ${selectedConsulta.profissional?.nome}`
                          ) : (
                            "Selecione uma consulta"
                          )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {consultas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {new Date(c.data).toLocaleDateString()} -{" "}
                          {c.profissional?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
             </div>

             {/* Unidade Select (conditionally rendered) */}
            {!selectedConsulta && (
              <>
                <div>
                  <Label>Unidade</Label>
                  <MenuUnidades
                     key={`unidade-selector-${selectorsKey}`}
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
