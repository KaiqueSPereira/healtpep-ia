
import { prisma } from '@/app/_lib/prisma';

/**
 * Normaliza um nome de biomarcador para criar uma chave de busca consistente.
 * A normalização inclui remover acentos, conteúdo em parênteses, caracteres especiais,
 * e converter para maiúsculas.
 * @param rawName O nome bruto do biomarcador (ex: "Col. LDL" ou "Colesterol - Ldl").
 * @returns O nome normalizado para ser usado como chave de busca (ex: "COLESTEROL LDL").
 */
const normalizeName = (rawName: string): string => {
  if (!rawName) return '';

  return rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // Remove acentos (ç -> c)
    .replace(/\(.*?\)/g, "")          // Remove conteúdo dentro de parênteses
    .replace(/[.\/-]/g, ' ')           // Substitui ., /, - por espaço
    .replace(/\s+/g, ' ')             // Junta múltiplos espaços
    .trim()
    .toUpperCase();
};

/**
 * Busca a regra de um biomarcador (nome padronizado e categoria) no banco de dados
 * com base em seu nome bruto.
 * 
 * @param rawName O nome bruto do biomarcador vindo do resultado do exame.
 * @returns Um objeto contendo `standardizedName` e `category`. 
 *          Se nenhuma regra for encontrada, retorna o nome original e a categoria 'Pendente'.
 */
export const getBiomarkerRule = async (rawName: string): Promise<{ standardizedName: string; category: string; }> => {
  if (!rawName) {
    return { standardizedName: '', category: 'Pendente' };
  }

  const normalizedKey = normalizeName(rawName);

  const rule = await prisma.biomarkerRule.findUnique({
    where: { normalizedRawName: normalizedKey },
  });

  if (rule) {
    return {
      standardizedName: rule.standardizedName,
      category: rule.category,
    };
  }

  // Se nenhuma regra for encontrada, o biomarcador precisa de curadoria.
  return {
    standardizedName: rawName.trim(),
    category: 'Pendente',
  };
};
