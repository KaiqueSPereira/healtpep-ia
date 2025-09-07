export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ConsultaType {
  Rotina = "Rotina",
  Exame = "Exame",
  Emergencia = "Emergencia",
  Retorno = "Retorno",
  Tratamento = "Tratamento",
}

export interface Endereco {
  id: string;
  nome: string;
  bairro: string;
}

export interface Tratamento {
  id: string;
  nome: string;
  profissionalId: string;
  userId: string;
}

export interface Agendamento {
  id: string;
  tipo: string;
  data: Date;
  profissional?: { nome: string };
  unidade?: { nome: string };
}

export interface AgendamentoItemProps {
  consultas: Agendamento;
  profissional: string;
  unidade: string;
}

export interface MenuUnidadesProps {
  selected: Unidade | null;
  onSelect: (unidade: Unidade | null) => void;
}

export type Unidade = {
  id: string;
  nome: string;
  tipo: string;
  telefone?: string;
  userId: string;
  endereco: {
    nome: string;
  };
};

export type Profissional = {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades: Unidade[];
};

export type Consulta = {
  id: string;
  data: string;
  profissional?: Profissional | null;
  tipo: ConsultaType;
  tipodeexame?: string;
  queixas?: string;
  unidade?: Unidade | null;
};
export interface TabelaExamesProps {
  exames: {
    nome: string;
    valor: string;
    unidade: string;
    ValorReferencia: string;
    outraUnidade: string;
  }[];
  onChange: React.Dispatch<
    React.SetStateAction<
      {
        nome: string;
        valor: string;
        unidade: string;
        ValorReferencia: string;
        outraUnidade: string;
      }[]
    >
  >;
}

export type ResultadoExame = {
  id: string; // Adicionado id
  nome: string;
  valor: string;
  unidade: string;
  referencia?: string; // Corrigido para 'referencia'
  outraUnidade?: string;
};

export type Exame = {
  id: string;
  nome: string;
  dataExame: Date;
  anotacao?: string;
  nomeArquivo?: string;
  tipo?: string;
  resultados?: ResultadoExame[];
  profissional?: Profissional;
  unidades?: Unidade;
  consulta?: {
    id: string;
    data: string;
    tipo: ConsultaType;
    queixas?: string;
    profissional?: {
      nome: string;
    };
    unidade?: {
      nome: string;
    };
  };
};

export type ApiExameResult = {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
};

export interface AnaliseApiResponse {
  resultados?: ApiExameResult[];
  anotacao?: string;
}

export type ExameCompleto = { 
  id: string;
  nome: string;
  dataExame: string;
  anotacao?: string;
  nomeArquivo?: string;
  profissional?: Profissional;
  unidades?: Unidade;
  resultados?: ResultadoExame[];
  tratamento?: Tratamento;
  consulta?: Consulta;
  tipo?: string;
};
export interface ExameLineChartProps {
  data: {
    labels: string[]; // Datas dos exames
    datasets: {
      label: string; // Nome do resultado (ex: "Glicose")
      data: number[]; // Valores do resultado - AQUI ESTÁ O CONFLITO
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  title: string; // Título do gráfico
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
}

export type Resultado = {
  nome: string;
  valor: string;
  unidade?: string;
  referencia?: string;
};

export type ExameGraficos = { 
  id: string;
  nome: string;
  dataExame: string;
  anotacao?: string;
  nomeArquivo?: string;
  tipo?: string;
  resultados?: Resultado[];
};