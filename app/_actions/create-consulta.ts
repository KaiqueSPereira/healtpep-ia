"use server";

import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { Consultatype } from "@prisma/client";


interface createConsultaParams {
    queixas: string;
    data: Date;
    tratamento: string;
    tipodeexame: string;
    tipo: Consultatype;
    profissionalId: string;
    unidadeId: string;
}

export const createConsulta = async (params: createConsultaParams) => {
    const user = await getServerSession(authOptions)
    if (!user) {
        throw new Error("Usuário não autenticado")
    }
    
    await db.consultas.create({
        data: {...params, userId: (user.user as { id: string }).id}
    });

        }