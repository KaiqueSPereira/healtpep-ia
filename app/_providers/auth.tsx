"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import useAuthStore from "../_stores/authStore";

// Componente auxiliar para sincronizar a sessão do NextAuth com o store do Zustand
const AuthSync = () => {
  const { data: session, status } = useSession();
  const { setSession, setStatus } = useAuthStore();

  useEffect(() => {
    setSession(session);
    setStatus(status);
  }, [session, status, setSession, setStatus]);

  return null; // Este componente não renderiza nada na UI
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
};

export default AuthProvider;
