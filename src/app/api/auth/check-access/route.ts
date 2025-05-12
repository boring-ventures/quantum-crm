import { NextResponse } from "next/server";
import { canAccess } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Obtener ruta solicitada del cuerpo
    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== "string") {
      return NextResponse.json({ hasAccess: false }, { status: 200 });
    }

    try {
      // Verificar si el usuario puede acceder a la ruta
      const hasAccess = await canAccess(path);
      return NextResponse.json({ hasAccess });
    } catch (authError) {
      console.error("Error al verificar acceso a ruta:", authError);
      return NextResponse.json({ hasAccess: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error al verificar acceso:", error);
    return NextResponse.json({ hasAccess: false }, { status: 200 });
  }
}
