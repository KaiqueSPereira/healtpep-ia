
// Mapeamento de nomes brutos (em formato normalizado) para nomes de exibição padronizados.
// As chaves aqui são SEMPRE EM MAIÚSCULAS, SEM ACENTOS, SEM HÍFENS e com espaço simples.
export const biomarkerDisplayNames: { [key: string]: string } = {
  // Fígado
  'TGO': 'TGO - Transaminase Glutâmico Oxalacética',
  'TRANSAMINASE OXALACETICA': 'TGO - Transaminase Glutâmico Oxalacética',
  'AST': 'TGO - Transaminase Glutâmico Oxalacética',
  'TGO TRANSAMINASE GLUTAMICO OXALACETICA': 'TGO - Transaminase Glutâmico Oxalacética',
  'TGP': 'TGP - Transaminase Glutâmico Pirúvica',
  'TRANSAMINASE PIRUVICA': 'TGP - Transaminase Glutâmico Pirúvica',
  'TGP TRANSAMINASE GLUTAMICO PIRUVICA': 'TGP - Transaminase Glutâmico Pirúvica',
  'ALT': 'TGP - Transaminase Glutâmico Pirúvica',
  'FOSFATASE ALCALINA': 'Fosfatase Alcalina',
  'GAMA GLUTAMIL TRANSFERASE': 'Gama-GT',
  'GAMA GLUTAMILTRANSFERASE': 'Gama-GT',
  'GGT': 'Gama-GT',
  'GAMA GT': 'Gama-GT',
  'BILIRRUBINA TOTAL': 'Bilirrubina Total',
  'BILIRRUBINA DIRETA': 'Bilirrubina Direta',
  'BILIRRUBINA INDIRETA': 'Bilirrubina Indireta',
  'ALBUMINA': 'Albumina',
  'PROTEINAS TOTAIS': 'Proteínas Totais',
  'RELACAO AG': 'Relação A/G',
  'RELACAO A G': 'Relação A/G', // Correção para o caso com espaço
  'GLOBULINA': 'Globulina',

  // Rins
  'UREIA': 'Ureia',
  'CREATININA': 'Creatinina',
  'TAXA DE FILTRACAO GLOMERULAR': 'Taxa de Filtração Glomerular (TFG)',
  'TAXA DE FILTRACAO GLOMERULAR TFG': 'Taxa de Filtração Glomerular (TFG)',
  'TFG': 'Taxa de Filtração Glomerular (TFG)',
  'SODIO': 'Sódio',
  'POTASSIO': 'Potássio',
  'CLORO': 'Cloro',
  'ACIDO URICO': 'Ácido Úrico',
  'MICROALBUMINURIA': 'Microalbuminúria',
  'MICROALBUMINURIA URINA ISOLADA': 'Microalbuminúria',

  // Coração / Lipídios
  'COLESTEROL TOTAL': 'Colesterol Total',
  'COLESTEROL HDL': 'Colesterol-HDL',
  'COL HDL': 'Colesterol-HDL',
  'HDL': 'Colesterol-HDL',
  'COLESTEROL LDL': 'Colesterol-LDL',
  'COL LDL': 'Colesterol-LDL',
  'LDL': 'Colesterol-LDL',
  'COLESTEROL VLDL': 'Colesterol-VLDL',
  'COL VLDL': 'Colesterol-VLDL',
  'VLDL': 'Colesterol-VLDL',
  'TRIGLICERIDEOS': 'Triglicerídeos',
  'TRIGLICERIDES': 'Triglicerídeos',
  'LIPIDIOS TOTAIS': 'Lipídios Totais',
  'CK TOTAL': 'Creatinoquinase (CK)',
  'CREATINOQUINASE': 'Creatinoquinase (CK)',
  'CK MB': 'CK-MB',
  'TROPONINA': 'Troponina',
  'HOMOCISTEINA': 'Homocisteína',

  // Pâncreas
  'AMILASE': 'Amilase',
  'LIPASE': 'Lipase',

  // Tireoide
  'TSH': 'Hormônio Tireoestimulante (TSH)',
  'HORMONIO TIREOESTIMULANTE TSH': 'Hormônio Tireoestimulante (TSH)',
  'HORMONIO TIREOESTIMULANTE': 'Hormônio Tireoestimulante (TSH)',
  'T4 LIVRE': 'T4 Livre',
  'T3': 'T3 Total',
  'T3 TOTAL': 'T3 Total',
  'T3 LIVRE': 'T3 Livre',

  // Hemograma & Coagulação
  'ERITROCITOS': 'Hemácias',
  'HEMACIAS': 'Hemácias',
  'HEMOGLOBINA': 'Hemoglobina',
  'HEMATOCRITO': 'Hematócrito',
  'VOLUME CORPUSCULAR MEDIO VCM': 'VCM',
  'VCM': 'VCM',
  'HEMOGLOBINA CORPUSCULAR MEDIA HCM': 'HCM',
  'HCM': 'HCM',
  'CONC DE HEMOGLOBINA CORP MEDIA CHCM': 'CHCM',
  'CHCM': 'CHCM',
  'INDICE DE ANISOCITOSE RDW': 'RDW',
  'RDW': 'RDW',
  'LEUCOCITOS': 'Leucócitos (Glóbulos Brancos)',
  'LEUCOCITOS GLOBULOS BRANCOS': 'Leucócitos (Glóbulos Brancos)',
  'NEUTROFILOS': 'Neutrófilos',
  'LINFOCITOS': 'Linfócitos',
  'MONOCITOS': 'Monócitos',
  'EOSINOFILOS': 'Eosinófilos',
  'BASOFILOS': 'Basófilos',
  'PLAQUETAS': 'Plaquetas',
  'VOLUME PLAQUETARIO MEDIO VPM': 'Volume Plaquetário Médio (VPM)',
  'VOLUME PLAQUETARIO MEDIO': 'Volume Plaquetário Médio (VPM)', // Correção para o caso com capitalização errada
  'VPM': 'Volume Plaquetário Médio (VPM)',
  'VOLUME MEDIO PALQUETARIO': 'Volume Plaquetário Médio (VPM)',
  'VOL PLAQ MEDIO': 'Volume Plaquetário Médio (VPM)',
  'FERRO SERICO': 'Ferro Sérico',
  'FERRITINA': 'Ferritina',
  'VITAMINA B12': 'Vitamina B12',
  'TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA TEMPO': 'TTPA (Tempo)',
  'TTPA TEMPO': 'TTPA (Tempo)',
  'TTPA': 'TTPA (Tempo)', // Adicionado para casos como "Ttpa (RelaçãO)"
  'TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA RELACAO': 'TTPA (Relação)',
  'TTPA RELACAO': 'TTPA (Relação)',

  // Glicemia e Diabetes
  'GLICEMIA DE JEJUM': 'Glicose',
  'GLICOSE': 'Glicose',
  'GLICOSE MEDIA ESTIMADA': 'Glicose Média Estimada',
  'HEMOGLOBINA GLICADA': 'Hemoglobina Glicada - HbA1c',
  'HEMOGLOBINA GLICADA HBA1C': 'Hemoglobina Glicada - HbA1c',
  'HBA1C': 'Hemoglobina Glicada - HbA1c',
  'INSULINA': 'Insulina',

  // Marcadores de Infecção/Inflamação
  'LINFOCITOS T CD4+': 'CD4',
  'CD4': 'CD4',
  'CD4 %': 'CD4 (%)',
  'CONTAGEM DE LINFOCITOS T CD4+': 'CD4',
  'LINFOCITOS T CD8+': 'CD8',
  'CD8': 'CD8',
  'CD8 %': 'CD8 (%)',
  'CONTAGEM DE LINFOCITOS T CD8+': 'CD8',
  'RELACAO CD4 CD8': 'Relação CD4/CD8',
  'RELACAO CD4CD8': 'Relação CD4/CD8',
  'CD4CD8': 'Relação CD4/CD8',
  'CARGA VIRAL': 'Carga Viral (HIV)',
  'CARGA VIRAL HIV': 'Carga Viral (HIV)',
  'CARGA VIRAL PCR': 'Carga Viral (HIV)',
  'CARGA VIRAL LOG': 'Carga Viral (Log)',
  'LOG CARGA VIRAL': 'Carga Viral (Log)',
  'PCR': 'Proteína C-Reativa',
  'PROTEINA C REATIVA': 'Proteína C-Reativa',
  'PCR PROTEINA C REATIVA QUANTITATIVO': 'Proteína C-Reativa',
  'VHS': 'Velocidade de Hemossedimentação (VHS)',
  'TREPONEMA PALLIDUM TOTAL': 'Treponema Pallidum (Sífilis)',
  'TREPONEMA PALLIDUM SIFILIS': 'Treponema Pallidum (Sífilis)',
  'TREPONEMA PALLIDUM': 'Treponema Pallidum (Sífilis)',
  'HEPATITE B ANTI HBS': 'Hepatite B - Anti-HBs',
  'HEPATITE B ANTI HBC TOTAL': 'Hepatite B - Anti-HBc Total',
  'HEPATITE B HBSAG': 'Hepatite B - HBsAg',
  'HEPATITE C ANTI HCV': 'Hepatite C - Anti-HCV',
  'ANTIGENO NS1 DENGUE': 'Antígeno NS1 (Dengue)',
  'ANTIGENO NS1': 'Antígeno NS1 (Dengue)',
  'ANTIGENO NS1 TESTE RAPIDO DENGUE': 'Antígeno NS1 (Dengue)',
  
  // Exames de Urina
  'ASPECTO': 'Aspecto (Urina)',
  'COR': 'Cor (Urina)',
  'DENSIDADE': 'Densidade (Urina)',
  'PH': 'pH (Urina)',
  'CORPOS CETONICOS': 'Corpos Cetônicos (Urina)',
  'BILIRRUBINA': 'Bilirrubina (Urina)',
  'PROTEINA': 'Proteína (Urina)',
  'UROBILINOGENIO': 'Urobilinogênio (Urina)',
  'NITRITO': 'Nitrito (Urina)',
  'CELULAS EPITELIAIS': 'Células Epiteliais (Urina)',
  'CILINDROS': 'Cilindros (Urina)',
  'CRISTAIS': 'Cristais (Urina)',
  'FILAMENTOS DE MUCO': 'Filamentos de Muco (Urina)',
  'LEVEDURA': 'Levedura (Urina)',
  'OUTROS ELEMENTOS': 'Outros Elementos (Urina)',

  // Outros
  'VITAMINA D': 'Vitamina D',
  'VITAMINA D 25 HIDROXI': 'Vitamina D',
  'HIDROXIVITAMINA D 25': 'Vitamina D',
};

/**
 * Padroniza o nome de um biomarcador de forma robusta.
 * @param rawName O nome bruto do biomarcador (ex: "Col. LDL" ou "Colesterol - Ldl").
 * @returns O nome padronizado (ex: "Colesterol-LDL") ou o nome original se não houver padrão.
 */
export const standardizeBiomarkerName = (rawName: string): string => {
  if (!rawName) return '';
  
  // Etapa de Normalização agressiva para criar uma chave de busca consistente.
  const normalizedKey = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // Remove acentos (ç -> c)
    .replace(/\(.*?\)/g, "")          // Remove conteúdo dentro de parênteses
    .replace(/[.\/-]/g, ' ')           // Substitui ., /, - por espaço
    .replace(/\s+/g, ' ')             // Junta múltiplos espaços
    .trim()
    .toUpperCase();

  // Busca no dicionário mestre usando a chave normalizada.
  const standardName = biomarkerDisplayNames[normalizedKey];
  if (standardName) {
    return standardName;
  }

  // Fallback de segurança: Se nenhum padrão for encontrado, retorna o nome original intacto.
  return rawName.trim();
};


// Mapeamento de nomes de exibição para suas respectivas categorias de exame.
export const biomarkerCategories: { [key: string]: string } = {
  // Fígado
  'TGO - Transaminase Glutâmico Oxalacética': 'Fígado',
  'TGP - Transaminase Glutâmico Pirúvica': 'Fígado',
  'Fosfatase Alcalina': 'Fígado',
  'Gama-GT': 'Fígado',
  'Bilirrubina Total': 'Fígado',
  'Bilirrubina Direta': 'Fígado',
  'Bilirrubina Indireta': 'Fígado',
  'Albumina': 'Fígado',
  'Proteínas Totais': 'Fígado',
  'Relação A/G': 'Fígado',
  'Globulina': 'Fígado',

  // Rins
  'Ureia': 'Rins',
  'Creatinina': 'Rins',
  'Taxa de Filtração Glomerular (TFG)': 'Rins',
  'Sódio': 'Rins',
  'Potássio': 'Rins',
  'Cloro': 'Rins',
  'Ácido Úrico': 'Rins',
  'Microalbuminúria': 'Rins',

  // Coração / Lipídios
  'Colesterol Total': 'Coração / Lipídios',
  'Colesterol-HDL': 'Coração / Lipídios',
  'Colesterol-LDL': 'Coração / Lipídios',
  'Colesterol-VLDL': 'Coração / Lipídios',
  'Triglicerídeos': 'Coração / Lipídios',
  'Lipídios Totais': 'Coração / Lipídios',
  'Creatinoquinase (CK)': 'Coração / Lipídios',
  'CK-MB': 'Coração / Lipídios',
  'Troponina': 'Coração / Lipídios',
  'Homocisteína': 'Coração / Lipídios',

  // Pâncreas
  'Amilase': 'Pâncreas',
  'Lipase': 'Pâncreas',

  // Tireoide
  'Hormônio Tireoestimulante (TSH)': 'Tireoide',
  'T4 Livre': 'Tireoide',
  'T3 Total': 'Tireoide',
  'T3 Livre': 'Tireoide',

  // Hemograma & Coagulação
  'Hemácias': 'Hemograma & Coagulação',
  'Hemoglobina': 'Hemograma & Coagulação',
  'Hematócrito': 'Hemograma & Coagulação',
  'VCM': 'Hemograma & Coagulação',
  'HCM': 'Hemograma & Coagulação',
  'CHCM': 'Hemograma & Coagulação',
  'RDW': 'Hemograma & Coagulação',
  'Leucócitos (Glóbulos Brancos)': 'Hemograma & Coagulação',
  'Neutrófilos': 'Hemograma & Coagulação',
  'Linfócitos': 'Hemograma & Coagulação',
  'Monócitos': 'Hemograma & Coagulação',
  'Eosinófilos': 'Hemograma & Coagulação',
  'Basófilos': 'Hemograma & Coagulação',
  'Plaquetas': 'Hemograma & Coagulação',
  'Volume Plaquetário Médio (VPM)': 'Hemograma & Coagulação',
  'Ferro Sérico': 'Hemograma & Coagulação',
  'Ferritina': 'Hemograma & Coagulação',
  'Vitamina B12': 'Hemograma & Coagulação',
  'TTPA (Tempo)': 'Hemograma & Coagulação',
  'TTPA (Relação)': 'Hemograma & Coagulação',

  // Glicemia e Diabetes
  'Glicose': 'Glicemia e Diabetes',
  'Glicose Média Estimada': 'Glicemia e Diabetes',
  'Hemoglobina Glicada - HbA1c': 'Glicemia e Diabetes',
  'Insulina': 'Glicemia e Diabetes',

  // Marcadores de Infecção/Inflamação
  'CD4': 'Marcadores de Infecção/Inflamação',
  'CD8': 'Marcadores de Infecção/Inflamação',
  'CD4 (%)': 'Marcadores de Infecção/Inflamação',
  'CD8 (%)': 'Marcadores de Infecção/Inflamação',
  'Relação CD4/CD8': 'Marcadores de Infecção/Inflamação',
  'Carga Viral (HIV)': 'Marcadores de Infecção/Inflamação',
  'Carga Viral (Log)': 'Marcadores de Infecção/Inflamação',
  'Proteína C-Reativa': 'Marcadores de Infecção/Inflamação',
  'Velocidade de Hemossedimentação (VHS)': 'Marcadores de Infecção/Inflamação',
  'Treponema Pallidum (Sífilis)': 'Marcadores de Infecção/Inflamação',
  'Hepatite B - Anti-HBs': 'Marcadores de Infecção/Inflamação',
  'Hepatite B - Anti-HBc Total': 'Marcadores de Infecção/Inflamação',
  'Hepatite B - HBsAg': 'Marcadores de Infecção/Inflamação',
  'Hepatite C - Anti-HCV': 'Marcadores de Infecção/Inflamação',
  'Antígeno NS1 (Dengue)': 'Marcadores de Infecção/Inflamação',

  // Urina
  'Aspecto (Urina)': 'Urina',
  'Cor (Urina)': 'Urina',
  'Densidade (Urina)': 'Urina',
  'pH (Urina)': 'Urina',
  'Corpos Cetônicos (Urina)': 'Urina',
  'Bilirrubina (Urina)': 'Urina',
  'Proteína (Urina)': 'Urina',
  'Urobilinogênio (Urina)': 'Urina',
  'Nitrito (Urina)': 'Urina',
  'Células Epiteliais (Urina)': 'Urina',
  'Cilindros (Urina)': 'Urina',
  'Cristais (Urina)': 'Urina',
  'Filamentos de Muco (Urina)': 'Urina',
  'Levedura (Urina)': 'Urina',
  'Outros Elementos (Urina)': 'Urina',

  // Outros
  'Vitamina D': 'Outros',
};

/**
 * Retorna a categoria para um nome de biomarcador padronizado.
 * @param standardName O nome padronizado do biomarcador (ex: "TGP - Transaminase Glutâmico Pirúvica").
 * @returns A categoria do biomarcador (ex: "Fígado") ou "Pendente" se não for encontrada.
 */
export const getCategory = (standardName: string): string => {
    // Se o nome não for encontrado no dicionário de categorias, ele precisa de curadoria.
    return biomarkerCategories[standardName] || 'Pendente';
};
