// app/api/profissional/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

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
        include: { unidades: true }, // Exemplo: incluir apenas unidades para esta rota se necessário
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
    try {
      const profissionais = await db.profissional.findMany({
        // Incluir as relações que a listagem precisa (geralmente menos que os detalhes)
        include: { unidades: true }, // Exemplo: incluir unidades para a lista
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
    const body = await req.json();
    // Validação dos dados de criação
    const parsedData = profissionalCreateSchema.parse(body);

    const novoprofissional = await db.profissional.create({
      data: {
        nome: parsedData.nome,
        especialidade: parsedData.especialidade,
        NumClasse: parsedData.NumClasse,
        // Lógica para conectar a múltiplas unidades na criação
        unidades: {
          connect: parsedData.unidadeIds?.map(id => ({ id })) || [], // Conecta a unidades se IDs forem fornecidos
        },
      },
      include: { // Opcional: Incluir unidades na resposta do POST
        unidades: true,
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
