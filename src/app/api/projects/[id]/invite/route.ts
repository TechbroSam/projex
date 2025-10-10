// src/app/api/projects/[id]/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import InviteEmail from '../../../../../../emails/InviteEmail';
// Update the import path to the correct relative location


const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = params.id;
  const { email } = await request.json();
  if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 });

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id },
    });
    if (!project) return NextResponse.json({ message: 'Project not found or you are not the owner.' }, { status: 404 });

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) return NextResponse.json({ message: 'User with this email not found.' }, { status: 404 });

    // Update database
    await prisma.project.update({
      where: { id: projectId },
      data: { members: { create: [{ userId: userToInvite.id, role: 'MEMBER' }] } },
    });

    // --- SEND INVITATION EMAIL ---
    try {
      await resend.emails.send({
        from: 'ProjeXY <hello@samuelobior.com>', // Replace with your verified email
        to: userToInvite.email!,
        subject: `You've been invited to the project: ${project.name}`,
        react: InviteEmail({
          inviterName: session.user.name,
          projectName: project.name,
          projectUrl: `${process.env.NEXTAUTH_URL}/projects/${projectId}`,
        }),
      });
    } catch (emailError) {
      console.error("!!! FAILED TO SEND INVITE EMAIL !!!", emailError);
    }
    // --- END EMAIL LOGIC ---

    return NextResponse.json({ message: 'Member invited successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to invite member.' }, { status: 500 });
  }
}