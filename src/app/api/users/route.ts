import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getScope_user, hasPermission } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";

// Esquemas de validación
const createUserSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
  countryId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  user_permissions: z.record(z.any()).optional(),
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
  countryId: z.string().optional(),
  isActive: z.boolean().optional(),
  user_permissions: z.record(z.any()).optional(),
});

const deleteUserSchema = z.object({
  id: z.string({ required_error: "El ID de usuario es obligatorio" }),
});

// GET - Obtener usuarios
export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/users - Iniciando solicitud GET");
    const currentUser = await getCurrentUser();
    console.log(
      "[API] /api/users - Usuario actual:",
      currentUser?.id,
      currentUser?.email
    );

    // Verificar permiso directamente y mostrar el resultado
    const hasViewPermission = hasPermission(currentUser, "users", "view");
    console.log(
      "[API] /api/users - ¿Tiene permiso users.view?",
      hasViewPermission
    );

    // Verificar permiso (este era el comentario original)
    if (!hasViewPermission) {
      console.log("[API] /api/users - ACCESO DENEGADO: Sin permiso users.view");
      return NextResponse.json(
        { error: "No tienes permiso para ver usuarios", permission: false },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const role = searchParams.get("role");
    const active = searchParams.get("active") === "true";
    const countryId = searchParams.get("countryId");
    const scope = searchParams.get("scope");
    console.log("[API] /api/users - Parámetros:", {
      includeDeleted,
      role,
      active,
      countryId,
      scope,
    });

    // Obtener el usuario actual completo para verificar país
    const currentUserInfo = await prisma.user.findUnique({
      where: { id: currentUser?.id },
      include: { userPermission: true, country: true },
    });
    console.log(
      "[API] /api/users - Usuario encontrado:",
      currentUserInfo
        ? { id: currentUserInfo.id, role: currentUserInfo.role }
        : "No encontrado"
    );

    if (!currentUserInfo) {
      console.log("[API] /api/users - ERROR: Usuario no encontrado");
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Determinar el scope para "users.view" basado en los permisos del usuario
    let userScope: string | boolean = "all"; // Por defecto para Super Admin

    if (currentUserInfo.userPermission?.permissions) {
      // Extraer permisos
      const permissions =
        typeof currentUserInfo.userPermission.permissions === "string"
          ? JSON.parse(currentUserInfo.userPermission.permissions)
          : currentUserInfo.userPermission.permissions;

      console.log("[API] /api/users - Permisos del usuario:", permissions);

      // Verificar módulo users
      if (permissions.users) {
        const viewPermission = permissions.users.view;
        console.log("[API] /api/users - Permiso users.view:", viewPermission);

        // Si es un string de scope, usar ese scope
        if (
          typeof viewPermission === "string" &&
          ["self", "team", "all"].includes(viewPermission)
        ) {
          userScope = viewPermission;
        }
        // Si es booleano false, no hay acceso
        else if (viewPermission === false) {
          userScope = false;
        }
      } else {
        userScope = false;
      }
    }

    console.log("[API] /api/users - Scope determinado:", userScope);

    // Criterios base de búsqueda
    const whereClause: any = {};

    // Filtrar por eliminados solo si se solicita explícitamente
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    // Filtrar por rol si se especifica
    if (role) {
      whereClause.role = role;
    }

    // Filtrar por active si se especifica
    if (active !== null) {
      whereClause.isActive = active;
    }

    // Filtrar por countryId si se especifica
    if (countryId) {
      whereClause.countryId = countryId;
    }

    // Aplicar filtro por país si el scope es "team"
    if (userScope === "team" && currentUserInfo.countryId && !countryId) {
      whereClause.countryId = currentUserInfo.countryId;
    }

    // Si el scope es "self", mostrar solo el usuario actual
    if (userScope === "self") {
      whereClause.id = currentUserInfo.id;
    }

    console.log("[API] /api/users - Consulta final:", whereClause);

    // Si el scope query parameter es "self", filtrar solo usuarios con scope self
    // Solo aplica si el usuario tiene permiso para ver otros usuarios
    if (scope === "self" && userScope !== "self") {
      // Obtener usuarios
      const allUsers = await prisma.user.findMany({
        where: whereClause,
        include: {
          userPermission: true,
          country: true,
        },
      });

      console.log(
        "[API] /api/users - Usuarios encontrados (filtro scope=self):",
        allUsers.length
      );

      // Filtrar usuarios con scope "self" para leads.view
      const selfUsers = allUsers.filter((user) => {
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

      console.log(
        "[API] /api/users - Usuarios filtrados (scope=self):",
        selfUsers.length
      );

      return NextResponse.json({
        users: selfUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          country: user.country,
        })),
      });
    }

    // Si el scope es false, no hay acceso
    if (userScope === false) {
      console.log("[API] /api/users - Sin acceso, devolviendo lista vacía");
      return NextResponse.json({ users: [] });
    }

    // Buscar usuarios
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: [{ name: "asc" }],
      include: {
        userRole: {
          select: {
            id: true,
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        userPermission: true,
      },
    });

    console.log("[API] /api/users - Total usuarios encontrados:", users.length);
    if (users.length === 0) {
      console.log(
        "[API] /api/users - ADVERTENCIA: No se encontraron usuarios con los criterios",
        whereClause
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API] /api/users - Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    // Verificar permiso
    if (!hasPermission(currentUser, "users", "create")) {
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
      countryId,
      isActive = true,
      user_permissions,
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

    // Si se incluye countryId, verificar que el país existe
    if (countryId) {
      const country = await prisma.country.findUnique({
        where: { id: countryId },
      });

      if (!country) {
        return NextResponse.json(
          { error: "El país seleccionado no existe" },
          { status: 400 }
        );
      }
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

    // Obtener los permisos del rol para asignarlos al usuario
    const rolePermissions = role.permissions;
    const permissionsToAssign =
      user_permissions && Object.keys(user_permissions).length > 0
        ? user_permissions
        : rolePermissions;

    // Crear usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role: role.name,
        roleId: role.id,
        countryId,
        isActive,
        // Crear registro de permisos basados en el rol o personalizados
        userPermission: {
          create: {
            permissions: permissionsToAssign as any,
          },
        },
      },
      include: {
        userPermission: true,
      },
    });

    // Registrar en el changelog
    try {
      await prisma.activityLog.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "CREATE",
          description: `Usuario ${user.name} creado con rol ${role.name}${countryId ? " y país asignado" : ""}`,
          performedById: currentUser!.id,
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
    const currentUser = await getCurrentUser();
    // Verificar permiso
    if (!hasPermission(currentUser, "users", "edit")) {
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

    const { id, name, email, password, roleId, countryId, isActive, user_permissions } =
      validationResult.data;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userPermission: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si se actualiza el rol, verificar que existe y obtener sus permisos
    let roleName = "";
    let rolePermissions = null;
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
      rolePermissions = role.permissions;
    }

    // Si se incluye countryId, verificar que el país existe (si no es undefined)
    if (countryId !== undefined && countryId !== null && countryId !== "") {
      const country = await prisma.country.findUnique({
        where: { id: countryId },
      });

      if (!country) {
        return NextResponse.json(
          { error: "El país seleccionado no existe" },
          { status: 400 }
        );
      }
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
    if (countryId !== undefined) {
      // Si es string vacío o "none", establecer como null
      updateData.countryId = (countryId === "" || countryId === "none") ? null : countryId;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    // Determinar qué permisos usar: personalizados o del rol
    let permissionsToAssign = null;
    if (user_permissions && Object.keys(user_permissions).length > 0) {
      // Usar permisos personalizados si se proporcionan
      permissionsToAssign = user_permissions;
    } else if (rolePermissions) {
      // Usar permisos del rol si se cambió el rol y no hay permisos personalizados
      permissionsToAssign = rolePermissions;
    }

    // Actualizar usuario en la base de datos dentro de una transacción
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos del usuario
      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Actualizar o crear permisos si es necesario
      if (permissionsToAssign) {
        if (existingUser.userPermission) {
          // Actualizar permisos existentes
          await tx.userPermission.update({
            where: { userId: id },
            data: {
              permissions: permissionsToAssign as any,
              updatedAt: new Date(),
            },
          });
        } else {
          // Crear permisos si no existen
          await tx.userPermission.create({
            data: {
              userId: id,
              permissions: permissionsToAssign as any,
            },
          });
        }
      }

      return user;
    });

    // Registrar en el changelog
    try {
      const changes = [];
      if (name) changes.push(`nombre actualizado a "${name}"`);
      if (email) changes.push(`email actualizado a "${email}"`);
      if (password) changes.push("contraseña restablecida");
      if (roleId) changes.push(`rol cambiado a "${roleName}"`);
      if (countryId !== undefined) changes.push("país actualizado");
      if (isActive !== undefined) changes.push(`estado ${isActive ? "activado" : "desactivado"}`);
      if (permissionsToAssign) changes.push("permisos actualizados");

      if (changes.length > 0) {
        await prisma.activityLog.create({
          data: {
            entityType: "USER",
            entityId: id,
            action: "UPDATE",
            description: `Usuario ${updatedUser.name}: ${changes.join(", ")}`,
            performedById: currentUser!.id,
          },
        });
      }
    } catch (logError) {
      console.error("Error al registrar actividad:", logError);
    }

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
    // Verificar autorización
    const currentUser = await getCurrentUser();
    // Verificar permiso
    if (!hasPermission(currentUser, "users", "delete")) {
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
    if (id === currentUser?.id) {
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

    // Prevenir eliminación de Super Administrador a menos que uno mismo sea Super Administrador
    const isSuperAdmin = targetUser.userRole?.name === "Super Administrador";
    const currentIsSuperAdmin =
      currentUser?.userPermission?.permissions === "Super Administrador";

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
          performedById: currentUser!.id,
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
        deletedBy: currentUser!.id,
      },
    });

    // Registrar en el changelog
    await prisma.activityLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        action: "DELETE",
        description: `Usuario ${targetUser.name} eliminado por ${currentUser!.name}`,
        performedById: currentUser!.id,
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
