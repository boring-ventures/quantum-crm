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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow users to view their own profile (or admin users to view any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to view this profile" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow users to update their own profile (or admin users to update any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    const json = await request.json();

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName: json.firstName || undefined,
        lastName: json.lastName || undefined,
        avatarUrl: json.avatarUrl || undefined,
        active: json.active !== undefined ? json.active : undefined,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
