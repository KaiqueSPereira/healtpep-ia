import { create } from 'zustand';
import { Session } from 'next-auth';

type AuthState = {
  session: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
};

type AuthActions = {
  setSession: (session: Session | null) => void;
  setStatus: (status: 'authenticated' | 'unauthenticated' | 'loading') => void;
  clearSession: () => void;
};

const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  status: 'loading',
  setSession: (session) => set({ session }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ session: null, status: 'unauthenticated' }),
}));

export default useAuthStore;
