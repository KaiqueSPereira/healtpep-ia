
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
    const exams = await prisma.exame.findMany({
      where: {
        userId: userId,
      },
      include: {
        resultados: true, // Include the related ResultadoExame records
        profissional: true, // Include the related Profissional record
        unidades: true, // Include the related UnidadeSaude record - Corrected from unidadeSaude
      },
      orderBy: {
        dataExame: 'desc', // Order by date in descending order
      },
    });

    console.log(`Encontrados ${exams.length} exames para o usuário ${userId}.`);

    const decryptedExams = exams.map((exame) => {
      // Decrypt exam fields, handling potential nulls
      const decryptedNome = exame.nome ? safeDecrypt(exame.nome) : null;
      const decryptedNomeArquivo = exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null;
      const decryptedAnotacao = exame.anotacao ? safeDecrypt(exame.anotacao) : null;

      return {
        ...exame,
        nome: decryptedNome,
        nomeArquivo: decryptedNomeArquivo,
        anotacao: decryptedAnotacao,
        resultados: exame.resultados.map((resultado) => ({
          ...resultado,
          nome: resultado.nome ? safeDecrypt(resultado.nome) : null, // Handle null
          valor: resultado.valor ? safeDecrypt(resultado.valor) : null, // Handle null
          unidade: resultado.unidade ? safeDecrypt(resultado.unidade) : null, // Handle null
          referencia: resultado.referencia ? safeDecrypt(resultado.referencia) : null, // Handle null
        })),
      };
    });

    console.log("Exames descriptografados para exibição.");
    console.log("--- Fim do GET em /api/exames ---");
    return NextResponse.json(decryptedExams);
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
    console.log("--- Fim do GET em /api/exames com erro ---");
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
    const unidadesId = formData.get("unidadesId")?.toString();
    const consultaId = formData.get("consultaId")?.toString() || null;
    const tratamentoId = formData.get("tratamentoId")?.toString() || null;
    const anotacao = formData.get("anotacao")?.toString() || ""; // Anotação agora vem do frontend
    const dataExame = formData.get("dataExame")?.toString();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo")?.toString();
    const examesRaw = formData.get("exames")?.toString(); // Os resultados agora vêm do frontend em JSON stringificadoconst tipo = formData.get("tipo")?.toString();


    console.log("Dados extraídos do FormData:", {
      profissionalId,
      unidadesId,
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
      !unidadesId ||
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
        unidadesId,
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

