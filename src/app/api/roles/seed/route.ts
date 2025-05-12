import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  createSalesRolePermissions,
  createManagerRolePermissions,
  createAdminRolePermissions,
  createSuperAdminRolePermissions,
} from "@/lib/utils/permissions";

// Datos iniciales para los roles
const initialRoles = [
  {
    name: "Vendedor",
    permissions: createSalesRolePermissions(),
    isActive: true,
  },
  {
    name: "Gerente",
    permissions: createManagerRolePermissions(),
    isActive: true,
  },
  {
    name: "Administrador",
    permissions: createAdminRolePermissions(),
    isActive: true,
  },
  {
    name: "Super Administrador",
    permissions: createSuperAdminRolePermissions(),
    isActive: true,
  },
];

// POST /api/roles/seed - Poblar la tabla con datos iniciales
export async function POST() {
  try {
    // Verificar si ya existen registros (evitar duplicados)
    const existingCount = await prisma.role.count();

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ya existen roles en la base de datos. La operación de sembrado solo debe ejecutarse en una base de datos vacía.",
        },
        { status: 400 }
      );
    }

    // Crear roles uno por uno para asegurar que la estructura JSON se guarda correctamente
    const createdRoles: Role[] = [];

    for (const roleData of initialRoles) {
      const roleWithStringifiedPermissions = {
        ...roleData,
        // Convertir el objeto de permisos a string JSON
        permissions: JSON.stringify(roleData.permissions),
      };

      const newRole = await prisma.role.create({
        data: roleWithStringifiedPermissions,
      });
      createdRoles.push(newRole);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Se han creado ${createdRoles.length} roles iniciales`,
        data: createdRoles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding roles:", error);
    return NextResponse.json(
      { success: false, error: "Error al poblar los roles" },
      { status: 500 }
    );
  }
}
