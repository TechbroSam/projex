// src/app/dashboard/page.tsx


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Plus } from "lucide-react";

const prisma = new PrismaClient();

// Fetch projects owned by the current user
async function getProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
  });
  return projects;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If the user is not logged in, redirect them to the login page
  if (!session?.user?.id) {
    redirect('/login');
  }

  const projects = await getProjects(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {session.user.name}!
          </p>
        </div>
        <Link 
          href="/projects/create" 
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
        >
          <Plus size={20} />
          Create Project
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              href={`/projects/${project.id}`} 
              key={project.id}
              className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Get started by creating your first project.
          </p>
          <Link 
            href="/projects/create" 
            className="mt-6 inline-block bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors"
          >
            Create Your First Project
          </Link>
        </div>
      )}
    </div>
  );
}

