import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { hasPermission, getScope_user } from "@/lib/utils/permissions";

// PUT /api/comments/[id] - Update a comment
export async function PUT(
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

    // Check if user has permission to edit leads
    if (!hasPermission(currentUser, "leads", "edit")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { content } = await request.json();

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Comment content is required" },
        { status: 400 }
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

    // Check if comment is deleted
    if (comment.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Comment is deleted" },
        { status: 400 }
      );
    }

    // Check permissions based on scope
    const editScope = getScope_user(currentUser, "leads", "edit");
    let canEdit = false;

    switch (editScope) {
      case "all":
        canEdit = true;
        break;
      case "team":
        // User can edit comments if they are assigned to the lead
        canEdit = comment.lead.assignedToId === currentUser.id;
        break;
      case "self":
        // User can only edit their own comments
        canEdit = comment.user.id === currentUser.id;
        break;
      default:
        canEdit = false;
    }

    if (!canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to edit this comment",
        },
        { status: 403 }
      );
    }

    // Store the previous value for history
    const previousValue = comment.content;

    // Update the comment
    const updatedComment = await prisma.leadComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
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
        },
      },
    });

    // Create history record
    await prisma.commentHistory.create({
      data: {
        commentId: commentId,
        previousValue: previousValue,
        newValue: content.trim(),
        editedById: currentUser.id,
        action: "edited",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Soft delete a comment
export async function DELETE(
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

    // Check if user has permission to delete leads
    if (!hasPermission(currentUser, "leads", "delete")) {
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

    // Check if comment is already deleted
    if (comment.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Comment is already deleted" },
        { status: 400 }
      );
    }

    // Check permissions based on scope
    const deleteScope = getScope_user(currentUser, "leads", "delete");
    let canDelete = false;

    switch (deleteScope) {
      case "all":
        canDelete = true;
        break;
      case "team":
        // User can delete comments if they are assigned to the lead
        canDelete = comment.lead.assignedToId === currentUser.id;
        break;
      case "self":
        // User can only delete their own comments
        canDelete = comment.user.id === currentUser.id;
        break;
      default:
        canDelete = false;
    }

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to delete this comment",
        },
        { status: 403 }
      );
    }

    // Soft delete the comment
    await prisma.leadComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
