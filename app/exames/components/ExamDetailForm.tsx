// app/exames/components/ExamDetailForm.tsx
"use client";

import { Label } from "../../_components/ui/label";
import { Input } from "../../_components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../_components/ui/select";
import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import MenuCondicoes from "@/app/condicoes/_Components/MenuCondicoes";

// CORREÇÃO: Importa os tipos diretamente do Prisma Client, usando os nomes corretos do schema
import type { Consultas, Profissional, UnidadeDeSaude, CondicaoSaude } from "@prisma/client";
import { useSession } from "next-auth/react";

// CORREÇÃO: Atualiza a interface de props com os tipos corretos do Prisma
interface ExamDetailsFormProps {
    consultas: Consultas[];
    selectedConsulta: Consultas | null;
    onConsultaSelect: (consulta: Consultas | null) => void;

    unidades: UnidadeDeSaude[];
    selectedUnidade: UnidadeDeSaude | null;
    onUnidadeSelect: (unidade: UnidadeDeSaude | null) => void;

    profissionais: Profissional[];
    selectedProfissional: Profissional | null;
    onProfissionalSelect: (profissional: Profissional | null) => void;

    condicoesSaude: CondicaoSaude[];
    selectedCondicao: CondicaoSaude | null;
    onCondicaoChange: (condicao: CondicaoSaude | null) => void;

    dataExame: string;
    onDataExameChange: (data: string) => void;

    horaExame: string;
    onHoraExameChange: (hora: string) => void;

    tipo: string;
    onTipoChange: (tipo: string) => void;

    selectorsKey: number;
}

export function ExamDetailsForm({
    selectedConsulta, onConsultaSelect,
    unidades,
    selectedUnidade, onUnidadeSelect,
    profissionais, selectedProfissional, onProfissionalSelect,
    condicoesSaude, selectedCondicao, onCondicaoChange,
    dataExame, onDataExameChange,
    horaExame, onHoraExameChange,
    tipo, onTipoChange,
    selectorsKey
}: ExamDetailsFormProps) {
    const { data: session } = useSession();

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <Label>Consulta Associada (Opcional)</Label>
                <MenuConsultas
                    userId={session?.user?.id || ''}
                    selectedConsulta={selectedConsulta}
                    onConsultaSelect={(consulta) => {
                        onConsultaSelect(consulta);
                        if (consulta) {
                            // Ao selecionar uma consulta, popula automaticamente o profissional e a unidade
                            onProfissionalSelect(consulta.profissional || null);
                            onUnidadeSelect(consulta.unidade || null);
                        } else {
                            // Se a consulta for desmarcada, limpa os campos
                            onProfissionalSelect(null);
                            onUnidadeSelect(null);
                        }
                    }}
                />
            </div>

            <div>
              <Label>Condição de Saúde Associada (Opcional)</Label>
              <MenuCondicoes
                 key={`condicao-selector-${selectorsKey}`}
                condicoes={condicoesSaude}
                selectedCondicao={selectedCondicao}
                onCondicaoSelect={onCondicaoChange}
              />
            </div>

            <div>
              <Label>Unidade de Saúde *</Label>
              <MenuUnidades
                key={`unidade-selector-${selectorsKey}`}
                unidades={unidades}
                selectedUnidade={selectedUnidade}
                onUnidadeSelect={onUnidadeSelect}
                // Desabilita se uma consulta já determinou a unidade
                disabled={!!selectedConsulta?.unidadeId}
              />
            </div>
            <div>
              <Label>Profissional Solicitante *</Label>
              <MenuProfissionais
                key={`profissional-selector-${selectorsKey}`}
                profissionais={profissionais}
                selectedProfissional={selectedProfissional}
                onProfissionalSelect={onProfissionalSelect}
                unidadeId={selectedUnidade?.id}
                // Desabilita se uma consulta já determinou o profissional
                disabled={!!selectedConsulta?.profissionalId}
              />
            </div>

            <div>
              <Label>Data e Hora do Exame *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataExame}
                  onChange={(e) => onDataExameChange(e.target.value)}
                  className="flex-1"
                  required
                />
                <Input
                  type="time"
                  value={horaExame}
                  onChange={(e) => onHoraExameChange(e.target.value)}
                  className="w-auto"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Tipo de Exame *</Label>
              <Select value={tipo} onValueChange={onTipoChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de exame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sangue">Sangue</SelectItem>
                  <SelectItem value="Urina">Urina</SelectItem>
                  <SelectItem value="USG">USG</SelectItem>
                  <SelectItem value="Raio-X">Raio-X</SelectItem>
                  <SelectItem value="Tomografia">Tomografia</SelectItem>
                  <SelectItem value="Ressonancia">Ressonância Magnética</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
    );
}