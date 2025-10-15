// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.hashedPassword) return null;

        // --- PREVENT LOGIN IF EMAIL IS NOT VERIFIED ---
        if (!user.emailVerified) {
          throw new Error(
            "Please verify your email address before logging in."
          );
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (isPasswordCorrect) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            plan: user.plan,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, pass properties to the token
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.picture = user.image;
      }

      // FIX: On every session check, re-fetch the user's plan from the database.
      // This ensures the session is ALWAYS up-to-date.
      const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
      if (dbUser) {
        token.plan = dbUser.plan;
        token.picture = dbUser.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.plan = token.plan;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
