import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    console.log("API /auth/user-permissions - Iniciando obtención de permisos");

    // Verificar sesión activa
    const session = await auth();
    console.log(
      "API /auth/user-permissions - Estado de sesión:",
      session ? "Existe" : "Null"
    );

    if (!session?.user?.roleId) {
      console.log("API /auth/user-permissions - No hay roleId en la sesión");
      return NextResponse.json({ permissions: null }, { status: 200 });
    }

    console.log("API /auth/user-permissions - roleId:", session.user.roleId);

    try {
      // Usar URL absoluta para fetch con baseUrl
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

      const apiUrl = `${baseUrl}/api/roles/permissions?roleId=${session.user.roleId}`;
      console.log("API /auth/user-permissions - Consultando:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.log(
          "API /auth/user-permissions - Error en respuesta:",
          response.status
        );
        return NextResponse.json(
          { permissions: { sections: {} } },
          { status: 200 }
        );
      }

      const data = await response.json();
      console.log(
        "API /auth/user-permissions - Permisos obtenidos correctamente"
      );
      return NextResponse.json({ permissions: data.permissions });
    } catch (innerError) {
      console.error("Error al obtener permisos de rol:", innerError);
      // Devolver permisos vacíos en lugar de error para evitar problemas en el cliente
      return NextResponse.json(
        { permissions: { sections: {} } },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    // Devolver permisos vacíos en lugar de error
    return NextResponse.json(
      { permissions: { sections: {} } },
      { status: 200 }
    );
  }
}
