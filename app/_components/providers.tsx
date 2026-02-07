"use client";

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '../_lib/errorHandler';
import { Toaster } from "./ui/toaster";
import AuthProvider from "../_providers/auth";
import { ThemeProvider } from "next-themes";
import { useSession } from 'next-auth/react'; // 1. Importar o hook useSession
import useAuthStore from '../_stores/authStore'; // 2. Importar nosso store

interface ProvidersProps {
  children: React.ReactNode;
}

// 3. Criar o componente de sincronização
const SyncAuthStore = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession(); // Hook do NextAuth para obter a sessão real
  const setAuthSession = useAuthStore((state) => state.setSession);
  const setAuthStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    // Sempre que a sessão ou o status do NextAuth mudar...
    if (session) {
      // ...atualiza a sessão no nosso store com os dados completos (incluindo a role).
      setAuthSession(session as any); // Usamos 'as any' para compatibilidade com o tipo customizado
    }
    // ...e atualiza o status.
    setAuthStatus(status);

  }, [session, status, setAuthSession, setAuthStatus]);

  return <>{children}</>;
};


const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <ThemeProvider attribute="class">
      {/* O AuthProvider original provê o contexto da sessão */}
      <AuthProvider>
        {/* O SyncAuthStore lê desse contexto e atualiza nosso store global */}
        <SyncAuthStore>{children}</SyncAuthStore>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default Providers;
