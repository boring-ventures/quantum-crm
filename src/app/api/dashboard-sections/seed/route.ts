import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Datos iniciales para las secciones del dashboard
const initialSections = [
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Panel principal con resumen de actividades",
    icon: "LayoutDashboard",
    url: "/dashboard",
    displayOrder: 0,
  },
  {
    key: "leads",
    name: "Leads",
    description: "Gestión de leads y prospectos",
    icon: "User",
    url: "/leads",
    displayOrder: 1,
  },
  {
    key: "sales",
    name: "Ventas",
    description: "Gestión de ventas y oportunidades",
    icon: "ShoppingCart",
    url: "/sales",
    displayOrder: 2,
  },
  {
    key: "reports",
    name: "Reportes",
    description: "Informes y estadísticas",
    icon: "BarChart3",
    url: "/reportes",
    displayOrder: 3,
  },
  {
    key: "tasks",
    name: "Tareas",
    description: "Gestión de tareas y actividades",
    icon: "CalendarCheck",
    url: "/tareas",
    displayOrder: 4,
  },
  {
    key: "users",
    name: "Usuarios",
    description: "Gestión de usuarios del sistema",
    icon: "Users",
    url: "/users",
    displayOrder: 5,
  },
  {
    key: "admin",
    name: "Administración",
    description: "Configuración y administración del sistema",
    icon: "Settings",
    url: "",
    displayOrder: 6,
  },
  {
    key: "roles",
    name: "Roles y Permisos",
    description: "Gestión de roles y permisos de usuarios",
    icon: "UserCog",
    url: "/admin/roles",
    parentKey: "admin",
    displayOrder: 0,
  },
];

// POST /api/dashboard-sections/seed - Poblar la tabla con datos iniciales
export async function POST() {
  try {
    // Verificar si ya existen registros (evitar duplicados)
    const existingCount = await prisma.dashboardSection.count();

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ya existen secciones en la base de datos. La operación de sembrado solo debe ejecutarse en una base de datos vacía.",
        },
        { status: 400 }
      );
    }

    // Crear las secciones
    const createdSections = await prisma.dashboardSection.createMany({
      data: initialSections,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Se han creado ${createdSections.count} secciones iniciales`,
        count: createdSections.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding dashboard sections:", error);
    return NextResponse.json(
      { success: false, error: "Error al poblar las secciones del dashboard" },
      { status: 500 }
    );
  }
}
