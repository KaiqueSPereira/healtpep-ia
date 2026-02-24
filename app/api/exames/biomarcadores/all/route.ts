'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt } from '@/app/_lib/crypto';

/**
 * Interface para o objeto que agrupa biomarcadores por categoria.
 */
interface CategorizedBiomarkers {
  [category: string]: string[];
}

/**
 * Rota da API para buscar todos os biomarcadores únicos e suas categorias associadas.
 * Os nomes dos biomarcadores e as categorias são descriptografados antes de serem retornados.
 * 
 * @returns {Promise<NextResponse>} Uma resposta JSON com os biomarcadores agrupados por categoria,
 * ou uma resposta de erro em caso de falha.
 */
export async function GET() {
  try {
    // Busca todos os resultados de exames, selecionando apenas nome e categoria
    const allBiomarkers = await prisma.resultadoExame.findMany({
      select: {
        nome: true,
        categoria: true,
      },
      distinct: ['nome', 'categoria'],
      // Garante que não estamos pegando entradas sem nome ou categoria
      where: {
        nome: { not: '' },
        categoria: { not: '' },
      },
    });

    // Processa os resultados para agrupar por categoria, descriptografando os dados
    const categorizedBiomarkers = allBiomarkers.reduce((acc: CategorizedBiomarkers, biomarker) => {
      const decryptedCategory = safeDecrypt(biomarker.categoria!);
      const decryptedName = safeDecrypt(biomarker.nome);

      // Se a categoria ainda não existe no acumulador, inicializa com um array vazio
      if (!acc[decryptedCategory]) {
        acc[decryptedCategory] = [];
      }

      // Adiciona o nome do biomarcador (descriptografado) ao array da sua categoria
      if (!acc[decryptedCategory].includes(decryptedName)) {
        acc[decryptedCategory].push(decryptedName);
      }
      
      return acc;
    }, {});

    // Ordena os biomarcadores dentro de cada categoria alfabeticamente
    for (const category in categorizedBiomarkers) {
        categorizedBiomarkers[category].sort();
    }

    return NextResponse.json(categorizedBiomarkers);
  } catch (error) {
    console.error('Erro ao buscar todos os biomarcadores:', error);
    return new NextResponse('Erro interno do servidor ao processar a solicitação.', { status: 500 });
  }
}
