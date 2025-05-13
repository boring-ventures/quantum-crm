import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidPermissionsObject } from "@/lib/utils/permissions";

export async function GET(request: Request) {
  try {
    console.log("API /roles/permissions - Iniciando consulta");

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    console.log("API /roles/permissions - roleId solicitado:", roleId);

    if (!roleId) {
      console.log("API /roles/permissions - Error: roleId faltante");
      return NextResponse.json(
        { success: false, error: "Se requiere el ID del rol" },
        { status: 400 }
      );
    }

    // Buscar el rol por ID
    console.log("API /roles/permissions - Consultando rol en DB");
    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
        isActive: true,
      },
    });

    console.log(
      "API /roles/permissions - Resultado de consulta:",
      role ? "Rol encontrado" : "Rol no encontrado"
    );

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado o inactivo" },
        { status: 404 }
      );
    }

    // Convertir las cadenas JSON de permisos a objetos
    let permissions;
    try {
      console.log(
        "API /roles/permissions - Permisos en formato string:",
        role.permissions ? "Presentes" : "Ausentes"
      );
      permissions = JSON.parse(role.permissions as string);

      // Validar que el objeto de permisos tiene la estructura correcta
      if (!isValidPermissionsObject(permissions)) {
        console.log(
          "API /roles/permissions - Error: Estructura de permisos inválida"
        );
        throw new Error("Estructura de permisos inválida");
      }

      console.log("API /roles/permissions - Permisos parseados correctamente");
    } catch (error) {
      console.error(
        "API /roles/permissions - Error al parsear permisos:",
        error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Error al procesar los permisos del rol",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 500 }
      );
    }

    console.log("API /roles/permissions - Enviando respuesta exitosa");
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
