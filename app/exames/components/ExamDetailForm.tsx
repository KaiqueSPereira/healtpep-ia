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

    // NOVOS PROPS PARA HORA
    horaExame: string;
    onHoraExameChange: (hora: string) => void;

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
    horaExame, onHoraExameChange, // Adicionado
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

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <Label>Consulta</Label>
                <MenuConsultas
                    userId={session?.user?.id || ''}
                    selectedConsulta={selectedConsulta}
                    onConsultaSelect={(consulta) => {
                        onConsultaSelect(consulta);
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

            {!selectedConsulta && (
              <>
                <div>
                  <Label>Unidade</Label>
                  <MenuUnidades
                    key={`unidade-selector-${selectorsKey}`}
                    unidades={unidadesList}
                    selectedUnidade={selectedUnidade} 
                    onUnidadeSelect={onUnidadeSelect}
                  />
                </div>
                <div>
                  <Label>Profissional</Label>
                  <MenuProfissionais
                     key={`profissional-selector-${selectorsKey}`}
                    profissionais={profissionais}
                    selectedProfissional={selectedProfissional}
                    onProfissionalSelect={onProfissionalSelect}
                    unidadeId={selectedUnidade?.id}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Tratamento</Label>
              <MenuTratamentos
                 key={`tratamento-selector-${selectorsKey}`}
                tratamentos={tratamentos}
                selectedTratamento={selectedTratamento}
                onTratamentoSelect={onTratamentoSelect}
              />
            </div>

            {/* ATUALIZAÇÃO: Campo de data e hora juntos */}
            <div>
              <Label>Data e Hora do Exame</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataExame}
                  onChange={(e) => onDataExameChange(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={horaExame}
                  onChange={(e) => onHoraExameChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>

            <div>
              <Label>Tipo de Exame</Label>
              <Select value={tipo} onValueChange={onTipoChange}>
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
