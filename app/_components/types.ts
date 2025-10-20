
import { 
    Medicamento as PrismaMedicamento, 
    CondicaoSaude as PrismaCondicaoSaude, 
    Profissional as PrismaProfissional, 
    UnidadeDeSaude as PrismaUnidade, 
    Consultas as PrismaConsulta,
    Exame as PrismaExame,
    ResultadoExame as PrismaResultadoExame,
    Endereco as PrismaEndereco
} from '@prisma/client';

// --- Base Entity Types ---

export type Endereco = PrismaEndereco;

export type Unidade = PrismaUnidade & {
    endereco?: Endereco;
};

export type Profissional = PrismaProfissional & {
  unidades?: Unidade[];
};

export type CondicaoSaude = PrismaCondicaoSaude & {
  profissional?: Profissional | null;
};

// CORRECTED: 'data' property is now a Date object, which was the source of many errors.
export type Consulta = Omit<PrismaConsulta, 'data'> & {
  data: Date;
  profissional?: Profissional | null;
  unidade?: Unidade | null;
  condicaoSaude?: CondicaoSaude | null;
};

export type ResultadoExame = PrismaResultadoExame;

export type Exame = PrismaExame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: Unidade | null; 
  consulta?: Consulta | null;
  condicaoSaude?: CondicaoSaude | null;
};

// CORRECTED: Includes the full 'condicaoSaude' relation to match API responses.
export type MedicamentoComRelacoes = PrismaMedicamento & {
    profissional: Profissional | null;
    consulta: Consulta | null;
    condicaoSaude: CondicaoSaude | null; 
};

// --- Auxiliary Types ---

export enum ConsultaType {
  Rotina = "Rotina",
  Exame = "Exame",
  Emergencia = "Emergencia",
  Retorno = "Retorno",
  Tratamento = "Tratamento",
}

export type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
    spanGaps: boolean;
    backgroundColor: string;
  }[];
};
