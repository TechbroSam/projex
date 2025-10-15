// src/app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { pusherServer } from '@/lib/pusher';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Now expecting attachments in the body
    const { text, taskId, attachments } = await request.json();
    
    // Allow comments with only attachments
    if (!taskId || (!text && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // You can add a permission check here to ensure the user is part of the project

    const newComment = await prisma.comment.create({
      data: {
        text,
        taskId,
        authorId: session.user.id,
        attachments: attachments || [], // Save the attachments array
      },
      include: {
        author: { select: { name: true, id: true } },
      },
    });

    // Trigger a real-time event
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task) {
      await pusherServer.trigger(`private-project-${task.projectId}`, 'new-comment', newComment);
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: 'Failed to create comment.' }, { status: 500 });
  }
}