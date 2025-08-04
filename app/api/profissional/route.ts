// app/api/profissional/route.ts
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth"; // Importar getServerSession para obter a sessão
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/_lib/auth"; // Importar suas opções de autenticação

// Definição do schema para validação dos dados de criação
const profissionalCreateSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio."),
  especialidade: z.string().min(1, "A especialidade e obrigatoria."),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio."),
  // No POST, podemos receber um array de IDs de unidades para conectar
  unidadeIds: z.array(z.string().uuid("ID da unidade invalido.")).optional(),
});

// Método GET (Listar todos os profissionais, ou buscar por ID via query param - opcional)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const profissionalId = url.searchParams.get("id"); // Manter a busca por ID via query param se necessário

  if (profissionalId) {
    // Lógica de buscar um único profissional por ID via query param
    try {
      const profissional = await db.profissional.findUnique({
        where: { id: profissionalId },
        // Incluir apenas as relações que esta rota de GET único (via query) precisa
        // Para a tela de DETALHES, usaremos a rota dinâmica /api/profissional/[id] que já tem mais includes
        include: { unidades: true, usuario: true }, // Exemplo: incluir unidades e usuário
      });

      if (!profissional) {
        return NextResponse.json(
          { error: "Profissional não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json(profissional);
    } catch (error) {
      console.error("Erro ao buscar profissional por ID (query param):", error);
      return NextResponse.json(
        { error: "Falha ao buscar o profissional" },
        { status: 500 },
      );
    }
  } else {
    // Lógica de listar todos os profissionais
    // Obter a sessão do usuário logado
    const session = await getServerSession(authOptions); // Usar authOptions para obter a sessão

    // Verificar se o usuário está autenticado
    if (!session || !session.user || !session.user.id) {
 return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }
    try {
      const profissionais = await db.profissional.findMany({
        where: { userId: session.user.id }, // Filtrar pelos profissionais do usuário logado
        // Incluir as relações que a listagem precisa (geralmente menos que os detalhes)
        include: { unidades: true, usuario: true },
      });
      return NextResponse.json(profissionais);
    } catch (error) {
      console.error("Erro ao buscar todos os profissionais:", error);
      return NextResponse.json(
        { error: "Falha ao buscar os profissionais" },
        { status: 500 },
      );
    }
  }
}

// Método POST (Criar um novo profissional)
export async function POST(req: Request) {
  try {
    // Obter a sessão do usuário logado
    const session = await getServerSession(authOptions); // Usar authOptions para obter a sessão

    // Verificar se o usuário está autenticado
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await req.json();

    // Validar os dados de criação (agora sem userId no schema, pois será obtido da sessão)
    const parsedData = profissionalCreateSchema.parse(body);

    // Usar o ID do usuário logado obtido da sessão
    const userId = session.user.id;

    const novoprofissional = await db.profissional.create({
      data: {
        nome: parsedData.nome,
        especialidade: parsedData.especialidade,
        NumClasse: parsedData.NumClasse,
        userId: userId, // Adicionar o userId do usuário logado
        // Lógica para conectar a múltiplas unidades na criação
        unidades: {
          connect: parsedData.unidadeIds?.map(id => ({ id })) || [], // Conecta a unidades se IDs forem fornecidos
        },
      },
      include: { // Incluir unidades e usuário na resposta do POST
        unidades: true,
        usuario: true,
      }
    });

    return NextResponse.json(novoprofissional, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar o profissional:", error);
    // Tratar erros de validação do Zod
    if (error instanceof z.ZodError) {
         return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    const errorMessage = (error as Error).message || "Falha ao cadastrar o profissional";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }, // Usar status 500 para erros não relacionados a validação de input
    );
  }
}
