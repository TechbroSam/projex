// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient, Plan } from "@prisma/client";
import bcrypt from 'bcryptjs';

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
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });

        if (user && user.hashedPassword && (await bcrypt.compare(credentials.password, user.hashedPassword))) {
          // Include the plan status when the user logs in
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            plan: user.plan,
          };
        }
        
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  callbacks: {
    // This callback adds the plan to the JWT token
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      
      // This part runs when you call the update() function
      if (trigger === "update") {
         const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
         if (dbUser) {
            token.plan = dbUser.plan;
         }
      }
      return token;
    },
    // This callback adds the plan from the token to the final session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};