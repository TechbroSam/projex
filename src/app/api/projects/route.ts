// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Plan } from '@prisma/client';

const prisma = new PrismaClient();

// GET all projects for the current user's dashboard
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const ownedProjects = await prisma.project.findMany({
            where: { ownerId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        const teamProjects = await prisma.project.findMany({
            where: {
                members: { some: { userId: session.user.id } },
                NOT: { ownerId: session.user.id } 
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ ownedProjects, teamProjects });
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// POST (Create) a new project
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Project name is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { _count: { select: { ownedProjects: true } } },
    });

    if (user?.plan === Plan.FREE && user._count.ownedProjects >= 3) {
      return NextResponse.json({ 
        error: 'You have reached the 3-project limit for the free plan. Please upgrade to create more.',
        upgrade: true,
      }, { status: 403 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        members: {
          create: [{ userId: session.user.id, role: 'ADMIN' }],
        },
      },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}