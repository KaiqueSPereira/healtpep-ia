
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/app/_lib/prisma";
import 'server-only';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("As variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórias.");
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: { strategy: "jwt" }, 
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  
  events: {
    async createUser(message) {
      const userRole = await db.role.findUnique({
        where: { name: 'USER' },
      });

      if (userRole) {
        await db.user.update({
          where: { id: message.user.id },
          data: { roleId: userRole.id },
        });
      } else {
        console.error("CRÍTICO: O perfil padrão 'USER' não foi encontrado no banco.");
      }
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userFromDb = await db.user.findUnique({
          where: { id: user.id },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        });

        if (userFromDb && userFromDb.role) {
          token.role = userFromDb.role.name;
          token.permissions = userFromDb.role.permissions.map(p => p.permission.name);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
