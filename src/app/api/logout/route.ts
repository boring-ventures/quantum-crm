import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  try {
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Eliminar cookies relacionadas con Supabase
    const response = NextResponse.redirect(
      new URL(
        "/sign-in",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      )
    );

    response.cookies.set("sb-access-token", "", {
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set("sb-refresh-token", "", {
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    // Redirigir a la página de inicio de sesión incluso si hay error
    return NextResponse.redirect(
      new URL(
        "/sign-in",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      )
    );
  }
}
