import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidPermissionsObject } from "@/lib/utils/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "Se requiere el ID del rol" },
        { status: 400 }
      );
    }

    // Buscar el rol por ID
    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
        isActive: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado o inactivo" },
        { status: 404 }
      );
    }

    // Convertir las cadenas JSON de permisos a objetos
    let permissions;
    try {
      permissions = JSON.parse(role.permissions as string);

      // Validar que el objeto de permisos tiene la estructura correcta
      if (!isValidPermissionsObject(permissions)) {
        throw new Error("Estructura de permisos inválida");
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Error al procesar los permisos del rol",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los permisos del rol" },
      { status: 500 }
    );
  }
}
