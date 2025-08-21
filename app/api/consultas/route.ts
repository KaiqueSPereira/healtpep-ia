import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { encryptString, safeDecrypt } from "@/app/_lib/crypto";
import { Anotacoes, Prisma } from '@prisma/client';
import { Session } from "next-auth";


// Função auxiliar para obter a sessão e o ID do usuário autenticado
const getUserSessionAndId = async (): Promise<{ session: Session | null, userId: string | null }> => {
  const session = await getServerSession(authOptions);
  // Use optional chaining para evitar erros se session ou user forem null
  if (!session?.user?.id) {
    return { session: null, userId: null };
  }
  return { session, userId: session.user.id };
};


// 📌 GET - Buscar consultas ou tipos de consulta
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Se a query string "tipo=true" estiver presente, retorna os tipos de consulta (ENUM.)
    if (searchParams.get("tipo") === "true") {
      // Nota: Raw queries podem ser menos seguras e portáteis.
      // Se possível, considere uma alternativa baseada no schema do Prisma.
      const consultaTipos: { tipo: string }[] = await db.$queryRaw`
        SELECT e.enumlabel AS tipo
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Consultatype';
      `;
      return NextResponse.json(consultaTipos.map((row) => row.tipo));
    }

    // --- INÍCIO DA CORREÇÃO PARA FILTRAR POR USUÁRIO ---
    const { userId } = await getUserSessionAndId();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }
    // --- FIM DA CORREÇÃO PARA FILTRAR POR USUÁRIO ---


    // 📌 Paginação das consultas
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Use Prisma.ConsultasGetPayload para tipar o resultado com as inclusões
    // Esta é a forma mais confiável de tipar o resultado de queries complexas do Prisma
    type ConsultaWithRelations = Prisma.ConsultasGetPayload<{
      include: {
        usuario: { select: { name: true, email: true } };
        profissional: { select: { id: true, nome: true, especialidade: true } };
        unidade: { select: { id: true, nome: true } };
        Anotacoes: true;
        Tratamento: true; // Verifique no seu schema se Tratamento é uma relação 1:1 ou 1:N.
                         // Se for 1:N (uma consulta tem múltiplos tratamentos), mude para Tratamento: true,
                         // e ajuste a tipagem aqui e no map para Tratamento: Tratamento[].
      };
    }>;


    const consultas: ConsultaWithRelations[] = await db.consultas.findMany({ // Tipagem aqui
      where: {
        userId: userId // <--- Adiciona filtro pelo ID do usuário
        // Ou se a relação no seu schema for 'usuario' e não 'userId': usuario: { id: userId }
      },
      include: {
        usuario: { select: { name: true, email: true } },
        profissional: { select: { id: true, nome: true, especialidade: true } },
        unidade: { select: { id: true, nome: true } },
        Anotacoes: true, // Assumindo que é Anotacoes e é uma lista
        Tratamento: true, // Assumindo que é Tratamento e é um objeto único ou null
      },
      orderBy: { data: "desc" }, // Alterado para ordenar da mais recente para a mais antiga
    });


    const decryptedConsultas = consultas.map(consulta => {
      const decryptedMotivo = consulta.motivo ? safeDecrypt(consulta.motivo) : null;

      // Use a tipagem correta para o map de Anotacoes (lista de Anotacoes)
      const decryptedAnotacoes = consulta.Anotacoes.map((anotacao: Anotacoes) => ({
            ...anotacao,
            anotacao: safeDecrypt(anotacao.anotacao),
        }));

       // Verifique se tipodeexame existe antes de descriptografar, e inclua a verificação do tipo
       // Ajuste 'consulta.tipodeexame' se o campo no seu schema for diferente
       const decryptedTipoExame = typeof consulta.tipodeexame === 'string' && consulta.tipodeexame ? safeDecrypt(consulta.tipodeexame) : null;


      return {
        ...consulta,
        motivo: decryptedMotivo,
        Anotacoes: decryptedAnotacoes,
        tipodeexame: decryptedTipoExame,
        // Se Tratamento for uma lista (1:N), você pode precisar descriptografar campos dentro dele também
        // Se for um objeto único (1:1), a descriptografia pode ser feita aqui diretamente se necessário
      };
    });

    // Se você incluiu os objetos inteiros ou usou 'select' para partes específicas,
    // a estrutura do objeto retornado estará de acordo com a tipagem 'ConsultaWithRelations'.
    return NextResponse.json({ consultas: decryptedConsultas, page, limit });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
     // Melhorar a mensagem de erro em caso de erro do Prisma ou outro
    let errorMessage = "Erro ao buscar os dados";
    if (error instanceof Error) {
        errorMessage = `Erro ao buscar os dados: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

// 📌 POST - Criar uma nova consulta
export async function POST(req: Request) {
  try {
    const { session, userId } = await getUserSessionAndId();

    if (!session || !userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const {
      data,
      tipo,
      profissionalId,
      unidadeId,
      tratamentoId,
      queixas,
      tipoexame, // Mantido para consistência com a lógica de criptografia
    } = body;

    // Determinar o motivo para criptografar (queixas ou tipoexame)
    // Use 'tipoexame' do body diretamente para a lógica
    const motivoParaCriptografar = tipo === "Exame" ? tipoexame : queixas;

    if (!data || !tipo || motivoParaCriptografar === undefined || motivoParaCriptografar === null) {
         // Ajuste a validação para permitir string vazia se for o caso
        const missingFields = [];
        if (!data) missingFields.push("data");
        if (!tipo) missingFields.push("tipo");
        // Verifica se o motivo não é undefined nem null
        if (motivoParaCriptografar === undefined || motivoParaCriptografar === null) {
           missingFields.push("motivo (queixas ou tipo de exame)");
        }
        return NextResponse.json(
            { error: `Campos obrigatórios faltando: ${missingFields.join(", ")}` },
            { status: 400 }
        );
    }


    const encryptedMotivo = encryptString(motivoParaCriptografar);

    // Criptografa tipodeexame apenas se o tipo for "Exame" E tipoexame existir e não for null/undefined
    const encryptedTipoExame = tipo === "Exame" && tipoexame !== undefined && tipoexame !== null ? encryptString(tipoexame) : null;


    const novaConsulta = await db.consultas.create({
      data: {
        userId: userId, // Associa a consulta ao usuário autenticado
        data: new Date(data),
        tipo,
        profissionalId: profissionalId || null,
        unidadeId: unidadeId || null,
        motivo: encryptedMotivo, // Inclui queixas ou tipoexame criptografado aqui
        tipodeexame: encryptedTipoExame, // Inclui tipoexame criptografado (se for exame)
        // Use connect apenas se tratamentoId existir
        Tratamento: tratamentoId ? { connect: { id: tratamentoId } } : undefined,
      },
    });


  return NextResponse.json(novaConsulta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar consulta:", error);
     // Melhorar a mensagem de erro em caso de erro do Prisma ou outro
    let errorMessage = "Erro ao criar consulta";
    if (error instanceof Error) {
        errorMessage = `Erro ao criar consulta: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
