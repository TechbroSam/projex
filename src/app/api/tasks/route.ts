// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, projectId, status } = await request.json();

    // Security check: Ensure the user owns the project they're adding a task to
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found or you are not the owner' }, { status: 404 });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        status,
        projectId,
      },
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}