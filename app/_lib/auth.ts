
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

// As declarações de tipo estão centralizadas no arquivo `types/next-auth.d.ts`

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  // Usar estratégia de sessão JWT é crucial para que o callback `jwt` seja invocado.
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
        console.log(`Perfil padrão 'USER' atribuído ao novo usuário: ${message.user.id}`);
      } else {
        console.error("CRÍTICO: O perfil padrão 'USER' não foi encontrado no banco. Novos usuários não terão um perfil.");
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
          // Garante que apenas o NOME (string) do perfil seja injetado no token
          token.role = userFromDb.role.name;
          token.permissions = userFromDb.role.permissions.map(p => p.permission.name);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // As informações da sessão agora vêm diretamente do token JWT
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
