import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { safeDecrypt, encryptString } from "@/app/_lib/crypto";
// import { getServerSession } from "next-auth";

interface ConsultaParams {
  params: { consultaId: string };
}

// 📌 GET - Buscar uma consulta específica
export async function GET(_request: Request, { params }: ConsultaParams) {
  try {
    const consulta = await db.consultas.findUnique({
      where: { id: params.consultaId },
      include: {
        profissional: true,
        unidade: true,
        usuario: true,
        Anotacoes: true, // Assumindo que é Anotacoes no schema do Prisma
        Exame: true, // Assumindo que é Exame no schema do Prisma
      },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    // Decrypt sensitive fields
    const decryptedConsulta = {
      ...consulta,
      motivo: consulta.motivo ? safeDecrypt(consulta.motivo) : null,
      tipodeexame: consulta.tipodeexame ? safeDecrypt(consulta.tipodeexame) : null,
       // Certifique-se de que Anotacoes existe antes de mapear
      Anotacoes: consulta.Anotacoes ? consulta.Anotacoes.map((anotacao: any) => ({
        ...anotacao,
        anotacao: safeDecrypt(anotacao.anotacao),
      })) : [], // Retorna array vazio se não houver Anotacoes
      // Certifique-se de que Exame existe antes de mapear
      Exame: consulta.Exame ? consulta.Exame.map((exame: any) => ({
          ...exame,
          resultado: exame.resultado ? safeDecrypt(exame.resultado) : null,
      })) : [], // Retorna array vazio se não houver Exame
    };

    return NextResponse.json(decryptedConsulta);

  } catch (error: any) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(request: Request, { params }: ConsultaParams) {
  try {
    const body = await request.json();
    // Remover anotacaoId e anotacao do body, pois este PATCH é para a consulta
    const { motivo, tipodeexame, anotacaoId, anotacao, ...rest } = body;

    let dataToUpdate: any = { ...rest };

    if (motivo !== undefined) {
      dataToUpdate.motivo = motivo ? encryptString(motivo) : null;
    }

    if (tipodeexame !== undefined) {
      dataToUpdate.tipodeexame = tipodeexame ? encryptString(tipodeexame) : null;
    }

    const consultaAtualizada = await db.consultas.update({
      where: { id: params.consultaId },
      data: dataToUpdate,
      include: { profissional: true, unidade: true, usuario: true },
    });

    return NextResponse.json(consultaAtualizada);

  } catch (error: any) {
    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar consulta" },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Deletar uma consulta
export async function DELETE(_request: Request, { params }: ConsultaParams) {
  try {
    await db.consultas.delete({ where: { id: params.consultaId } });

    return NextResponse.json(
      { message: "Consulta deletada com sucesso" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar consulta" },
      { status: 500 },
    );
  }
}
