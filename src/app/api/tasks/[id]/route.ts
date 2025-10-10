// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Role } from "@prisma/client";
import { pusherServer } from "@/lib/pusher"; // Import the Pusher server client

const prisma = new PrismaClient();

// Correctly define the context parameter with Promise
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check user's permission level on a project
async function checkPermission(
  userId: string,
  taskId: string,
  requiredRole: Role = Role.MEMBER
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { members: true, ownerId: true } } },
  });

  // User is the owner of the project
  if (task?.project.ownerId === userId) {
    return true;
  }

  const membership = task?.project.members.find((m) => m.userId === userId);

  // If ADMIN is required, check for ADMIN role
  if (requiredRole === Role.ADMIN) {
    return membership?.role === Role.ADMIN;
  }

  // Otherwise, just check if they are a member
  return !!membership;
}

// GET a single task's full details AND the user's permission level
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await the params before using them
  const params = await context.params;

    try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: { members: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { name: true } } },
        },
      },
    });

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // FIX: Correctly find the user's membership in the project
    const membership = task.project.members.find(m => m.userId === session.user!.id);
    
    // If the user is not a member of this project, deny access
    if (!membership) {
      return NextResponse.json({ error: 'You do not have permission to view this task.' }, { status: 403 });
    }

    return NextResponse.json({ task, userRole: membership.role });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// UPDATE a task's details
export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Await the params before using them
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

    const dataToUpdate: { [key: string]: any } = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (dueDate !== undefined)
      dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) dataToUpdate.assigneeId = assigneeId || null;

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
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE a task by ID
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Await the params before using them
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
    await prisma.task.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
