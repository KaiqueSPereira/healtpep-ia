"use server";

import { Consultatype } from "@prisma/client";
import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";


interface createConsultaParams {
    queixas: string;
    data: Date;
    tratamento: string;
    tipodeexame: string;
    tipo: string;
    profissionalId: string;
    unidadeId: string;
}

export const createConsulta = async (params: createConsultaParams) => {
    const user = await getServerSession(authOptions)
    if (!user) {
        throw new Error("Usuário não autenticado")
    }
    
    await db.consultas.create({
        data: {...params, userId: (user.user as any).id}
    });

        }