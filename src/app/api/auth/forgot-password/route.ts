// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';


const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // For security, don't reveal if a user exists.
      return NextResponse.json({ message: 'If an account with this email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    // In a real app, you would hash this token before saving
    // and add an expiry date to the user model.
    // For this portfolio piece, we'll keep it simple.

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    // This is a placeholder for email sending.
    // Replace with your actual email service (like Nodemailer + SendGrid)
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    // Example with Nodemailer (requires setup)
    const transporter = nodemailer.createTransport({ });
    if (user.email) {
      await transporter.sendMail({
        from: '"ProjeXY" <no-reply@projexy.com>',
        to: user.email,
        subject: 'Your Password Reset Request',
        html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    }

    return NextResponse.json({ message: 'If an account with this email exists, a reset link has been sent.' });

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}