import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/cid/search:
 *   get:
 *     summary: Realiza uma busca por códigos da CID-10 em uma API externa.
 *     description: Atua como um proxy para a API cid.expert, buscando por códigos ou descrições da CID-10.
 *     tags:
 *       - CID
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: O termo de busca para o código ou descrição da CID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Uma lista de resultados da CID-10 contendo código e descrição.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   codigo:
 *                     type: string
 *                     example: "A00"
 *                   descricao:
 *                     type: string
 *                     example: "Cólera"
 *       400:
 *         description: Erro se o parâmetro 'query' não for fornecido.
 *       500:
 *         description: Erro interno do servidor ao contatar a API externa.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'O parâmetro de busca (query) é obrigatório.' }, { status: 400 });
  }

  try {
    // URL da API externa para busca de CID
    const externalApiUrl = `https://cid.expert/api/v1/cid/search?query=${encodeURIComponent(query)}`;

    const response = await fetch(externalApiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CID_EXTERNAL_API_ERROR]', errorData);
      throw new Error(errorData.message || 'Falha ao buscar dados da API externa de CID.');
    }

    const data = await response.json();

    // A API externa retorna um array de objetos com 'sid' e 'nome'.
    // Vamos mapear para 'codigo' e 'descricao' para manter a consistência com nosso modelo de dados.
    const formattedData = data.map((item: any) => ({
      codigo: item.sid,
      descricao: item.nome,
    }));

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('[CID_PROXY_ERROR]', error);
    return NextResponse.json({ error: 'Erro interno ao processar a busca por CID.' }, { status: 500 });
  }
}
