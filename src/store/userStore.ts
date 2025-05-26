import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";
import { getCurrentUser } from "@/lib/utils/auth-utils";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null, error: null }),
    }),
    {
      name: "user-storage",
      // Solo persistimos el usuario, no el estado de carga o errores
      partialize: (state) => ({ user: state.user }),
    }
  )
);
