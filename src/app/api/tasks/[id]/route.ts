// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Role, Prisma } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

// Define the context parameter type for Next.js 14+
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check permissions
async function checkPermission(
  userId: string,
  taskId: string,
  requiredRole: Role = Role.MEMBER
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { members: true, ownerId: true } } },
  });

  if (task?.project.ownerId === userId) return true;

  const membership = task?.project.members.find((m) => m.userId === userId);

  if (requiredRole === Role.ADMIN) return membership?.role === Role.ADMIN;

  return !!membership;
}

// GET a single task's full details
export async function GET(
  request: NextRequest,
  context: RouteContext // Use context instead of destructuring
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Await the params first
    const params = await context.params;
    const hasPermission = await checkPermission(session.user.id, params.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to view this task." },
        { status: 403 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: { include: { members: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, id: true } } },
        },
      },
    });

    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const membership = task.project.members.find(
      (m) => m.userId === session.user.id
    );
    return NextResponse.json({ task, userRole: membership?.role });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// UPDATE a task's details
export async function PUT(
  request: NextRequest,
  context: RouteContext // Use context instead of destructuring
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await the params first
  const params = await context.params;
  const hasPermission = await checkPermission(
    session.user.id,
    params.id,
    Role.ADMIN
  );
  if (!hasPermission) {
    return NextResponse.json(
      { error: "You do not have permission to edit this task." },
      { status: 403 }
    );
  }

  try {
    const { title, description, status, priority, dueDate, assigneeId } =
      await request.json();
    const originalTask = await prisma.task.findUnique({
      where: { id: params.id },
    });

    const dataToUpdate: Prisma.TaskUpdateInput = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (dueDate !== undefined)
      dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;

    // FIX: Use 'connect' or 'disconnect' for relational fields
    if (assigneeId !== undefined) {
      if (assigneeId) {
        // Connect the task to the user
        dataToUpdate.assignee = { connect: { id: assigneeId } };
      } else {
        // Disconnect the task from any user (unassign)
        dataToUpdate.assignee = { disconnect: true };
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    if (assigneeId && assigneeId !== originalTask?.assigneeId) {
      const notificationMessage = `${session.user.name} assigned you a new task: "${updatedTask.title}"`;
      await pusherServer.trigger(`private-user-${assigneeId}`, "new-task", {
        message: notificationMessage,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE a task by ID
export async function DELETE(
  request: NextRequest,
  context: RouteContext // Use context instead of destructuring
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await the params first
  const params = await context.params;
  const hasPermission = await checkPermission(
    session.user.id,
    params.id,
    Role.ADMIN
  );
  if (!hasPermission) {
    return NextResponse.json(
      { error: "You do not have permission to delete this task." },
      { status: 403 }
    );
  }

  try {
    await prisma.comment.deleteMany({ where: { taskId: params.id } });
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}