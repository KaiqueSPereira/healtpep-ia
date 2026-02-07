
import { DefaultSession, DefaultUser } from 'next-auth';

// Defina a estrutura do seu objeto 'role'
interface Role {
  id: string;
  name: string;
}

// Estenda a interface User para incluir a propriedade 'role'
declare module 'next-auth' {
  interface User extends DefaultUser {
    role?: Role | null; // A role pode ser opcional ou nula
  }

  interface Session extends DefaultSession {
    user?: User | null; // Garante que a sessão use o nosso User estendido
  }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: Role | null;
    }
}

