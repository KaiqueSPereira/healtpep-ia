import { Exame, Profissional, Unidade } from "@/app/_components/types"; 
import { AnexoConsulta, CondicaoSaude } from "@prisma/client";


export interface Anotacao {
    id: string;
    anotacao: string;
    createdAt: Date;
}

export type { Exame };

export type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: Unidade | null;
};

export interface ConsultaRelacionada {
    id: string;
    data: string;
    tipo: string;
    userId: string; 
    motivo?: string | null;
    Anotacoes?: Anotacao[];
    anexos?: AnexoConsulta[]; 
    Exame?: ExameComRelacoes[];
    // CORRIGIDO: Usando o tipo completo
    profissional?: Profissional | null;
    unidade?: Unidade | null;
}

// Novo tipo para os itens da linha do tempo do tratamento
export interface HistoricoTratamentoItem {
    id: string;
    data: string;
    tipo: string;
    motivo: string | null;
    // CORRIGIDO: Usando o tipo completo
    profissional: Profissional | null;
    unidade: Unidade | null;
}

export interface ConsultaData {
    id: string;
    userId: string;
    tipo: string;
    data: string;
    motivo: string | null;
    unidade: Unidade | null;
    profissional: Profissional | null;
    Anotacoes: Anotacao[];
    Exame: ExameComRelacoes[]; 
    condicaoSaude: CondicaoSaude | null;
    anexos: AnexoConsulta[]; 
    consultaOrigem?: ConsultaRelacionada | null;
    consultasDeRetorno?: ConsultaRelacionada[];
    // CORRIGIDO: Usando o tipo completo e garantindo que não seja nulo onde esperado
    historicoTratamento?: HistoricoTratamentoItem[] | null;
}