import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Ruta simplificada para obtener usuarios
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const active = url.searchParams.get("active") === "true";
    const role = url.searchParams.get("role");
    const countryId = url.searchParams.get("countryId");
    const scope = url.searchParams.get("scope");

    // Construir el filtro de búsqueda
    const where: any = {};

    // Filtrar por active
    if (active !== null) {
      where.isActive = active;
    }

    // Filtrar por role
    if (role) {
      where.role = role;
    }

    // Filtrar por countryId
    if (countryId) {
      where.countryId = countryId;
    }

    // Consulta para todos los usuarios
    const users = await prisma.user.findMany({
      where,
      include: {
        userPermission: scope === "self",
        country: true,
      },
    });

    // Si se especifica scope=self, filtrar solo usuarios con scope "self"
    if (scope === "self") {
      const filteredUsers = users.filter((user) => {
        if (!user.userPermission?.permissions) return false;

        try {
          const permissions =
            typeof user.userPermission.permissions === "string"
              ? JSON.parse(user.userPermission.permissions)
              : user.userPermission.permissions;

          // Verificar si el permiso de leads.view es "self"
          return permissions.leads?.view === "self";
        } catch (e) {
          return false;
        }
      });

      return NextResponse.json({
        users: filteredUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          country: user.country,
        })),
      });
    }

    // Devolver la lista de usuarios simplificada
    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        country: user.country,
      })),
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
