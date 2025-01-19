import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/app/_lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Consulta para pegar os valores distintos de `Consultatype` (campo `tipo`)
    const consultaTipos = await db.consultas.findMany({
      select: {
        tipo: true,
      },
      distinct: ["tipo"], // Garantir que venha somente valores únicos do enum
    });

    // Retorna os tipos de consulta encontrados
    res.status(200).json(consultaTipos.map((consulta) => consulta.tipo));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar os tipos de consulta" });
  }
}
