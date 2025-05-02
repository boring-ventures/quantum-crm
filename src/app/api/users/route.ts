import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para crear usuarios
const createUserSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar permisos de administrador
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userRole: true },
    });

    // Verificar si el usuario tiene permisos para crear usuarios
    // Esto debe adaptarse según la estructura de permisos de la aplicación
    const permissions =
      (currentUser?.userRole?.permissions as Record<string, any>) || {};
    if (!permissions.users?.create && currentUser?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No tienes permiso para crear usuarios" },
        { status: 403 }
      );
    }

    // Validar datos de entrada
    const json = await request.json();
    const validationResult = createUserSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de usuario inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, email, password, roleId } = validationResult.data;

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: "El rol seleccionado no existe" },
        { status: 400 }
      );
    }

    // Crear usuario en Supabase Auth
    const { data: authUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirmar email
      });

    if (createUserError) {
      return NextResponse.json(
        {
          error: "Error al crear usuario en el sistema de autenticación",
          details: createUserError.message,
        },
        { status: 500 }
      );
    }

    // Crear usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        id: authUser.user.id,
        name,
        email,
        role: role.name,
        roleId: role.id,
        isActive: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      include: {
        userRole: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
