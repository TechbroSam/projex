// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        verificationToken,
      },
    });

    // FIX: Change the URL structure to match the dynamic route
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email/${verificationToken}`;
    
    await resend.emails.send({
      from: 'ProjeXY <no-reply@samuelobior.com>',
      to: email,
      subject: 'Verify Your Email Address for ProjeXY',
      html: `<p>Welcome to ProjeXY! Please click the link below to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    return NextResponse.json({ message: 'User created. Please check your email to verify your account.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}