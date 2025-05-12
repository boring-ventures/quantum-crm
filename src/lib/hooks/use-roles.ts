import { useEffect, useState } from "react";
import type { Role } from "@/types/role";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/roles");

        if (!response.ok) {
          throw new Error("Error al obtener roles");
        }

        const data = await response.json();
        setRoles(data.roles);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error desconocido"));
        console.error("Error al obtener roles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, isLoading, error };
}
