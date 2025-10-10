// next-auth.d.ts
import { Plan } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      isAdmin?: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    plan: Plan;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: Plan;
    isAdmin?: boolean;
  }
}