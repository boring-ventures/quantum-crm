import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Crear cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Eliminar cookies relacionadas con Supabase
    const cookieStore = cookies();
    // En Next.js, debemos utilizar el objeto ResponseCookie para modificar cookies
    // Establecer cookies con fecha de expiración en el pasado para eliminarlas
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
