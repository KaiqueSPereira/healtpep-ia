// app/_lib/biomarkerUtils.ts

// Mapeamento de nomes brutos para nomes de exibição padronizados
export const biomarkerDisplayNames: { [key: string]: string } = {
  // Fígado
  'TGO': 'TGO',
  'TRANSAMINASE OXALACETICA': 'TGO',
  'AST': 'AST',
  'TGP': 'TGP',
  'TRANSAMINASE PIRUVICA': 'TGP',
  'ALT': 'ALT',
  'FOSFATASE ALCALINA': 'Fosfatase Alcalina',
  'GAMA GLUTAMIL TRANSFERASE': 'Gama-GT',
  'GGT': 'GGT',
  'BILIRRUBINA TOTAL': 'Bilirrubina Total',
  'BILIRRUBINA DIRETA': 'Bilirrubina Direta',
  'BILIRRUBINA INDIRETA': 'Bilirrubina Indireta',
  'ALBUMINA': 'Albumina',

  // Rins
  'UREIA': 'Ureia',
  'CREATININA': 'Creatinina',
  'TAXA DE FILTRACAO GLOMERULAR': 'TFG',
  'SODIO': 'Sódio',
  'POTASSIO': 'Potássio',
  'CLORO': 'Cloro',

  // Coração / Lipídios
  'COLESTEROL TOTAL': 'Colesterol Total',
  'COLESTEROL HDL': 'Colesterol-HDL',
  'COLESTEROL LDL': 'Colesterol-LDL',
  'COLESTEROL VLDL': 'Colesterol-VLDL',
  'TRIGLICERIDES': 'Triglicerídeos',
  'LIPIDIOS TOTAIS': 'Lipídios Totais',
  'CK-MB': 'CK-MB',
  'TROPONINA': 'Troponina',

  // Hemograma
  'HEMACIAS': 'Hemácias',
  'HEMOGLOBINA': 'Hemoglobina',
  'HEMATOCRITO': 'Hematócrito',
  'VCM': 'VCM',
  'HCM': 'HCM',
  'CHCM': 'CHCM',
  'RDW': 'RDW',
  'LEUCOCITOS': 'Leucócitos',
  'NEUTROFILOS': 'Neutrófilos',
  'BASTONETES': 'Bastonetes',
  'SEGMENTADOS': 'Segmentados',
  'LINFOCITOS': 'Linfócitos',
  'MONOCITOS': 'Monócitos',
  'EOSINOFILOS': 'Eosinófilos',
  'BASOFILOS': 'Basófilos',
  'PLAQUETAS': 'Plaquetas',

  // Diabetes / Glicemia
  'GLICOSE': 'Glicose',
  'GLICEMIA': 'Glicemia',
  'HEMOGLOBINA GLICADA': 'Hb Glicada (A1c)',
  'HBA1C': 'Hb Glicada (A1c)',

  // Tireoide
  'TSH': 'TSH',
  'T4 LIVRE': 'T4 Livre',
  'T3 TOTAL': 'T3 Total',
};

// Mapeamento de nomes de exibição para categorias
export const biomarkerCategories: { [key: string]: string } = {
  // Fígado
  'TGO': 'Fígado',
  'AST': 'Fígado',
  'TGP': 'Fígado',
  'ALT': 'Fígado',
  'Fosfatase Alcalina': 'Fígado',
  'Gama-GT': 'Fígado',
  'GGT': 'Fígado',
  'Bilirrubina Total': 'Fígado',
  'Bilirrubina Direta': 'Fígado',
  'Bilirrubina Indireta': 'Fígado',
  'Albumina': 'Fígado',

  // Rins
  'Ureia': 'Rins',
  'Creatinina': 'Rins',
  'TFG': 'Rins',
  'Sódio': 'Rins',
  'Potássio': 'Rins',
  'Cloro': 'Rins',

  // Coração / Lipídios
  'Colesterol Total': 'Coração',
  'Colesterol-HDL': 'Coração',
  'Colesterol-LDL': 'Coração',
  'Colesterol-VLDL': 'Coração',
  'Triglicerídeos': 'Coração',
  'Lipídios Totais': 'Coração',
  'CK-MB': 'Coração',
  'Troponina': 'Coração',

  // Hemograma
  'Hemácias': 'Hemograma',
  'Hemoglobina': 'Hemograma',
  'Hematócrito': 'Hemograma',
  'VCM': 'Hemograma',
  'HCM': 'Hemograma',
  'CHCM': 'Hemograma',
  'RDW': 'Hemograma',
  'Leucócitos': 'Hemograma',
  'Neutrófilos': 'Hemograma',
  'Bastonetes': 'Hemograma',
  'Segmentados': 'Hemograma',
  'Linfócitos': 'Hemograma',
  'Monócitos': 'Hemograma',
  'Eosinófilos': 'Hemograma',
  'Basófilos': 'Hemograma',
  'Plaquetas': 'Hemograma',

  // Diabetes / Glicemia
  'Glicose': 'Diabetes',
  'Glicemia': 'Diabetes',
  'Hb Glicada (A1c)': 'Diabetes',

  // Tireoide
  'TSH': 'Tireoide',
  'T4 Livre': 'Tireoide',
  'T3 Total': 'Tireoide',
};

/**
 * Normaliza o nome de um biomarcador para um formato de exibição padrão.
 */
export const getDisplayName = (rawName: string): string => {
  if (!rawName) return 'Desconhecido';
  const normalizedName = rawName.toUpperCase().trim();
  for (const key in biomarkerDisplayNames) {
    if (normalizedName.includes(key)) {
      return biomarkerDisplayNames[key];
    }
  }
  return rawName; // Retorna o nome original se não encontrar mapeamento
};

/**
 * Retorna a categoria de um biomarcador com base em seu nome de exibição.
 */
export const getCategory = (displayName: string): string => {
  return biomarkerCategories[displayName] || 'Outros';
};