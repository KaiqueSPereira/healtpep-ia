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
  data: string;
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
  endereco: string;
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

// Atualize o tipo Exame para incluir esses relacionamentos:
export type Exame = {
  id: string;
  nome: string;
  dataExame: string;
  anotacao?: string;
  nomeArquivo?: string;
  resultados?: any[]; // ou defina tipo específico se souber a estrutura
  profissional?: {
    id: string;
    nome: string;
  };
  unidades?: {
    id: string;
    nome: string;
  };
  consulta?: {
    id: string;
    data: string;
    tipo: string;
    queixas?: string;
    profissional?: {
      nome: string;
    };
    unidade?: {
      nome: string;
    };
  };
};
