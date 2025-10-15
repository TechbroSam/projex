// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: 'If an account with this email exists, a reset link has been sent.' });
    }

    // Generate a secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set an expiration date (e.g., 1 hour from now)
    const tokenExpiry = new Date(Date.now() + 3600000);

    // Save the hashed token and expiry date to the user's record
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpiry: tokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    await resend.emails.send({
      from: 'ProjeXY <no-reply@samuelobior.com>', 
      to: user.email!,
      subject: 'Your ProjeXY Password Reset Request',
      html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return NextResponse.json({ message: 'If an account with this email exists, a reset link has been sent.' });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}