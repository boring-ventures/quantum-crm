import { useAuth } from "@/providers/auth-provider";
import { useCallback, useRef } from "react";

export function useAuthErrorHandler() {
  const { showReauthModal } = useAuth();
  const lastErrorTime = useRef<number>(0);
  const errorCount = useRef<number>(0);

  const handleAuthError = useCallback((error: any, shouldShowModal: boolean = true) => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const now = Date.now();

    // Resetear contador si han pasado más de 30 segundos desde el último error
    if (now - lastErrorTime.current > 30000) {
      errorCount.current = 0;
    }

    lastErrorTime.current = now;
    errorCount.current++;

    // Solo mostrar modal después de múltiples errores seguidos o errores críticos
    const shouldTriggerModal = shouldShowModal && (
      errorCount.current >= 3 || // 3 errores en 30 segundos
      errorMessage.includes('AUTH_EXPIRED') ||
      errorMessage.includes('Session expired') ||
      errorMessage.includes('Token expired') ||
      errorMessage.includes('jwt expired')
    );

    // Errores de autenticación expirada (críticos)
    if (
      errorMessage.includes('AUTH_EXPIRED') ||
      errorMessage.includes('Session expired') ||
      errorMessage.includes('Token expired') ||
      errorMessage.includes('jwt expired')
    ) {
      if (shouldTriggerModal) {
        showReauthModal('expired');
      }
      return true;
    }

    // Errores de permisos insuficientes
    if (
      errorMessage.includes('AUTH_FORBIDDEN') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('insufficient permissions') ||
      error.status === 403
    ) {
      if (shouldTriggerModal) {
        showReauthModal('forbidden');
      }
      return true;
    }

    // Errores de autenticación inválida (solo después de múltiples fallos)
    if (
      errorMessage.includes('AUTH_INVALID') ||
      errorMessage.includes('Invalid credentials') ||
      errorMessage.includes('Unauthorized') ||
      error.status === 401
    ) {
      if (shouldTriggerModal) {
        console.warn(`[AUTH] Error 401 detectado (${errorCount.current}/3). ${errorCount.current >= 3 ? 'Activando modal...' : 'Esperando más errores...'}`);
        showReauthModal('invalid');
      }
      return true;
    }

    // Error de circuit breaker
    if (errorMessage.includes('Circuit breaker is OPEN')) {
      if (shouldTriggerModal) {
        showReauthModal('invalid');
      }
      return true;
    }

    return false; // No es un error de autenticación
  }, [showReauthModal]);

  return { handleAuthError };
}

// Hook para envolver fetch con manejo automático de errores de auth
export function useAuthFetch() {
  const { handleAuthError } = useAuthErrorHandler();

  const authFetch = useCallback(async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    try {
      const response = await fetch(input, init);

      // Manejar errores de autenticación automáticamente
      if (response.status === 401 || response.status === 403) {
        const error = {
          status: response.status,
          message: response.status === 401 ? 'AUTH_EXPIRED' : 'AUTH_FORBIDDEN'
        };
        handleAuthError(error);
      }

      return response;
    } catch (error) {
      // Intentar manejar el error de autenticación
      const handled = handleAuthError(error);

      // Si no es un error de auth, propagar el error original
      if (!handled) {
        throw error;
      }

      // Crear una respuesta vacía para errores de auth manejados
      return new Response(null, { status: 401 });
    }
  }, [handleAuthError]);

  return { authFetch };
}