
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma'; // Importa o Prisma Client

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name || name.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const results = await db.anvisaMedicamento.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            principioAtivo: {
              contains: name,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        nome: true,
        principioAtivo: true,
      },
      take: 20,
    });

    const formattedResults = results.map(med => ({
      id: med.id,
      nomeComercial: med.nome,
      principioAtivo: med.principioAtivo,
      linkBula: `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(med.nome)}`
    }));

    return NextResponse.json(formattedResults);

  } catch (error) {
    console.error("Erro ao buscar medicamentos na base de dados:", error);
    return NextResponse.json({ error: "Erro interno ao buscar medicamentos." }, { status: 500 });
  }
}
