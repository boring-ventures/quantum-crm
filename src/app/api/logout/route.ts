import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    // Obtener cliente Supabase con las cookies del servidor
    const supabase = createRouteHandlerClient({ cookies });

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Crear respuesta con encabezados para eliminar cookies
    const response = NextResponse.json(
      { success: true, message: "Sesión cerrada correctamente" },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json(
      { success: false, message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
