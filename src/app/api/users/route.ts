import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/client";

// Esquemas de validación
const createUserSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  id: z.string({ required_error: "El ID de usuario es obligatorio" }),
  name: z.string().min(2, { message: "El nombre es requerido" }).optional(),
  email: z.string().email({ message: "Email inválido" }).optional(),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const deleteUserSchema = z.object({
  id: z.string({ required_error: "El ID de usuario es obligatorio" }),
});

// Tipo para los permisos de usuario
type UserPermissions = {
  sections?: {
    users?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
    };
    [key: string]: any;
  };
  [key: string]: any;
};

// Función auxiliar para verificar autorización
async function checkAuthorization(supabase: any) {
  // Verificar autenticación
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  // Verificar permisos de administrador
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userRole: true },
  });

  console.log("currentUser", currentUser?.userRole?.permissions);

  if (!currentUser) {
    return {
      authorized: false,
      session,
      response: NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      ),
    };
  }

  // Verificar si el usuario tiene permisos para gestionar usuarios
  let userPermissions: UserPermissions = {};

  try {
    // Si el usuario tiene un rol asignado, obtener sus permisos
    if (currentUser.userRole?.permissions) {
      // Convertir a objeto si viene como string
      if (typeof currentUser.userRole.permissions === "string") {
        userPermissions = JSON.parse(
          currentUser.userRole.permissions as string
        );
      } else {
        userPermissions = currentUser.userRole.permissions as any;
      }
    } else if (currentUser.roleId) {
      // Buscar el rol si existe roleId pero no está incluido el userRole
      const role = await prisma.role.findUnique({
        where: { id: currentUser.roleId },
      });

      if (role?.permissions) {
        // Convertir a objeto si viene como string
        if (typeof role.permissions === "string") {
          userPermissions = JSON.parse(role.permissions as string);
        } else {
          userPermissions = role.permissions as any;
        }
      }
    }

    const hasPermission =
      userPermissions.sections?.users?.view === true &&
      (userPermissions.sections?.users?.create === true ||
        userPermissions.sections?.users?.edit === true ||
        userPermissions.sections?.users?.delete === true);

    console.log("hasPermission", hasPermission);

    if (!hasPermission) {
      return {
        authorized: false,
        session,
        currentUser,
        response: NextResponse.json(
          { error: "No tienes permisos suficientes para gestionar usuarios" },
          { status: 403 }
        ),
      };
    }
  } catch (error) {
    console.error("Error al verificar permisos:", error);
    return {
      authorized: false,
      session,
      currentUser,
      response: NextResponse.json(
        { error: "Error al verificar permisos" },
        { status: 500 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    currentUser,
    permissions: userPermissions,
  };
}

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(request.url);

    // Extraer parámetros de consulta
    const roleParam = url.searchParams.get("role");

    // Verificar autorización
    const auth = await checkAuthorization(supabase);
    if (!auth.authorized) return auth.response;

    // Verificar si tiene permiso para ver usuarios
    if (!auth.permissions?.sections?.users?.view) {
      return NextResponse.json(
        { error: "No tienes permiso para ver usuarios" },
        { status: 403 }
      );
    }

    // Construir condiciones de consulta
    const where: any = {};

    // Filtrar por rol si se especifica
    if (roleParam) {
      where.role = roleParam;
    }

    // Obtener los usuarios con filtros aplicados
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        isActive: true,
        role: true,
        userRole: {
          select: {
            id: true,
            name: true,
          },
        },
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

// POST - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autorización
    const auth = await checkAuthorization(supabase);
    if (!auth.authorized) return auth.response;

    // Verificar si tiene permiso para crear usuarios
    if (!auth.permissions?.sections?.users?.create) {
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

    const {
      name,
      email,
      password,
      roleId,
      isActive = true,
    } = validationResult.data;

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
    const { data: authData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          name,
        },
      });

    if (createUserError || !authData.user) {
      return NextResponse.json(
        {
          error: "Error al crear usuario en el sistema de autenticación",
          details: createUserError?.message || "Usuario no creado",
        },
        { status: 500 }
      );
    }

    // Crear usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role: role.name,
        roleId: role.id,
        isActive,
      },
    });

    // Registrar en el changelog
    try {
      await prisma.activityLog.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "CREATE",
          description: `Usuario ${user.name} creado con rol ${role.name}`,
          performedById: auth.session.user.id,
        },
      });
    } catch (logError) {
      console.error("Error al registrar actividad:", logError);
    }

    // Devolver el usuario creado
    return NextResponse.json(
      {
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un usuario existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autorización
    const auth = await checkAuthorization(supabase);
    if (!auth.authorized) return auth.response;

    // Verificar si tiene permiso para editar usuarios
    if (!auth.permissions?.sections?.users?.edit) {
      return NextResponse.json(
        { error: "No tienes permiso para editar usuarios" },
        { status: 403 }
      );
    }

    // Validar datos de entrada
    const json = await request.json();
    const validationResult = updateUserSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de usuario inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { id, name, email, password, roleId, isActive } =
      validationResult.data;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si se actualiza el rol, verificar que existe
    let roleName = "";
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return NextResponse.json(
          { error: "El rol seleccionado no existe" },
          { status: 400 }
        );
      }

      roleName = role.name;
    }

    // Actualizar contraseña en Supabase Auth si se proporciona
    if (password) {
      const { error: updatePasswordError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { password });

      if (updatePasswordError) {
        return NextResponse.json(
          {
            error: "Error al actualizar la contraseña",
            details: updatePasswordError.message,
          },
          { status: 500 }
        );
      }
    }

    // Actualizar email en Supabase Auth si se proporciona
    if (email && email !== existingUser.email) {
      const { error: updateEmailError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { email });

      if (updateEmailError) {
        return NextResponse.json(
          {
            error: "Error al actualizar el email",
            details: updateEmailError.message,
          },
          { status: 500 }
        );
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (roleId) {
      updateData.roleId = roleId;
      updateData.role = roleName;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un usuario
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autorización
    const auth = await checkAuthorization(supabase);
    if (!auth.authorized) return auth.response;

    // Verificar si tiene permiso para eliminar usuarios
    if (!auth.permissions?.sections?.users?.delete) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar usuarios" },
        { status: 403 }
      );
    }

    // Obtener el ID del usuario a eliminar
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario no proporcionado" },
        { status: 400 }
      );
    }

    // Validar ID
    const validationResult = deleteUserSchema.safeParse({ id });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ID de usuario inválido",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Prevenir eliminación de uno mismo
    if (id === auth.session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 403 }
      );
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRole: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener información del rol del usuario actual (que está realizando la eliminación)
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        userRole: true,
      },
    });

    if (!currentUser || !currentUser.userRole) {
      return NextResponse.json(
        { error: "No se pudo verificar tu rol" },
        { status: 403 }
      );
    }

    // Prevenir eliminación de Super Administrador a menos que uno mismo sea Super Administrador
    const isSuperAdmin = targetUser.userRole?.name === "Super Administrador";
    const currentIsSuperAdmin =
      currentUser.userRole.name === "Super Administrador";

    if (isSuperAdmin && !currentIsSuperAdmin) {
      return NextResponse.json(
        { error: "No puedes eliminar un usuario Super Administrador" },
        { status: 403 }
      );
    }

    // Verificar si quedaría algún usuario activo después de la eliminación
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        isDeleted: false,
        id: {
          not: id,
        },
      },
    });

    if (activeUsers === 0) {
      return NextResponse.json(
        { error: "No puedes eliminar el último usuario activo" },
        { status: 403 }
      );
    }

    // Si el usuario a eliminar es Super Administrador, solo desactivarlo
    if (isSuperAdmin) {
      await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      // Registrar en el changelog
      await prisma.activityLog.create({
        data: {
          entityType: "USER",
          entityId: id,
          action: "DEACTIVATE",
          description: `Usuario ${targetUser.name} (Super Administrador) desactivado`,
          performedById: auth.session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Usuario Super Administrador desactivado",
      });
    }

    // Para usuarios no Super Administrador, marcar como eliminado
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: auth.session.user.id,
      },
    });

    // Registrar en el changelog
    await prisma.activityLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        action: "DELETE",
        description: `Usuario ${targetUser.name} eliminado por ${currentUser.name}`,
        performedById: auth.session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
