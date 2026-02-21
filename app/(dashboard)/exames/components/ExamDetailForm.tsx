'use client';

import { Label } from "../../../_components/ui/label";
import { Input } from "../../../_components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../_components/ui/select";
import MenuUnidades from "../../unidades/_components/menuunidades";
import MenuProfissionais from "../../profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/(dashboard)/consulta/components/menuconsultas";
import MenuCondicoes from "@/app/(dashboard)/condicoes/_Components/MenuCondicoes";

import type { Consulta, Profissional, CondicaoSaude } from "@/app/_components/types";
import { UnidadeDeSaude } from "@prisma/client";

interface ExamDetailsFormProps {
    consultas: Consulta[];
    selectedConsulta: Consulta | null;
    onConsultaSelect: (consulta: Consulta | null) => void;

    unidades: UnidadeDeSaude[];
    selectedUnidade: UnidadeDeSaude | null;
    onUnidadeSelect: (unidade: UnidadeDeSaude | null) => void;

    profissionais: Profissional[];
    selectedProfissional: Profissional | null;
    onProfissionalSelect: (profissional: Profissional | null) => void;
    selectedProfissionalExecutante: Profissional | null;
    onProfissionalExecutanteSelect: (profissional: Profissional | null) => void;

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
    consultas,
    selectedConsulta, onConsultaSelect,
    unidades,
    selectedUnidade, onUnidadeSelect,
    profissionais, selectedProfissional, onProfissionalSelect,
    selectedProfissionalExecutante, onProfissionalExecutanteSelect,
    condicoesSaude, selectedCondicao, onCondicaoChange,
    dataExame, onDataExameChange,
    horaExame, onHoraExameChange,
    tipo, onTipoChange,
    selectorsKey
}: ExamDetailsFormProps) {

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <Label>Consulta Associada</Label>
                <MenuConsultas
                    key={`consulta-selector-${selectorsKey}`}
                    consultas={consultas}
                    selectedConsulta={selectedConsulta}
                    onConsultaSelect={onConsultaSelect}
                />
            </div>

            <div>
              <Label>Condição de Saúde</Label>
              <MenuCondicoes
                 key={`condicao-selector-${selectorsKey}`}
                condicoes={condicoesSaude}
                selectedCondicao={selectedCondicao}
                onCondicaoSelect={onCondicaoChange}
              />
            </div>

            <div>
              <Label>Unidade de Saúde</Label>
              <MenuUnidades
                key={`unidade-selector-${selectorsKey}`}
                unidades={unidades}
                selectedUnidade={selectedUnidade}
                onUnidadeSelect={onUnidadeSelect}
              />
            </div>
            <div>
              <Label>Profissional Solicitante</Label>
              <MenuProfissionais
                key={`profissional-selector-${selectorsKey}`}
                profissionais={profissionais}
                selectedProfissional={selectedProfissional}
                onProfissionalSelect={onProfissionalSelect}
                unidadeId={selectedUnidade?.id}
              />
            </div>

            <div>
              <Label>Profissional Executante</Label>
              <MenuProfissionais
                key={`profissional-executante-selector-${selectorsKey}`}
                profissionais={profissionais}
                selectedProfissional={selectedProfissionalExecutante}
                onProfissionalSelect={onProfissionalExecutanteSelect}
                unidadeId={selectedUnidade?.id}
              />
            </div>

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
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
    );
}
