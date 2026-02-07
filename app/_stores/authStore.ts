import { create } from 'zustand';

// 1. Definição do tipo da sessão customizada (espelhando auth.ts)
// Esta é a mudança crucial. Agora o store "sabe" sobre role e permissions.
interface CustomSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    permissions?: string[] | null;
  };
  expires: string; // O tipo Session padrão tem a propriedade expires
}

type AuthState = {
  session: CustomSession | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
};

type AuthActions = {
  setSession: (session: CustomSession | null) => void;
  setStatus: (status: 'authenticated' | 'unauthenticated' | 'loading') => void;
  clearSession: () => void;
};

// 2. O store agora usa os tipos corretos
const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  status: 'loading',
  setSession: (session) => set({ session }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ session: null, status: 'unauthenticated' }),
}));

export default useAuthStore;
