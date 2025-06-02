import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/users/[id] - Obtener usuario por ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Verificar que el ID solicitado es válido
    const { id: userId } = context.params; // sin await

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Verificar si es una petición que requiere validación de autenticación
    const url = new URL(request.url);
    const requireAuth = url.searchParams.get("requireAuth") !== "false";

    // Si se requiere autenticación, verificarla
    if (requireAuth) {
      try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
          cookies: () => cookieStore,
        });
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Solo loguear, no bloquear la petición
          console.log("Advertencia: Petición sin autenticación");
          // También podríamos retornar error si queremos ser estrictos en ciertos contextos
          // return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
      } catch (authError) {
        console.error("Error al verificar autenticación:", authError);
        // No bloqueamos la petición por error de autenticación
      }
    }

    // Obtener el usuario de Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Adaptar la respuesta para mantener compatibilidad con la API anterior
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      roleId: user.roleId,
      permissions: user.userRole?.permissions || {},
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(
      "Error al obtener usuario:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    return NextResponse.json(
      { error: "Error al obtener datos del usuario" },
      { status: 500 }
    );
  }
}
