// src/types/index.ts
import { Plan, Role } from "@prisma/client";

export interface SimpleUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface SessionUser extends SimpleUser {
  plan?: Plan;
  isAdmin?: boolean;
}

export interface Task {
    id: string;
    title: string;
    status: string;
    assignee?: { id: string; name: string | null } | null
}