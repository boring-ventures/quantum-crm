import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    console.log("API /auth/user-permissions - Iniciando obtención de permisos");

    // Verificar sesión activa
    const session = await auth();
    console.log(
      "API /auth/user-permissions - Estado de sesión:",
      session ? "Existe" : "Null"
    );

    // Si no hay sesión, intentar verificar directamente con Supabase antes de dar por fallido
    if (!session?.user?.roleId) {
      console.log(
        "API /auth/user-permissions - No hay roleId en la sesión, comprobando sesión directamente"
      );

      try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
          cookies: () => cookieStore,
        });

        const {
          data: { session: supabaseSession },
          error,
        } = await supabase.auth.getSession();

        if (error || !supabaseSession) {
          console.log(
            "API /auth/user-permissions - No hay sesión válida en Supabase"
          );
          return NextResponse.json({ permissions: null }, { status: 200 });
        }

        // Si hay sesión en Supabase pero no en auth(), podría ser un problema de sincronización
        console.log(
          "API /auth/user-permissions - Sesión encontrada en Supabase pero no en auth()"
        );
        console.log(
          "API /auth/user-permissions - Usuario de Supabase:",
          supabaseSession.user.id
        );

        // Obtener el perfil del usuario para encontrar el roleId
        const response = await fetch(
          `${process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || "http://localhost:3000"}/api/users/${supabaseSession.user.id}?requireAuth=false`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          console.log(
            "API /auth/user-permissions - Error al obtener perfil de usuario desde API"
          );
          return NextResponse.json({ permissions: null }, { status: 200 });
        }

        const { profile } = await response.json();

        if (!profile?.roleId) {
          console.log("API /auth/user-permissions - Perfil sin roleId");
          return NextResponse.json({ permissions: null }, { status: 200 });
        }

        console.log(
          "API /auth/user-permissions - roleId recuperado de API:",
          profile.roleId
        );
        // Continuar con este roleId
        return await getPermissionsFromRoleId(profile.roleId);
      } catch (directCheckError) {
        console.error(
          "API /auth/user-permissions - Error al verificar sesión directamente:",
          directCheckError
        );
        return NextResponse.json({ permissions: null }, { status: 200 });
      }
    }

    console.log("API /auth/user-permissions - roleId:", session.user.roleId);
    return await getPermissionsFromRoleId(session.user.roleId);
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    // Devolver permisos vacíos en lugar de error
    return NextResponse.json(
      { permissions: { sections: {} } },
      { status: 200 }
    );
  }
}

// Función auxiliar para obtener los permisos desde un roleId
async function getPermissionsFromRoleId(roleId: string) {
  try {
    // Usar URL absoluta para fetch con baseUrl
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const apiUrl = `${baseUrl}/api/roles/permissions?roleId=${roleId}`;
    console.log("API /auth/user-permissions - Consultando:", apiUrl);

    const response = await fetch(apiUrl, { cache: "no-store" });

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
}
