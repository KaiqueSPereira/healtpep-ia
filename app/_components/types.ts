import { 
    Medicamento as PrismaMedicamento, 
    CondicaoSaude as PrismaCondicaoSaude, 
    Profissional as PrismaProfissional, 
    UnidadeDeSaude as PrismaUnidade, 
    Consultas as PrismaConsulta,
    Exame as PrismaExame,
    ResultadoExame as PrismaResultadoExame,
    Endereco as PrismaEndereco,
    User as PrismaUsuario
} from '@prisma/client';

// --- Base Entity Types ---

export type Endereco = PrismaEndereco;
export type Usuario = PrismaUsuario;

export type Unidade = PrismaUnidade & {
    endereco?: Endereco;
};

export type Profissional = PrismaProfissional & {
  unidades?: Unidade[];
  consultas?: Consulta[];
  exames?: Exame[];
  condicoesSaude?: CondicaoSaude[];
};

export type CondicaoSaude = PrismaCondicaoSaude & {
  profissional?: Profissional | null;
};

// CORREÇÃO: O campo 'data' agora aceita string ou Date.
export type Consulta = Omit<PrismaConsulta, 'data'> & {
  data: Date | string; // Permite que a data seja string (do JSON) ou Date
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
  usuario?: Usuario | null;
};

export type MedicamentoComRelacoes = PrismaMedicamento & {
    dosagem?: string | null; // Adicionado
    quantidadePorDose?: number | null; // Adicionado
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
