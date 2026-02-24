'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

// Caminho para o arquivo de utilitários de biomarcadores
const utilsFilePath = path.join(process.cwd(), 'app', '_lib', 'biomarkerUtils.ts');

/**
 * Rota da API para categorizar um biomarcador.
 * Esta função atualiza o banco de dados e o arquivo de configuração de forma dinâmica.
 * 
 * @param {Request} req - O objeto da requisição, esperando um corpo JSON com `biomarkerName` e `newCategory`.
 * @returns {Promise<NextResponse>} Uma resposta de sucesso ou erro.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { biomarkerName, newCategory } = body;

    // Validação básica da entrada
    if (!biomarkerName || !newCategory) {
      return new NextResponse('Nome do biomarcador e nova categoria são obrigatórios.', { status: 400 });
    }

    // --- Etapa 1: Atualização Retroativa no Banco de Dados ---
    // Atualiza a categoria para todos os resultados de exames existentes com este nome.
    const dbUpdateResult = await prisma.resultadoExame.updateMany({
      where: {
        nome: biomarkerName,
      },
      data: {
        categoria: newCategory,
      },
    });

    // --- Etapa 2: Atualização Dinâmica do Dicionário no Arquivo ---
    let fileContent = await fs.readFile(utilsFilePath, 'utf-8');

    // Expressão regular para encontrar o objeto biomarkerCategories
    const categoriesRegex = /export const biomarkerCategories: { \[key: string\]: string } = {(\s*[\s\S]*?)}\s*};/;
    const match = fileContent.match(categoriesRegex);

    if (!match) {
      throw new Error('O objeto biomarkerCategories não foi encontrado no arquivo de utils.');
    }

    const existingEntryRegex = new RegExp(`('${biomarkerName}':\s*')([\w\s/&]+)(')`);

    // Verifica se a entrada já existe para decidir se atualiza ou adiciona
    if (existingEntryRegex.test(fileContent)) {
      // Atualiza a categoria existente
      fileContent = fileContent.replace(existingEntryRegex, `$1${newCategory}$3`);
    } else {
      // Adiciona a nova entrada ao objeto de categorias
      const insertionRegex = /(export const biomarkerCategories: { \[key: string\]: string } = {\s*)/;
      fileContent = fileContent.replace(insertionRegex, `$1\n  '${biomarkerName}': '${newCategory}',`);
    }

    // Salva o arquivo modificado
    await fs.writeFile(utilsFilePath, fileContent, 'utf-8');
    
    return NextResponse.json({
      message: `Biomarcador '${biomarkerName}' categorizado como '${newCategory}' com sucesso.`,
      updatedDbEntries: dbUpdateResult.count,
    });

  } catch (error) {
    console.error('Erro ao categorizar biomarcador:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
