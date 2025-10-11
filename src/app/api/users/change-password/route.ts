// src/app/api/users/change-password/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user?.hashedPassword || !(await bcrypt.compare(currentPassword, user.hashedPassword))) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: hashedNewPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}