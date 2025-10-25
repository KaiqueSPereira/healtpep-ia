
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import { db } from "./prisma";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

// --- Verificação de Sanidade ---
// Lança um erro claro se o cliente Prisma não inicializou.
// Isto está muito provavelmente ligado ao aviso do OpenSSL que você está a ver.
if (!db) {
  throw new Error(
    "O cliente Prisma (db) não foi encontrado ou não inicializou corretamente. " +
    "Verifique a sua conexão à base de dados e o aviso sobre o OpenSSL nos logs. " +
    "Resolva o problema do ambiente (ex: instale o OpenSSL) e reinstale as dependências do Prisma."
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Lança um erro claro se as variáveis de ambiente essenciais para a autenticação não estiverem definidas.
if (!googleClientId || !googleClientSecret) {
  throw new Error("As variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórias e não foram encontradas.");
}
// --- Fim da Verificação de Sanidade ---

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Garante que session.user tenha um ID
      session.user = {
        ...session.user,
        id: user.id, // Agora o TypeScript reconhece o ID corretamente
      };

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
