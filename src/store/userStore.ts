import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/user";
import { getCurrentUser } from "@/lib/utils/auth-utils";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheHits: number;
  cacheMisses: number;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  // Nuevos métodos para optimización de middleware
  isStale: (ttlMinutes?: number) => boolean;
  getUserFromCache: () => User | null;
  updateCache: (user: User) => void;
  getCacheStats: () => { hits: number; misses: number; hitRatio: number };
  incrementCacheHit: () => void;
  incrementCacheMiss: () => void;
}

const STORAGE_KEY = "user-storage";
const DEFAULT_TTL_MINUTES = 15; // Cache válido por 15 minutos

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      lastFetched: null,
      cacheHits: 0,
      cacheMisses: 0,

      fetchUser: async () => {
        if (get().user || get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const user = await getCurrentUser();
          if (!get().user) {
            set({
              user,
              isLoading: false,
              lastFetched: Date.now(),
              cacheMisses: get().cacheMisses + 1,
            });
          }
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
            cacheMisses: get().cacheMisses + 1,
          });
        }
      },

      setUser: (user) =>
        set({
          user,
          isLoading: false,
          error: null,
          lastFetched: user ? Date.now() : null,
        }),

      clearUser: () => {
        // Limpiar el estado
        set({
          user: null,
          error: null,
          isLoading: false,
          lastFetched: null,
          cacheHits: 0,
          cacheMisses: 0,
        });

        // Limpiar el storage manualmente
        try {
          if (typeof window !== "undefined") {
            // Eliminar específicamente el storage de este store
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);

            // Limpiar también cualquier otra clave que pueda estar relacionada
            localStorage.removeItem(`${STORAGE_KEY}-v1`);
            sessionStorage.removeItem(`${STORAGE_KEY}-v1`);
          }
        } catch (error) {
          console.error("Error al limpiar storage:", error);
        }
      },

      // Verificar si el cache está expirado
      isStale: (ttlMinutes = DEFAULT_TTL_MINUTES) => {
        const state = get();
        if (!state.user || !state.lastFetched) return true;

        const now = Date.now();
        const maxAge = ttlMinutes * 60 * 1000; // convertir a milliseconds
        return now - state.lastFetched > maxAge;
      },

      // Obtener usuario del cache si es válido
      getUserFromCache: () => {
        const state = get();

        if (!state.user || state.isStale()) {
          if (state.user) {
            console.log("[CACHE] Usuario en cache pero expirado");
          }
          return null;
        }

        // Incrementar contador de cache hits
        set({ cacheHits: state.cacheHits + 1 });
        console.log(
          `[CACHE] Hit - Usuario obtenido del cache. Hits: ${state.cacheHits + 1}`
        );
        return state.user;
      },

      // Actualizar cache con datos frescos
      updateCache: (user) => {
        const state = get();
        set({
          user,
          lastFetched: Date.now(),
          error: null,
          isLoading: false,
          cacheMisses: state.cacheMisses + 1,
        });
        console.log(
          `[CACHE] Usuario actualizado en cache. Misses: ${state.cacheMisses + 1}`
        );
      },

      // Obtener estadísticas del cache
      getCacheStats: () => {
        const state = get();
        const totalRequests = state.cacheHits + state.cacheMisses;
        const hitRatio =
          totalRequests > 0 ? (state.cacheHits / totalRequests) * 100 : 0;

        return {
          hits: state.cacheHits,
          misses: state.cacheMisses,
          hitRatio: Math.round(hitRatio * 100) / 100,
        };
      },

      incrementCacheHit: () => {
        set({ cacheHits: get().cacheHits + 1 });
      },

      incrementCacheMiss: () => {
        set({ cacheMisses: get().cacheMisses + 1 });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        error: state.error,
        lastFetched: state.lastFetched,
        cacheHits: state.cacheHits,
        cacheMisses: state.cacheMisses,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          // Log de rehydration stats
          if (state.cacheHits || state.cacheMisses) {
            const stats = state.getCacheStats();
            console.log(
              `[CACHE] Rehydrated - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Ratio: ${stats.hitRatio}%`
            );
          }
        }
      },
    }
  )
);

// Función utilitaria para acceder al store desde contextos no-React (como middleware)
export const getUserStoreSnapshot = () => {
  return useUserStore.getState();
};

// Función para verificar disponibilidad del store (server-side safe)
export const isStoreAvailable = () => {
  try {
    return typeof window !== "undefined" && !!useUserStore.getState;
  } catch {
    return false;
  }
};
