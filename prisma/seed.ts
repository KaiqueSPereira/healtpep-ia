
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Iniciando o script de seed...`);

  // O script de seed original foi usado para uma migração de dados única
  // dos dicionários de biomarcadores (do antigo biomarkerUtils.ts) para o banco de dados.
  // Como essa migração foi concluída com sucesso e os dicionários de origem foram removidos,
  // o conteúdo deste script foi limpo para evitar erros de compilação.
  //
  // Se for necessário popular o banco de dados em ambientes de desenvolvimento futuros
  // (com dados de teste, por exemplo), esta função 'main' pode ser preenchida.
  
  console.log(`Script de seed concluído. Nenhum dado novo foi adicionado nesta execução.`);
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante a execução do script de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
