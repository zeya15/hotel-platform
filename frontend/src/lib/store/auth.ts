import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ token: null, refreshToken: null }),
    }),
    { name: "auth-storage" }
  )
);
