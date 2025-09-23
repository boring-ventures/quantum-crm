import { getUserStoreSnapshot, isStoreAvailable } from "@/store/userStore";
import { authCircuitBreaker, authBackoff } from "./circuit-breaker";

// Tipos para el middleware (compatible con estructura original)
interface MiddlewareProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isDeleted?: boolean;
  roleId: string;
  permissions: any; // Los permisos van aquí, no separados
}

interface MiddlewareUserData {
  profile: MiddlewareProfile;
  cacheSource: "zustand" | "api" | "none";
}

/**
 * Obtener datos de usuario para middleware con cache inteligente
 * Prioridad: Zustand Store (si válido) -> API Fetch -> Error
 * MANTIENE COMPATIBILIDAD con middleware original
 */
export async function getUserForMiddleware(
  userId: string,
  request?: Request
): Promise<MiddlewareUserData | null> {
  const startTime = Date.now();
  console.log(
    `🔍 [MIDDLEWARE-CACHE] Solicitando datos para usuario: ${userId}`
  );

  // 1. Intentar obtener desde Zustand store primero
  if (isStoreAvailable()) {
    try {
      const store = getUserStoreSnapshot();
      const cachedUser = store.getUserFromCache();

      if (cachedUser && cachedUser.id === userId) {
        const responseTime = Date.now() - startTime;
        console.log(
          `✅ [MIDDLEWARE-CACHE] CACHE HIT - Usuario obtenido de Zustand (${responseTime}ms)`
        );
        console.log(
          `📊 [MIDDLEWARE-CACHE] ${store.getCacheStats().hits} hits, ${store.getCacheStats().misses} misses, ${store.getCacheStats().hitRatio}% hit ratio`
        );

        // Convertir a estructura compatible con middleware original
        return {
          profile: {
            id: cachedUser.id,
            email: cachedUser.email,
            name: cachedUser.name,
            role: cachedUser.role,
            isActive: cachedUser.isActive,
            isDeleted: cachedUser.isDeleted,
            roleId: cachedUser.roleId || "",
            permissions: cachedUser.userPermission?.permissions || {}, // Aquí van los permisos
          },
          cacheSource: "zustand",
        };
      } else if (cachedUser && cachedUser.id !== userId) {
        console.log(
          `⚠️ [MIDDLEWARE-CACHE] Cache HIT pero usuario diferente (${cachedUser.id} vs ${userId})`
        );
      } else {
        console.log(
          `❌ [MIDDLEWARE-CACHE] Cache MISS - Store vacío o expirado`
        );
      }
    } catch (error) {
      console.error(
        "❌ [MIDDLEWARE-CACHE] Error accediendo a Zustand store:",
        error
      );
    }
  } else {
    console.log(
      "⚠️ [MIDDLEWARE-CACHE] Zustand store no disponible (server-side)"
    );
  }

  // 2. Fallback: Obtener desde API HTTP con circuit breaker y timeout
  console.log(
    `🔄 [MIDDLEWARE-CACHE] Fetching desde API para usuario: ${userId}`
  );

  try {
    // Usar circuit breaker y exponential backoff para la llamada API
    const apiResponse = await authCircuitBreaker.call(async () => {
      return await authBackoff.execute(
        () => fetchUserFromAPIWithTimeout(userId, request, 10000), // 10s timeout
        `fetch-user-${userId}`
      );
    });

    if (!apiResponse) {
      console.log(
        `❌ [MIDDLEWARE-CACHE] Usuario no encontrado en API: ${userId}`
      );
      return null;
    }

    const responseTime = Date.now() - startTime;
    console.log(
      `✅ [MIDDLEWARE-CACHE] Usuario obtenido de API (${responseTime}ms)`
    );

    // 3. Actualizar Zustand store con datos frescos (si está disponible)
    if (isStoreAvailable() && apiResponse.profile) {
      try {
        const store = getUserStoreSnapshot();

        // Convertir de profile API a User para store
        const userForStore = {
          id: apiResponse.profile.id,
          email: apiResponse.profile.email,
          name: apiResponse.profile.name,
          role: apiResponse.profile.role,
          isActive: apiResponse.profile.isActive,
          isDeleted: apiResponse.profile.isDeleted || false,
          roleId: apiResponse.profile.roleId,
          userPermission: {
            id: apiResponse.profile.id,
            userId: apiResponse.profile.id,
            permissions: apiResponse.profile.permissions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        store.updateCache(userForStore as any);
        console.log(`✅ [MIDDLEWARE-CACHE] Cache actualizado en Zustand`);
        console.log(
          `📊 [MIDDLEWARE-CACHE] ${store.getCacheStats().hits} hits, ${store.getCacheStats().misses} misses, ${store.getCacheStats().hitRatio}% hit ratio`
        );
      } catch (error) {
        console.error("❌ [MIDDLEWARE-CACHE] Error actualizando cache:", error);
      }
    }

    return {
      profile: apiResponse.profile,
      cacheSource: "api",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(
      `❌ [MIDDLEWARE-CACHE] Error fetching desde API (${responseTime}ms):`,
      error
    );

    // Incrementar cache miss en store si está disponible
    if (isStoreAvailable()) {
      try {
        const store = getUserStoreSnapshot();
        store.incrementCacheMiss();
      } catch {}
    }

    return null;
  }
}

/**
 * Fetch desde API HTTP con timeout (compatible con Edge Runtime)
 * Devuelve estructura compatible con middleware original
 */
async function fetchUserFromAPIWithTimeout(
  userId: string,
  request?: Request,
  timeoutMs: number = 10000
): Promise<{ profile: MiddlewareProfile } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Construir URL del API endpoint
    const protocol = request?.headers?.get("x-forwarded-proto") || "http";
    const host = request?.headers?.get("host") || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/users/${userId}?requireAuth=false`;

    console.log(`🌐 [MIDDLEWARE-CACHE] API call: ${apiUrl} (timeout: ${timeoutMs}ms)`);

    // Hacer fetch con headers apropiados y timeout
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(request?.headers?.get("cookie")
          ? { Cookie: request.headers.get("cookie")! }
          : {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Distinguir entre errores de auth (403) y otros errores
      if (response.status === 403) {
        throw new Error(`AUTH_FORBIDDEN: ${response.status} ${response.statusText}`);
      }
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.profile) {
      return null;
    }

    console.log(`✅ [MIDDLEWARE-CACHE] API success for user: ${userId}`);
    // El API endpoint ya devuelve la estructura correcta con profile.permissions
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ [MIDDLEWARE-CACHE] API timeout (${timeoutMs}ms) for user: ${userId}`);
        throw new Error(`API_TIMEOUT: Request timed out after ${timeoutMs}ms`);
      }

      if (error.message.includes('AUTH_FORBIDDEN')) {
        console.error(`🚫 [MIDDLEWARE-CACHE] Auth forbidden for user: ${userId}`);
        throw new Error('AUTH_FORBIDDEN: Authentication failed');
      }
    }

    console.error(`❌ [MIDDLEWARE-CACHE] API error for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Obtener estadísticas del cache para logging/monitoring
 */
export function getCacheStatistics(): string {
  if (!isStoreAvailable()) {
    return "Cache stats: N/A (server-side)";
  }

  try {
    const store = getUserStoreSnapshot();
    const stats = store.getCacheStats();
    return `Cache stats: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRatio}% hit ratio`;
  } catch {
    return "Cache stats: Error accessing store";
  }
}

/**
 * Limpiar cache de usuario específico (útil para invalidación)
 */
export function invalidateUserCache(userId?: string): void {
  if (!isStoreAvailable()) return;

  try {
    const store = getUserStoreSnapshot();
    const currentUser = store.user;

    // Solo limpiar si coincide el usuario o no se especifica userId
    if (!userId || (currentUser && currentUser.id === userId)) {
      store.clearUser();
      console.log(
        `♻️ [MIDDLEWARE-CACHE] Cache invalidado para usuario: ${userId || "current"}`
      );
    }
  } catch (error) {
    console.error("❌ [MIDDLEWARE-CACHE] Error invalidando cache:", error);
  }
}
