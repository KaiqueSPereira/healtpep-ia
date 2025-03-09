export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Unidade extends BaseEntity {
  nome: string;
  tipo: string;
  endereco: Endereco | null;
}

export interface Profissional extends BaseEntity {
  nome: string;
  especialidade: string;
  NumClasse: string;
  unidades: Unidade[];
  consultas?: Consulta[];
}

export enum ConsultaType {
  Rotina = "Rotina",
  Exame = "Exame",
  Emergencia = "Emergencia",
  Retorno = "Retorno",
  Tratamento = "Tratamento",
}

export interface Consulta extends BaseEntity {
  tipo: ConsultaType;
  data: Date | string;
  profissional?: { nome: string };
  unidade?: { nome: string };
  usuario: { nome: string };
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
