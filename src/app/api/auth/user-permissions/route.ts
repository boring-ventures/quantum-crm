import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Verificar sesión activa
    const session = await auth();
    if (!session?.user?.roleId) {
      return NextResponse.json({ permissions: null }, { status: 200 });
    }

    try {
      // Usar URL absoluta para fetch con baseUrl
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(
        `${baseUrl}/api/roles/permissions?roleId=${session.user.roleId}`
      );

      if (!response.ok) {
        return NextResponse.json(
          { permissions: { sections: {} } },
          { status: 200 }
        );
      }

      const data = await response.json();
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
