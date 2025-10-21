import { 
    Medicamento as PrismaMedicamento, 
    CondicaoSaude as PrismaCondicaoSaude, 
    Profissional as PrismaProfissional, 
    UnidadeDeSaude as PrismaUnidade, 
    Consultas as PrismaConsulta,
    Exame as PrismaExame,
    ResultadoExame as PrismaResultadoExame,
    Endereco as PrismaEndereco,
    User as PrismaUsuario // Added Usuario
} from '@prisma/client';

// --- Base Entity Types ---

export type Endereco = PrismaEndereco;
export type Usuario = PrismaUsuario; // Exporting base user type

export type Unidade = PrismaUnidade & {
    endereco?: Endereco;
};

// CORRECTED: Profissional type now includes relations for consultas, exames, and condicoesSaude.
export type Profissional = PrismaProfissional & {
  unidades?: Unidade[];
  consultas?: Consulta[];
  exames?: Exame[];
  condicoesSaude?: CondicaoSaude[];
};

export type CondicaoSaude = PrismaCondicaoSaude & {
  profissional?: Profissional | null;
};

export type Consulta = Omit<PrismaConsulta, 'data'> & {
  data: Date;
  profissional?: Profissional | null;
  unidade?: Unidade | null;
  condicaoSaude?: CondicaoSaude | null;
};

export type ResultadoExame = PrismaResultadoExame;

// CORRECTED: Exame type now includes the 'usuario' relation.
export type Exame = PrismaExame & {
  resultados?: ResultadoExame[];
  profissional?: Profissional | null;
  unidades?: Unidade | null; 
  consulta?: Consulta | null;
  condicaoSaude?: CondicaoSaude | null;
  usuario?: Usuario | null; // Added relation to user
};

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
