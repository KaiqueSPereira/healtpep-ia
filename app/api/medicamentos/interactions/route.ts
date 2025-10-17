import { NextResponse } from 'next/server';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * API Route para verificar interações medicamentosas usando a API da OpenFDA.
 * Recebe uma lista de princípios ativos e retorna possíveis interações.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { principiosAtivos } = body;

  if (!principiosAtivos || !Array.isArray(principiosAtivos) || principiosAtivos.length < 2) {
    // Retorna um array vazio se não houver pelo menos dois medicamentos para comparar
    return NextResponse.json({ interactions: [] });
  }

  try {
    // A API da OpenFDA permite buscar interações para um medicamento de cada vez.
    // Vamos verificar as interações de cada medicamento contra a lista dos outros.
    // O endpoint de `drug-interactions` está no campo `drug_interactions` do label.

    // Formata a query: busca por documentos onde o `active_ingredient` é um dos medicamentos da lista
    // E o campo `drug_interactions` existe.
    const query = principiosAtivos.map(pa => `"${pa}"`).join('+');
    const searchUrl = `${FDA_API_BASE_URL}?search=active_ingredient:(${query})+AND+_exists_:drug_interactions`;

    const fdaResponse = await fetch(searchUrl, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!fdaResponse.ok) {
      throw new Error(`Erro na API da FDA: ${fdaResponse.statusText}`);
    }

    const fdaData = await fdaResponse.json();

    let interactions: { drug: string, interaction: string }[] = [];

    if(fdaData.results) {
        fdaData.results.forEach((result: any) => {
            const drugName = result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || 'Desconhecido';
            
            if (result.drug_interactions && result.drug_interactions.length > 0) {
                // Simplificando: retornamos o primeiro parágrafo de interações encontrado.
                // A resposta pode ser bem complexa.
                const interactionText = result.drug_interactions[0];

                // Lógica para verificar se a interação é com outro medicamento da lista do usuário
                const interactsWithOtherUserDrug = principiosAtivos.some(pa => 
                    interactionText.toLowerCase().includes(pa.toLowerCase())
                );

                if(interactsWithOtherUserDrug) {
                    interactions.push({ drug: drugName, interaction: interactionText });
                }
            }
        });
    }

    // Remove duplicatas e retorna
    const uniqueInteractions = Array.from(new Set(interactions.map(i => JSON.stringify(i)))).map(s => JSON.parse(s));

    return NextResponse.json({ interactions: uniqueInteractions });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao verificar interações medicamentosas:", message);
    return NextResponse.json({ error: `Erro interno ao verificar interações: ${message}` }, { status: 500 });
  }
}
