
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // Usamos a versão de promessas do fs

// Interface para garantir a tipagem dos nossos dados do CID
interface CidEntry {
  codigo: string;
  descricao: string;
}

// Caminho para o nosso arquivo de dados JSON local e otimizado
// Usamos process.cwd() para garantir que o caminho seja sempre relativo à raiz do projeto
const jsonPath = path.join(process.cwd(), 'app', '_lib', 'cid10-data.json');

// Carregamos os dados uma única vez quando o módulo é iniciado.
// Isso evita ler o arquivo do disco em cada requisição, tornando a API muito mais rápida.
let cidData: CidEntry[] = [];
const loadCidData = fs.readFile(jsonPath, 'utf-8')
  .then(data => {
    cidData = JSON.parse(data);
    console.log(`Dados do CID-10 carregados com sucesso. ${cidData.length} entradas prontas para busca.`);
  })
  .catch(err => {
    console.error("ERRO CRÍTICO AO CARREGAR CID-10 DATA:", err);
    // Se não conseguirmos carregar os dados, a API não pode funcionar.
    // Mantemos cidData como um array vazio.
  });

export async function GET(request: Request) {
  // Garantimos que os dados foram carregados antes de responder a qualquer requisição.
  await loadCidData;

  // Se, por algum motivo, o carregamento dos dados falhou, retornamos um erro de servidor.
  if (cidData.length === 0) {
    return NextResponse.json(
      { error: 'Os dados do CID-10 não puderam ser carregados no servidor.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('term')?.trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ error: 'O parâmetro de busca "term" é obrigatório' }, { status: 400 });
  }

  try {
    // Filtra os dados em memória.
    // A busca é feita no código e na descrição, ignorando maiúsculas/minúsculas.
    const results = cidData.filter(item => 
      item.codigo.toLowerCase().includes(query) || 
      item.descricao.toLowerCase().includes(query)
    );

    // Retorna apenas os primeiros 50 resultados para não sobrecarregar o frontend.
    const limitedResults = results.slice(0, 50);

    return NextResponse.json(limitedResults);

  } catch {
    console.error('Erro durante a busca no arquivo CID:');
    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao processar a busca.' },
      { status: 500 }
    );
  }
}
