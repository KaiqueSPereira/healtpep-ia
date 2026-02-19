"use client"
import React, { useState } from 'react';
import { Consultatype } from "@prisma/client";

// Interface para o modelo Anotacoes (descriptografado)
// Usando o nome do modelo no schema: Anotaçoes
export interface Anotaçoes {
  id: string;
  consultaId: string;
  anotacao: string; // Descriptografado
  createdAt: Date;
  updatedAt: Date;
}

interface Tratamento {
    id: string;
    nome: string;
}

interface ProfissionalCompleto {
    id: string;
    nome: string;
    especialidade: string;
    NumClasse: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UnidadeDeSaudeCompleta {
    id: string;
    nome: string;
    tipo: string | null;
    enderecoId: string | null;
    createdAt: Date;
    updatedAt: Date;
}


export interface ConsultaDiarioProps {
  consulta: {
    id: string;
    data: Date;
    motivo: string | null;
    tipodeexame: string | null;
    tipo: Consultatype;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    usuario: { name: string | null; email: string };
    profissional: ProfissionalCompleto | null;
    unidade: UnidadeDeSaudeCompleta | null;
    Anotaçoes: Anotaçoes[]; // Usando 'Anotaçoes' (com 'ç') na interface
    Tratamento: Tratamento[];
  };
   onNovaAnotacao: (consultaId: string, anotacao: string) => Promise<void>;
}


const ConsultaDiarioItem: React.FC<ConsultaDiarioProps> = ({ consulta, onNovaAnotacao }) => {
  const [novaAnotacaoText, setNovaAnotacaoText] = useState('');
  const [mostrarAdicionarAnotacao, setMostrarAdicionarAnotacao] = useState(false);

  const handleSalvarAnotacao = async () => {
    if (!novaAnotacaoText.trim()) {
      return;
    }
    await onNovaAnotacao(consulta.id, novaAnotacaoText);
    setNovaAnotacaoText('');
    setMostrarAdicionarAnotacao(false);
  };


  return (
    <div className="border p-4 rounded shadow-sm">
      <h3 className="text-lg font-semibold">{consulta.tipo}</h3>
      <p>Data: {new Date(consulta.data).toLocaleDateString()} {new Date(consulta.data).toLocaleTimeString()}</p>
      {consulta.profissional && <p>Profissional: {consulta.profissional.nome}</p>}
      {consulta.unidade && <p>Unidade: {consulta.unidade.nome}</p>}
      {consulta.motivo && <p>Motivo: {consulta.motivo}</p>}
      {consulta.tipodeexame && <p>Tipo de Exame: {consulta.tipodeexame}</p>}

      <div className="mt-4">
        <h4 className="text-md font-medium">Anotações:</h4>
        {/* Acessando a relação usando 'Anotaçoes' (com 'ç') */}
        {consulta.Anotaçoes.length > 0 ? (
          <ul>
            {consulta.Anotaçoes.map((anotacao) => (
              <li key={anotacao.id} className="border-b last:border-b-0 py-2">
                <p>{anotacao.anotacao}</p>
                <p className="text-xs text-gray-500">Adicionado em: {new Date(anotacao.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma anotação ainda.</p>
        )}
      </div>

       <div className="mt-4">
        <h4 className="text-md font-medium">Tratamentos Associados:</h4>
        {consulta.Tratamento.length > 0 ? (
          <ul>
            {consulta.Tratamento.map((tratamento) => (
              <li key={tratamento.id} className="border-b last:border-b-0 py-2">
                <p>{tratamento.nome}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum tratamento associado.</p>
        )}
      </div>


      <div className="mt-4">
        <button
          className="text-blue-500 hover:underline"
          onClick={() => setMostrarAdicionarAnotacao(!mostrarAdicionarAnotacao)}
        >
          {mostrarAdicionarAnotacao ? 'Cancelar' : 'Adicionar Anotação'}
        </button>

        {mostrarAdicionarAnotacao && (
          <div className="mt-2">
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Digite sua nova anotação aqui..."
              value={novaAnotacaoText}
              onChange={(e) => setNovaAnotacaoText(e.target.value)}
            ></textarea>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSalvarAnotacao}
            >
              Salvar Anotação
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaDiarioItem;
