import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { decryptString, decrypt } from "@/app/_lib/crypto"; // Adicionando importação de decrypt


// Função auxiliar para tentar descriptografar usando ambos os métodos
function tryDecrypt(encryptedValue: string | null | undefined): string | null {
  if (encryptedValue === null || encryptedValue === undefined) {
    return null;
  }
  try {
    // Tenta o método mais recente (compatível com safeDecrypt/encryptString)
    return decryptString(encryptedValue);
  } catch (e) {
    // Se falhar, tenta o método hexadecimal anterior
    try {
      // Verifica se a string pode ser hex (uma verificação simples)
      if (/^[0-9a-fA-F]+$/.test(encryptedValue)) {
         return decrypt(Buffer.from(encryptedValue, 'hex')).toString();
      } else {
         // Se não for hex, provavelmente é um formato inválido mesmo para o método antigo
         console.warn("Tentativa de descriptografia hex falhou: valor não parece ser hexadecimal", encryptedValue);
         return null; // Ou retorne um placeholder como "[Valor Criptografado Inválido]"
      }
    } catch (hexError) {
      console.error("Erro na descriptografia (ambos os métodos falharam):", hexError, "Valor:", encryptedValue);
      return null; // Retorna null se ambos os métodos falharem
      // Ou retorne um placeholder como "[Falha na Descriptografia]"
    }
  }
}


type Resultado = {
  id: string;
  exameId: string;
  nome: string;
  valor: string;
  unidade?: string | null;
  referencia?: string | null;
};

type Exame = {
  id: string;
  userId: string;
  nome: string;
  dataExame: Date;
  anotacao?: string | null;
  nomeArquivo?: string | null;
  profissionalId?: string | null;
  unidadeSaudeId?: string | null; // Corrigido de unidadesId para unidadeSaudeId conforme o schema? Ou verificar o schema.
  consultaId?: string | null;
  resultados: Resultado[];
};


export async function GET(req: NextRequest) {
   console.log("--- Início do GET em /api/exames/graficos ---");
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
     console.log("Usuário não autenticado no GET de gráficos.");
     console.log("--- Fim do GET em /api/exames/graficos ---");
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exames = await prisma.exame.findMany({
      where: {
        userId,
      },
      include: {
        resultados: true,
      },
      orderBy: {
        dataExame: 'asc', // Mantido ascendente para gráficos temporais
      },
    });

     console.log(`Encontrados ${exames.length} exames para gráficos.`);

    const decryptedExames = exames.map(exame => {
       // Usando a função auxiliar tryDecrypt
      const decryptedNome = tryDecrypt(exame.nome);
      const decryptedAnotacao = tryDecrypt(exame.anotacao);
      const decryptedNomeArquivo = tryDecrypt(exame.nomeArquivo);


       const decryptedResultados = exame.resultados.map(resultado => ({
        ...resultado,
         // Usando a função auxiliar tryDecrypt para os resultados
        nome: tryDecrypt(resultado.nome) || '', // Retorna string vazia se falhar para nome (obrigatório)
        valor: tryDecrypt(resultado.valor) || '', // Retorna string vazia se falhar para valor (obrigatório)
        unidade: tryDecrypt(resultado.unidade),
        referencia: tryDecrypt(resultado.referencia),
      }));

       // Filtrar resultados inválidos se necessário, ou lidar com eles no frontend
       // Por exemplo, se 'nome' ou 'valor' não puderem ser descriptografados, o resultado pode ser problemático.

      return {
        ...exame,
        nome: decryptedNome,
        anotacao: decryptedAnotacao,
        nomeArquivo: decryptedNomeArquivo,
        resultados: decryptedResultados,
      };
    });

    console.log("Exames descriptografados para gráficos.");
    console.log("--- Fim do GET em /api/exames/graficos ---");
    return NextResponse.json(decryptedExames, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exames para gráficos:", error);
    console.log("--- Fim do GET em /api/exames/graficos com erro ---");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
