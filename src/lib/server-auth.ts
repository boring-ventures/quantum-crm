"use server";

/**
 * Archivo de utilidades de autenticación seguras que pueden ser importadas por
 * componentes cliente. Este archivo solo expone funciones específicas que son seguras
 * para usar en cualquier contexto.
 */

/**
 * Verifica si el usuario actual tiene uno de los roles especificados.
 * Versión segura para componentes cliente que llama a una API en lugar de acceder directamente a auth.
 */
export async function checkUserRole(roleNames: string[]): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/check-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roles: roleNames }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.hasRole;
  } catch (error) {
    console.error("Error verificando rol:", error);
    return false;
  }
}

/**
 * Verifica si el usuario puede acceder a una ruta específica.
 * Versión segura para componentes cliente que llama a una API en lugar de acceder directamente a auth.
 */
export async function checkRouteAccess(path: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/check-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.hasAccess;
  } catch (error) {
    console.error("Error verificando acceso a ruta:", error);
    return false;
  }
}
