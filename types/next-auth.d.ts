
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Arquivo central para estender os tipos do NextAuth

declare module "next-auth" {
  /**
   * Estende a interface da Sessão para incluir as propriedades customizadas.
   */
  interface Session {
    accessToken?: string;
    user: {
      /** O ID do usuário no banco de dados. */
      id: string;
      /** O perfil do usuário (ex: ADMIN, USER) como uma string. */
      role: string | null;
      /** A lista de permissões associadas ao perfil. */
      permissions?: string[] | null;
    } & DefaultSession["user"]; 
  }
}

declare module "next-auth/jwt" {
  /**
   * Estende o token JWT para incluir as propriedades customizadas.
   */
  interface JWT {
    accessToken?: string;
    /** O perfil do usuário (ex: ADMIN, USER) como uma string. */
    role: string | null;
    /** A lista de permissões associadas ao perfil. */
    permissions?: string[] | null;
  }
}
