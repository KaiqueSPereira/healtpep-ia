
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import https from 'https';

const prisma = new PrismaClient();

const ANVISA_CSV_URL = 'https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function main() {
  console.log('Iniciando o processo de seeding do banco de dados...');
  console.log('Limpando a tabela AnvisaMedicamento...');
  await prisma.anvisaMedicamento.deleteMany({});
  console.log('Tabela limpa. Baixando e processando o arquivo CSV da ANVISA...');
  console.log('(Este processo pode demorar alguns minutos, dependendo da sua conexão)...');

  await new Promise<void>((resolve, reject) => {
    let recordsToInsert: any[] = [];
    let recordCount = 0;
    const batchSize = 1000;

    https.get(ANVISA_CSV_URL, { agent }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Erro ao baixar o arquivo: Status Code ${response.statusCode}`));
        return;
      }
      
      response.setEncoding('latin1');

      const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
        header: true,
      });

      response.pipe(parseStream);

      parseStream.on('data', async (chunk) => {
        parseStream.pause();

        // CORREÇÃO: Usando os nomes de coluna corretos identificados no passo anterior.
        const record = {
          id: chunk['NU_REGISTRO'],
          nome: chunk['NO_PRODUTO'],
          principioAtivo: chunk['DS_SUBSTANCIA'],
        };
        
        if (record.id && record.nome && record.principioAtivo) {
          recordsToInsert.push(record);

          if (recordsToInsert.length >= batchSize) {
            recordCount += recordsToInsert.length;
            console.log(`Inserindo lote de ${recordsToInsert.length} registros... Total processado: ${recordCount}`);
            await prisma.anvisaMedicamento.createMany({
              data: recordsToInsert,
              skipDuplicates: true,
            });
            recordsToInsert = [];
          }
        }
        parseStream.resume();
      });

      parseStream.on('finish', async () => {
        if (recordsToInsert.length > 0) {
          recordCount += recordsToInsert.length;
          console.log(`Inserindo lote final de ${recordsToInsert.length} registros... Total processado: ${recordCount}`);
          await prisma.anvisaMedicamento.createMany({
            data: recordsToInsert,
            skipDuplicates: true,
          });
        }
        console.log('---------------------------------------------------');
        console.log(`Seeding concluído! Total de ${recordCount} medicamentos inseridos.`);
        console.log('---------------------------------------------------');
        resolve();
      });

      parseStream.on('error', (error) => {
        console.error('Erro ao processar o CSV:', error.message);
        reject(error);
      });
    }).on('error', (err) => {
      reject(new Error(`Erro na requisição HTTPS: ${err.message}`));
    });
  });
}

main()
  .catch(async (e) => {
    console.error('Ocorreu um erro fatal no script de seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
