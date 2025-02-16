
export interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  endereco: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  NumClasse: string;
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