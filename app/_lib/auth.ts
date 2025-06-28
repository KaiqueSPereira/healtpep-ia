import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions} from "next-auth";
import { db } from "./prisma";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

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
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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