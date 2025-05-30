import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Verificar sesión activa
    const session = await auth();
    if (!session?.user?.roleId) {
      console.log("user-permissions: No hay roleId en la sesión");
      return NextResponse.json({ permissions: null }, { status: 200 });
    }

    try {
      // Usar URL absoluta para fetch con baseUrl

      const isProduction = !!process.env.VERCEL_URL;

      // Seleccionar URL base según el entorno
      let baseUrl: string | URL | undefined;
      if (isProduction) {
        // En producción, usar dominio principal
        baseUrl = "https://quantum-crm-leads.vercel.app";
      } else {
        // En desarrollo local, usar localhost
        baseUrl = "http://localhost:3000";
      }

      const fetchUrl = `${baseUrl}/api/roles/permissions?roleId=${session.user.roleId}`;
      console.log("user-permissions: Consultando", fetchUrl);

      const response = await fetch(fetchUrl);

      if (!response.ok) {
        console.error(
          "Error al obtener permisos:",
          response.status,
          await response
            .text()
            .catch(() => "No se pudo leer el cuerpo de la respuesta")
        );
        return NextResponse.json({ permissions: {} }, { status: 200 });
      }

      const data = await response.json();

      // Validar que permissions existe
      if (!data.permissions) {
        console.error("No se encontraron permisos en la respuesta", data);
        return NextResponse.json({ permissions: {} }, { status: 200 });
      }

      console.log("user-permissions: Permisos obtenidos correctamente");

      // Retornar los permisos tal como vienen
      return NextResponse.json({ permissions: data.permissions });
    } catch (innerError) {
      console.error("Error al obtener permisos de rol:", innerError);
      // Devolver permisos vacíos en lugar de error para evitar problemas en el cliente
      return NextResponse.json({ permissions: {} }, { status: 200 });
    }
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    // Devolver permisos vacíos en lugar de error
    return NextResponse.json({ permissions: {} }, { status: 200 });
  }
}
