import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

const STORAGE_KEY = "user-storage";

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      fetchUser: async () => {
        if (get().user || get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const user = await getCurrentUser();
          if (!get().user) {
            set({ user, isLoading: false });
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      setUser: (user) => set({ user, isLoading: false, error: null }),
      clearUser: () => {
        // Limpiar el estado
        set({ user: null, error: null, isLoading: false });

        // Limpiar el storage manualmente
        try {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
            window.sessionStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          console.error("Error al limpiar storage:", error);
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        error: state.error,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
