import { NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Obtener roles solicitados del cuerpo
    const body = await request.json();
    const { roles } = body;

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json({ hasRole: false }, { status: 200 });
    }

    try {
      // Verificar sesión activa
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ hasRole: false }, { status: 200 });
      }

      // Verificar si el usuario tiene alguno de los roles
      const userHasRole = await hasRole(roles);
      return NextResponse.json({ hasRole: userHasRole });
    } catch (authError) {
      console.error("Error al verificar autenticación:", authError);
      return NextResponse.json({ hasRole: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error al verificar rol:", error);
    return NextResponse.json({ hasRole: false }, { status: 200 });
  }
}
