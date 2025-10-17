import { NextResponse } from 'next/server';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * API Route para buscar efeitos colaterais (reações adversas) de um princípio ativo.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const principioAtivo = searchParams.get('principioAtivo');

  if (!principioAtivo) {
    return NextResponse.json({ error: 'Princípio ativo não fornecido.' }, { status: 400 });
  }

  try {
    // Formata a query: busca por documentos onde o `active_ingredient` corresponde
    // e o campo `adverse_reactions` existe.
    const query = `active_ingredient:"${principioAtivo}"`;
    const searchUrl = `${FDA_API_BASE_URL}?search=${query}+AND+_exists_:adverse_reactions`;

    const fdaResponse = await fetch(searchUrl);

    if (!fdaResponse.ok) {
      throw new Error(`Erro na API da FDA: ${fdaResponse.statusText}`);
    }

    const fdaData = await fdaResponse.json();

    if (fdaData.results && fdaData.results.length > 0) {
        // Pega as reações adversas do primeiro resultado encontrado.
        // O campo `adverse_reactions` é geralmente um array com um longo texto.
        const reactions = fdaData.results[0].adverse_reactions;
        return NextResponse.json({ adverse_reactions: reactions });
    } else {
        return NextResponse.json({ adverse_reactions: ["Nenhuma informação de efeito colateral encontrada para esta substância."] });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao buscar efeitos colaterais:", message);
    return NextResponse.json({ error: `Erro interno ao buscar efeitos colaterais: ${message}` }, { status: 500 });
  }
}
