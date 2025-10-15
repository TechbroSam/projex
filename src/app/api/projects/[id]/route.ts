// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Await the params first
    const { id } = await params;
    
    const project = await prisma.project.findFirst({
      where: {
        id: id, // Use the awaited id
        // FIX: Allow access if the user is a member of the project
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        tasks:  { 
          orderBy: { createdAt: 'asc' },
          include: {
            assignee: { select: { id: true, name: true } }
          }
        },
        // Also include the member details for the UI
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have access.' }, { status: 404 });
    }

    // Find the current user's membership to determine their role
    const currentUserMembership = project.members.find(m => m.userId === session.user.id);
    const currentUserRole = currentUserMembership?.role;

    // Simplify the members array for the frontend
    const simplifiedProject = {
      ...project,
      members: project.members.map(membership => membership.user)
    };

    return NextResponse.json({ project: simplifiedProject, currentUserRole });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// DELETE a project by ID
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Await the params first
    const { id } = await params;
    
    // Security Check: Find the project and ensure the current user is the owner
    const projectToDelete = await prisma.project.findFirst({
      where: {
        id: id, // Use the awaited id
        ownerId: session.user.id,
      },
    });

    if (!projectToDelete) {
      return NextResponse.json({ error: 'Project not found or you are not the owner.' }, { status: 404 });
    }

    // Prisma's onDelete: Cascade in the schema will handle deleting related tasks and memberships
    await prisma.project.delete({
      where: { id: id }, // Use the awaited id
    });

    return NextResponse.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 });
  }
}