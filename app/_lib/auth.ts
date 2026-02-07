
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import { db } from "./prisma";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

// --- Verificação de Sanidade ---
if (!db) {
  throw new Error(
    "O cliente Prisma (db) não foi encontrado ou não inicializou corretamente. " +
    "Verifique a sua conexão à base de dados e o aviso sobre o OpenSSL nos logs. "
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("As variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórias.");
}
// --- Fim da Verificação de Sanidade ---

// 1. Declarar a nova estrutura da sessão para o TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // O nome do perfil (ex: "ADMIN")
      permissions?: string[] | null; // A lista de permissões (ex: ["manage_users"])
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
  
  // 2. Evento para atribuir o perfil padrão na criação do usuário
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
        console.log(`Perfil padrão 'USER' atribuído ao novo usuário: ${message.user.id}`);
      } else {
        console.error("CRÍTICO: O perfil padrão 'USER' não foi encontrado no banco. Novos usuários não terão um perfil.");
      }
    },
  },

  callbacks: {
    // 3. Injetar o perfil e as permissões no objeto da sessão
    async session({ session, user }) {
      if (session.user) {
        const userFromDb = await db.user.findUnique({
          where: { id: user.id },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });
        
        const roleName = userFromDb?.role?.name ?? null;
        const permissions = userFromDb?.role?.permissions.map(p => p.permission.name) ?? [];

        session.user = {
          ...session.user,
          id: user.id,
          role: roleName,
          permissions: permissions,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
