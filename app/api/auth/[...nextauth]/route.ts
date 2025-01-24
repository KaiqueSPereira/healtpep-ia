// /app/api/auth/[...nextauth]/route.ts
import { db } from "@/app/_lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // Usando JWT para sessões
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Segredo para tokens JWT
  },
  callbacks: {
    async session({ session, token }) {
      // Adiciona o ID do usuário na sessão
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Adiciona o ID do usuário no token JWT
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  logger: {
    // Log de erros para debugging
    error(code, ...message) {
      console.error("[NextAuth Error]", code, ...message);
    },
  },
});

export { handler as GET, handler as POST };
