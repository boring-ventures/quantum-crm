import { useAuth } from "@/providers/auth-provider";
import { useCallback } from "react";

export function useAuthErrorHandler() {
  const { showReauthModal } = useAuth();

  const handleAuthError = useCallback((error: any) => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();

    // Errores de autenticación expirada
    if (
      errorMessage.includes('AUTH_EXPIRED') ||
      errorMessage.includes('Session expired') ||
      errorMessage.includes('Token expired') ||
      errorMessage.includes('jwt expired')
    ) {
      showReauthModal('expired');
      return true;
    }

    // Errores de permisos insuficientes
    if (
      errorMessage.includes('AUTH_FORBIDDEN') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('insufficient permissions') ||
      error.status === 403
    ) {
      showReauthModal('forbidden');
      return true;
    }

    // Errores de autenticación inválida
    if (
      errorMessage.includes('AUTH_INVALID') ||
      errorMessage.includes('Invalid credentials') ||
      errorMessage.includes('Unauthorized') ||
      error.status === 401
    ) {
      showReauthModal('invalid');
      return true;
    }

    // Error de circuit breaker
    if (errorMessage.includes('Circuit breaker is OPEN')) {
      showReauthModal('invalid');
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