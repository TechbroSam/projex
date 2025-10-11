// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Define the context parameter type for Next.js 14+
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext // Use context instead of destructuring
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Await the params Promise first
    const params = await context.params;
    const commentId = params.id;
    const userId = session.user.id;

    // Find the comment to verify permissions
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        task: {
          select: {
            project: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if the user is the author of the comment
    const isAuthor = comment.authorId === userId;

    // Check if the user is an admin of the project
    const membership = comment.task.project.members.find(m => m.userId === userId);
    const isAdmin = membership?.role === Role.ADMIN;

    // Only allow deletion if the user is the author OR an admin
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this comment.' }, { status: 403 });
    }

    // If permission check passes, delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}