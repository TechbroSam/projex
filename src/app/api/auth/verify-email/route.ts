// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token as string },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear the token so it can't be used again
      },
    });

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
