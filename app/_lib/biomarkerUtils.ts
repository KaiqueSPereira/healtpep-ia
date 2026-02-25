
import { prisma } from '@/app/_lib/prisma';

// A função de normalização permanece a mesma.
const normalize = (str: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, ' ')
    .replace(/[.\/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * Busca ou CRIA a regra de um biomarcador. Esta é a única fonte da verdade para regras.
 * Se uma regra não existe, ela é criada como "Pendente".
 * 
 * @param rawName O nome bruto do biomarcador vindo do resultado do exame.
 * @param examType O tipo de exame (ex: 'hemograma completo') para criar um contexto.
 * @returns Uma promessa que resolve para a regra do biomarcador (existente ou recém-criada).
 */
export const getBiomarkerRule = async (
    rawName: string, 
    examType?: string
): Promise<{ standardizedName: string; category: string; }> => {
  if (!rawName || !rawName.trim()) {
    return { standardizedName: 'Inválido', category: 'Pendente' };
  }

  const trimmedRawName = rawName.trim();
  const genericKey = normalize(trimmedRawName);

  // 1. Tenta encontrar uma regra específica para o tipo de exame (ex: espermograma:cor)
  if (examType) {
    const compositeKey = `${normalize(examType)}:${genericKey}`;
    const specificRule = await prisma.biomarkerRule.findUnique({
      where: { normalizedRawName: compositeKey },
    });

    if (specificRule) {
      return specificRule;
    }
  }

  // 2. Se não encontrar, tenta uma regra genérica (ex: cor semen)
  const genericRule = await prisma.biomarkerRule.findUnique({
    where: { normalizedRawName: genericKey },
  });

  if (genericRule) {
    return genericRule;
  }

  // 3. Se NENHUMA regra for encontrada, CRIA uma nova regra PENDENTE.
  try {
    const newRule = await prisma.biomarkerRule.create({
      data: {
        normalizedRawName: genericKey,       // Chave principal de busca
        standardizedName: trimmedRawName,   // Começa como o nome original
        category: 'Pendente',             // Fila para curadoria
        // O campo 'rawName' foi removido pois não existe no modelo do Prisma.
      }
    });
    return newRule;
  } catch (error) {
    // Trata o caso de uma condição de corrida onde outra requisição criou a regra no último segundo
    const existingRule = await prisma.biomarkerRule.findUnique({
        where: { normalizedRawName: genericKey },
    });
    if(existingRule) return existingRule;
    
    // Se ainda falhar, lança o erro
    throw error;
  }
};

