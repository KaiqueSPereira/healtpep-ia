
// Definição dos recursos que podem ter limites numéricos associados.
// A chave (ex: 'exams') é o que será salvo no banco de dados na tabela ResourceLimit.
// O valor (ex: 'Exames') é o que será exibido para o usuário na interface.
export const manageableResources = {
  exams: 'Exames',
  consultas: 'Consultas',
  profissionais: 'Profissionais',
  unidades: 'Unidades',
  medicamentos: 'Medicamentos',
  tratamentos: 'Tratamentos',
};

// Definição dos níveis de acesso para funcionalidades que não são baseadas em contagem.
// Por exemplo, diferentes "tiers" de inteligência artificial.
export const tieredResources = {
  ia_usage: {
    label: 'Nível de IA',
    levels: {
      0: 'Desabilitada',
      1: 'Básico',
      2: 'Avançado',
    },
  },
};

// Permissões de acesso (flags booleanas) que NÃO devem ser exibidas na seção de limites.
// Incluímos aqui as antigas permissões de limite para que elas não apareçam mais na UI.
export const permissionFlags = [
  'view_admin_dashboard',
  'view_error_logs',
  'manage_users',
  'assign_roles',
  'manage_roles',
  'manage_permissions',
];
