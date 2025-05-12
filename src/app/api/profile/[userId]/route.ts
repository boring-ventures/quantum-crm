import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await params;

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Only allow users to view their own profile (or admin users to view any profile)
    const currentUser = session.user;

    // Consultar usuario actual desde la tabla users
    const currentAppUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { userRole: true },
    });

    if (
      userId !== currentUser.id &&
      currentAppUser?.userRole?.name !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "No autorizado para ver este perfil" },
        { status: 403 }
      );
    }

    // Consultar el usuario solicitado desde la tabla users
    const userWithRole = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRole: true },
    });

    if (!userWithRole) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Devolver el usuario con el mismo formato que antes se usaba para profile
    return NextResponse.json({ profile: userWithRole });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de usuario" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await params;

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Only allow users to update their own profile (or admin users to update any profile)
    const currentUser = session.user;
    const currentAppUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { userRole: true },
    });

    if (
      userId !== currentUser.id &&
      currentAppUser?.userRole?.name !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "No autorizado para actualizar este perfil" },
        { status: 403 }
      );
    }

    const json = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: json.name || undefined,
        isActive: json.isActive !== undefined ? json.isActive : undefined,
        roleId: json.roleId || undefined,
      },
    });

    return NextResponse.json({ profile: updatedUser });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar datos de usuario" },
      { status: 500 }
    );
  }
}
