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
    (set, get) => ({
      user: null,
      isLoading: false,
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
      clearUser: () => set({ user: null, error: null, isLoading: false }),
    }),
    {
      name: "user-storage",
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
