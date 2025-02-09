"use server";

import { Consultatype } from "@prisma/client";
import { db } from "../_lib/prisma";


interface createConsultaParams {
    queixas: string;
    data: Date;
    tratamento: string;
    tipodeexame: string;
    tipo: string;
    userId: string;
    profissionalId: string;
    unidadeId: string;
}

export const createConsulta = async (params: createConsultaParams) => {
    await db.consultas.create({
        data: params
    });

        }