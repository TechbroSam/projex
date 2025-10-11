// src/app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { pusherServer } from '@/lib/pusher';

const prisma = new PrismaClient();

// Helper function to check if a user is a member of the task's project
async function checkMembership(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { members: true } } },
  });
  return task?.project.members.some(member => member.userId === userId);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, taskId, attachments } = await request.json();
    if (!text || !taskId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // --- PERMISSION CHECK ---
    const isMember = await checkMembership(session.user.id, taskId);
    if (!isMember) {
      return NextResponse.json({ error: 'You do not have permission to comment on this task.' }, { status: 403 });
    }

    const newComment = await prisma.comment.create({
      data: {
        text,
        taskId,
        authorId: session.user.id,
         attachments: attachments || [], // Save the attachments
      },
      include: {
        author: { select: { name: true } },
      },
    });

     // --- TRIGGER PUSHER EVENT ---
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task) {
      // Send a message on a channel specific to this project
      await pusherServer.trigger(`private-project-${task.projectId}`, 'new-comment', newComment);
    }
    // --- END PUSHER LOGIC ---

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment.' }, { status: 500 });
  }
}