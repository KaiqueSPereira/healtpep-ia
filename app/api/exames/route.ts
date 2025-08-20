
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { encrypt, encryptString, safeDecrypt } from "@/app/_lib/crypto";
import { Buffer } from 'buffer';


export async function GET() {
  console.log("--- Início do GET em /api/exames ---");

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    console.log("Usuário não autenticado no GET de exames.");
    console.log("--- Fim do GET em /api/exames ---");
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // Use 'select' para incluir campos escalares e relacionais
    const exams = await prisma.exame.findMany({
      where: {
        userId: userId,
      },
      select: { // <-- Usando 'select'
        id: true,
        nome: true,         // Nome do arquivo (será descriptografado depois)
        nomeArquivo: true,  // Nome único do arquivo (será descriptografado depois)
        dataExame: true,    // Data do exame (Date)
        anotacao: true,     // Anotação (será descriptografada depois)
        tipo: true,         // <-- Campo escalar tipo (string)
        userId: true,
        createdAt: true,    // Se necessário
        updatedAt: true,    // Se necessário

        // Relações (usando select aninhado)
        resultados: {
          select: { // Selecione os campos dos resultados que você precisa
            id: true,
            nome: true,
            valor: true,
            unidade: true,
            referencia: true,
          }
        },
        profissional: {
          select: { // Selecione os campos do profissional que você precisa
            id: true,
            nome: true,
            especialidade: true,
            NumClasse: true, // Se necessário no frontend
          }
        },
        unidades: {
           select: { // Selecione os campos da unidade que você precisa
             id: true,
             nome: true,
             tipo: true, // Tipo da unidade, se necessário
             telefone: true, // Telefone da unidade, se necessário
             endereco: { // Endereço da unidade, se necessário
                select: {
                   nome: true, // Nome da rua/endereço
                }
             }
           }
        },
        // Adicione outras relações aqui se precisar
      },
      orderBy: {
        dataExame: 'desc', // Order by date in descending order
      },
    });

    console.log(`Encontrados ${exams.length} exames para o usuário ${userId}.`);

    // *** Descriptografia no backend (antes de enviar a resposta) ***
    const decryptedExams = exams.map((exame) => {
      // Descriptografar campos escalares que foram selecionados
      const decryptedNome = exame.nome ? safeDecrypt(exame.nome) : null;
      const decryptedNomeArquivo = exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null;
      const decryptedAnotacao = exame.anotacao ? safeDecrypt(exame.anotacao) : null;
      // O campo 'tipo' não deve ser criptografado no POST, então não precisa descriptografar aqui.

      // Descriptografar campos nos resultados, se selecionados e criptografados
      const decryptedResultados = exame.resultados ? exame.resultados.map((resultado) => ({
          ...resultado, // Inclui outros campos selecionados dos resultados
          nome: resultado.nome ? safeDecrypt(resultado.nome) : null,
          valor: resultado.valor ? safeDecrypt(resultado.valor) : null,
          unidade: resultado.unidade ? safeDecrypt(resultado.unidade) : null,
          referencia: resultado.referencia ? safeDecrypt(resultado.referencia) : null,
          // other fields if needed
      })) : undefined; // Use undefined se resultados não foi selecionado ou está vazio


      // Retorna o objeto com campos descriptografados e relações incluídas
      return {
        ...exame, // Inclui todos os outros campos selecionados (id, dataExame, tipo, userId, createdAt, updatedAt)
        nome: decryptedNome, // Nome do arquivo (descriptografado)
        nomeArquivo: decryptedNomeArquivo, // Nome único do arquivo (descriptografado)
        anotacao: decryptedAnotacao, // Anotação (descriptografada)
        resultados: decryptedResultados, // Resultados (com campos descriptografados)
        // profissional e unidades já vêm como objetos completos (se selecionados)
        // tipo já vem como string (não deve ser criptografado)
      };
    });


    console.log("Exames processados para exibição.");
    console.log("--- Fim do GET em /api/exames ---");
    return NextResponse.json(decryptedExams); // Retorna a lista de exames processados
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
    console.log("--- Fim do GET em /api/exames com erro ---\n", error); // Adicionado error no log
    return NextResponse.json({ error: "Erro ao buscar exames." }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  console.log("--- Início do POST em /api/exames ---");
  console.log("Content-Type da requisição:", req.headers.get("content-type"));

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    console.log("Usuário não autenticado no POST de exames.");
    console.log("--- Fim do POST em /api/exames ---");
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const profissionalId = formData.get("profissionalId")?.toString();
    const unidadeId = formData.get("unidadeId")?.toString();
    const consultaId = formData.get("consultaId")?.toString() || null;
    const tratamentoId = formData.get("tratamentoId")?.toString() || null;
    const anotacao = formData.get("anotacao")?.toString() || ""; // Anotação agora vem do frontend
    const dataExame = formData.get("dataExame")?.toString();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo")?.toString();
    const examesRaw = formData.get("exames")?.toString(); // Os resultados agora vêm do frontend em JSON stringificadoconst tipo = formData.get("tipo")?.toString();


    console.log("Dados extraídos do FormData:", {
      profissionalId,
      unidadeId,
      consultaId,
      tratamentoId,
      anotacao,
      dataExame,
      fileName: file?.name,
      tipo,
      examesRaw: examesRaw ? examesRaw.substring(0, 100) + '...' : null,
    });


    if (
      !userId ||
      !profissionalId ||
      !unidadeId ||
      !dataExame ||
      !tipo ||
      (!consultaId && !tratamentoId)
      // Removida a validação de arquivo e resultados aqui, pois a análise é feita no frontend
    ) {
      console.log("Campos obrigatórios ausentes ou inválidos.");
      console.log("--- Fim do POST em /api/exames ---");
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios ou inválidos." },
        { status: 400 },
      );
    }

    // Processamento do arquivo para salvamento e criptografia
    let encryptedFileBuffer = null;
    let originalFileName = null;
    let uniqueFileName = null;

    if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        encryptedFileBuffer = encrypt(fileBuffer);
        originalFileName = file.name;
        uniqueFileName = `${randomUUID()}-${originalFileName}`;
    }


    const exame = await prisma.exame.create({
      data: {
        nome: encryptString(originalFileName || "Arquivo sem nome"), // Salvar o nome original do arquivo
        nomeArquivo: encryptString(uniqueFileName || ""), // Salvar o nome único
        dataExame: new Date(dataExame),
        anotacao: encryptString(anotacao), // Salvar a anotação que veio do frontend
        userId,
        profissionalId,
        unidadesId: unidadeId,
        consultaId,
        tratamentoId,
        tipo,
        arquivoExame: encryptedFileBuffer, // Pode ser null se não houver arquivo
      },
    });

     console.log("Exame criado no banco de dados:", exame.id);


    // Salvar os resultados que vieram do frontend
    if (examesRaw) {
      try {
        const exames = JSON.parse(examesRaw);
         console.log("Exames resultados parseados do frontend:", exames.length);
        for (const e of exames) {
         await prisma.resultadoExame.create({
           data: {
             exameId: exame.id,
             // Usando encryptString para campos de texto dos resultados
             nome: encryptString(e.nome || ""),
             valor: encryptString(e.valor || ""),
             unidade: encryptString(e.unidade || ""),
             referencia: encryptString(e.referencia || ""), // Usar 'referencia' conforme a interface
           },
         });
        }
         console.log("Resultados de exames salvos no banco de dados.");
      } catch (parseError) {
         console.error("Erro ao parsear JSON de resultados de exames do frontend:", parseError);
         // Considere um tratamento de erro aqui
      }
    } else {
         console.log("Nenhum resultado de exame enviado do frontend.");
    }


    console.log("Exame e resultados processados com sucesso.");
    console.log("--- Fim do POST em /api/exames ---");
    return NextResponse.json({ message: "Exame cadastrado com sucesso!" });
  } catch (error) { // Catch principal
    console.error("Erro no handler POST de exames:", error);
    console.log("--- Fim do POST em /api/exames com erro ---");
    return NextResponse.json(
      { error: "Erro ao salvar o exame." },
      { status: 500 },
    );
  }
}

