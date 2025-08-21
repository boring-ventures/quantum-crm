import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { hasPermission, getScope_user } from "@/lib/utils/permissions";

// GET /api/comments/[id]/history - Get comment edit history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const commentId = params.id;

    // Check if user has permission to view leads
    if (!hasPermission(currentUser, "leads", "view")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get the comment with lead and user information
    const comment = await prisma.leadComment.findUnique({
      where: { id: commentId },
      include: {
        lead: {
          select: {
            id: true,
            assignedToId: true,
            createdById: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check permissions based on scope for viewing history
    const viewScope = getScope_user(currentUser, "leads", "view");
    let canViewHistory = false;

    switch (viewScope) {
      case "all":
        canViewHistory = true;
        break;
      case "team":
        // User can view history if they are assigned to the lead
        canViewHistory = comment.lead.assignedToId === currentUser.id;
        break;
      case "self":
        // User can only view history of their own comments
        canViewHistory = comment.user.id === currentUser.id;
        break;
      default:
        canViewHistory = false;
    }

    if (!canViewHistory) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to view comment history",
        },
        { status: 403 }
      );
    }

    // Get comment history
    const history = await prisma.commentHistory.findMany({
      where: {
        commentId: commentId,
      },
      include: {
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching comment history:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
