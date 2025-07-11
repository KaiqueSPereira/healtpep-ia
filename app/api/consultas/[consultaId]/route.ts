import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { safeDecrypt, encryptString } from "@/app/_lib/crypto";
// import { getServerSession } from "next-auth";

interface ConsultaParams {
  params: { consultaId: string };
}

// Interfaces simples baseadas no uso no código
interface Anotacao {
  id: string;
  anotacao: string;
  consultaId: string;
  createdAt: Date;
  updatedAt: Date;
  // Adicione outras propriedades se forem usadas
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
      Anotacoes: consulta.Anotacoes ? consulta.Anotacoes.map((anotacao: Anotacao) => ({ // Usando a interface Anotacao
        ...anotacao,
        anotacao: safeDecrypt(anotacao.anotacao),
      })) : [], // Retorna array vazio se não houver Anotacoes
      
      Exame: consulta.Exame ? consulta.Exame.map((exame) => {
      return {
        ...exame,
        // Trate as propriedades conforme solicitado
        tipo: typeof exame.tipo === 'string' ? safeDecrypt(exame.tipo) : exame.tipo, // Verifique o tipo antes de descriptografar
        anotacao: typeof exame.anotacao === 'string' ? safeDecrypt(exame.anotacao) : exame.anotacao, // Verifique o tipo
        dataExame: typeof exame.dataExame === 'object' ? exame.dataExame.toISOString() : exame.dataExame, // Converte Date para ISO string
      };
     }) : [], // Retorna array vazio se não houver Exame
    };

    return NextResponse.json(decryptedConsulta);

  } catch (error) { 
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
    const { motivo, tipodeexame, ...rest } = body; // Removido anotacaoId e anotacao

    const dataToUpdate = { ...rest }; // Mudado para const e removido : any

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

  } catch (error) { // Removido ': any'
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
  } catch (error) { // Removido ': any'
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar consulta" },
      { status: 500 },
    );
  }
}
