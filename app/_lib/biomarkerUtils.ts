
// Mapeamento de nomes brutos para nomes de exibição padronizados
export const biomarkerDisplayNames: { [key: string]: string } = {
  // Fígado
  'TGO': 'TGO',
  'TRANSAMINASE OXALACETICA': 'TGO',
  'AST': 'TGO',
  'TGP': 'TGP',
  'TRANSAMINASE PIRUVICA': 'TGP',
  'ALT': 'TGP',
  'FOSFATASE ALCALINA': 'Fosfatase Alcalina',
  'GAMA GLUTAMIL TRANSFERASE': 'Gama-GT',
  'GGT': 'Gama-GT',
  'GAMA GT': 'Gama-GT',
  'BILIRRUBINA TOTAL': 'Bilirrubina Total',
  'BILIRRUBINA DIRETA': 'Bilirrubina Direta',
  'BILIRRUBINA INDIRETA': 'Bilirrubina Indireta',
  'ALBUMINA': 'Albumina',

  // Rins
  'UREIA': 'Ureia',
  'CREATININA': 'Creatinina',
  'TAXA DE FILTRACAO GLOMERULAR': 'Taxa de Filtração Glomerular (TFG)',
  'TFG': 'Taxa de Filtração Glomerular (TFG)',
  'SODIO': 'Sódio',
  'POTASSIO': 'Potássio',
  'CLORO': 'Cloro',

  // Coração / Lipídios
  'COLESTEROL TOTAL': 'Colesterol Total',
  'COLESTEROL HDL': 'Colesterol HDL',
  'HDL': 'Colesterol HDL',
  'COLESTEROL LDL': 'Colesterol LDL',
  'LDL': 'Colesterol LDL',
  'COLESTEROL VLDL': 'Colesterol VLDL',
  'VLDL': 'Colesterol VLDL',
  'TRIGLICERIDEOS': 'Triglicerídeos',
  'TRIGLICERIDES': 'Triglicerídeos',
  'LIPIDIOS TOTAIS': 'Lipídios Totais',
  'CK TOTAL': 'Creatinoquinase (CK)',
  'CREATINOQUINASE': 'Creatinoquinase (CK)',
  'CK-MB': 'CK-MB',
  'TROPONINA': 'Troponina',
  'HOMOCISTEINA': 'Homocisteína',

  // Pâncreas
  'AMILASE': 'Amilase',
  'LIPASE': 'Lipase',

  // Tireoide
  'TSH': 'Hormônio Tireoestimulante (TSH)',
  'T4 LIVRE': 'T4 Livre',
  'T3': 'T3 Total',
  'T3 TOTAL': 'T3 Total',
  'T3 LIVRE': 'T3 Livre',

  // Hemograma
  'HEMOGLOBINA': 'Hemoglobina',
  'HEMATOCRITO': 'Hematócrito',
  'VCM': 'Volume Corpuscular Médio (VCM)',
  'HCM': 'Hemoglobina Corpuscular Média (HCM)',
  'CHCM': 'Conc. de Hemoglobina Corp. Média (CHCM)',
  'RDW': 'Índice de Anisocitose (RDW)',
  'LEUCOCITOS': 'Leucócitos (Glóbulos Brancos)',
  'NEUTROFILOS': 'Neutrófilos',
  'LINFOCITOS': 'Linfócitos',
  'MONOCITOS': 'Monócitos',
  'EOSINOFILOS': 'Eosinófilos',
  'BASOFILOS': 'Basófilos',
  'PLAQUETAS': 'Plaquetas',

  // Glicemia e Diabetes
  'GLICEMIA DE JEJUM': 'Glicose',
  'GLICOSE': 'Glicose',
  'HEMOGLOBINA GLICADA': 'Hemoglobina Glicada - HbA1c',
  'HBA1C': 'Hemoglobina Glicada - HbA1c',
  'INSULINA': 'Insulina',

  // Marcadores de Infecção/Inflamação e HIV
  'CD4': 'CD4',
  'CONTAGEM DE LINFOCITOS T CD4+': 'CD4',
  'CD8': 'CD8',
  'CONTAGEM DE LINFOCITOS T CD8+': 'CD8',
  'RELACAO CD4/CD8': 'Relação CD4/CD8',
  'CD4/CD8': 'Relação CD4/CD8',
  'CARGA VIRAL': 'Carga Viral',
  'CARGA VIRAL (PCR)': 'Carga Viral',
  'CARGA VIRAL LOG': 'Carga Viral (Log)',
  'LOG CARGA VIRAL': 'Carga Viral (Log)',
  'PCR': 'Proteína C-Reativa',
  'PROTEINA C REATIVA': 'Proteína C-Reativa',
  'VHS': 'Velocidade de Hemossedimentação (VHS)',

  // Outros
  'FERRO SERICO': 'Ferro Sérico',
  'FERRITINA': 'Ferritina',
  'VITAMINA D': 'Vitamina D',
  'VITAMINA B12': 'Vitamina B12',
  'ACIDO URICO': 'Ácido Úrico',
};

/**
 * Padroniza o nome de um biomarcador.
 * @param rawName O nome bruto do biomarcador (ex: "TRANSAMINASE PIRUVICA").
 * @returns O nome padronizado (ex: "TGP") ou o nome original em Title Case se não houver um padrão.
 */
export const standardizeBiomarkerName = (rawName: string): string => {
  if (!rawName) return '';

  // 1. Normaliza o nome bruto para a busca: remove acentos, pontuação e converte para maiúsculas.
  const normalizedRawName = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s/]/g, '') // Mantém a barra para CD4/CD8
    .trim()
    .toUpperCase();

  // 2. Procura no mapa de padronização.
  const standardName = biomarkerDisplayNames[normalizedRawName];

  // 3. Se encontrou, retorna o nome padronizado.
  if (standardName) {
    return standardName;
  }

  // 4. Se não encontrou, retorna o nome original com um tratamento básico (Title Case).
  return rawName
    .trim()
    .toLowerCase()
    .replace(/\b(\w)/g, char => char.toUpperCase());
};
