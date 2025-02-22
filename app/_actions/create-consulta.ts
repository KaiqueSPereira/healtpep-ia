"use server";

import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { Consultatype } from "@prisma/client";
import { z } from "zod";

interface CreateConsultaParams {
  queixas?: string;
  data: string;
  tratamento?: string;
  tipodeexame?: string;
  tipo: Consultatype;
  profissionalId?: string;
  unidadeId?: string;
}

// 📌 Validação com Zod
const consultaSchema = z
  .object({
    data: z
      .string()
      .datetime({
        message:
          "A data e hora são obrigatórias e devem estar no formato correto.",
      }),
    tipo: z.enum(["Rotina", "Tratamento", "Retorno", "Exame", "Emergencia"]),
    profissionalId: z.string().uuid().optional(),
    unidadeId: z.string().uuid().optional(),
    queixas: z.string().optional(),
    tratamento: z.string().optional(),
    tipodeexame: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "Emergencia" && (!data.queixas || !data.unidadeId)) {
        return false;
      }
      if (
        ["Rotina", "Tratamento", "Retorno"].includes(data.tipo) &&
        (!data.tratamento || !data.profissionalId || !data.unidadeId)
      ) {
        return false;
      }
      if (
        data.tipo === "Exame" &&
        (!data.tipodeexame || !data.profissionalId || !data.unidadeId)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Campos obrigatórios faltando para o tipo de consulta selecionado.",
    },
  );

// 📌 Função para criar uma nova consulta
export const createConsulta = async (params: CreateConsultaParams) => {
  const user = await getServerSession(authOptions);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // 📌 Validação antes de salvar no banco
  const parsedData = consultaSchema.parse(params);

 await db.consultas.create({
   data: {
     data: new Date(parsedData.data),
     tipo: parsedData.tipo,
     userId: (user.user as { id: string }).id,
     profissionalId: parsedData.profissionalId ?? "", // Garante que será string
     unidadeId: parsedData.unidadeId ?? "", // Garante que será string
     queixas: parsedData.queixas ?? "", // Garante que será string
     tratamento: parsedData.tratamento ?? "", // Garante que será string
     tipodeexame: parsedData.tipodeexame ?? "", // Garante que será string
   },
 });


};
