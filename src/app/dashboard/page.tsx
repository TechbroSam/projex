// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Trash2, Crown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface SessionUser {
  id: string;
  plan: string;
  image: string | null;
}


// We move the main component logic into its own function
function DashboardContent() {
  const { data: session, status, update } = useSession();
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPlan = (session?.user as SessionUser)?.plan || 'FREE';
  const isPremium = currentPlan === 'PREMIUM';
 

  useEffect(() => {
  if (searchParams.get('subscription_success')) {
      // Pass an object to the update function to trigger our new JWT logic
      update({ plan: 'PREMIUM' });
      router.replace('/dashboard', { scroll: false });
    }

    const fetchProjects = async () => {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setOwnedProjects(data.ownedProjects || []);
        setTeamProjects(data.teamProjects || []);
      }
    };

    if (status === 'authenticated') {
      fetchProjects();
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, searchParams, update]);

  const handleDeleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this project?')) {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setOwnedProjects(ownedProjects.filter(p => p.id !== projectId));
      } else {
        alert('Failed to delete project.');
      }
    }
  };

  if (status === 'loading' || isRefreshing) return <p className="text-center py-20">Syncing your account...</p>;



  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Welcome back, {session?.user?.name}!
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {isPremium ? (
              <>
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-500 border dark:border-yellow-500/30 border-yellow-700/30 dark:bg-yellow-500/10 bg-yellow-700/10 px-3 py-1.5 rounded-full">
                  <Crown size={16} />
                  <span>Premium Plan</span>
                </div>
                <Link href="/dashboard/billing" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:underline">
                  Manage Billing
                </Link>
              </>
            ) : (
              <Link href="/dashboard/billing" className="text-sm font-medium text-orange-600 hover:underline">
                Upgrade to Premium
              </Link>
            )}
            <Link href="/projects/create" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
              <Plus size={20} /> Create Project
            </Link>
          </div>
        </div>
      </header>

      {/* My Projects Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-6">My Projects</h2>
        {ownedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedProjects.map((project) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="group relative block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="absolute top-3 right-3 p-2 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 transition-opacity"
                  aria-label="Delete project"
                >
                  <Trash2 size={18} />
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold">You haven&apos;t created any projects yet.</h3>
            <Link href="/projects/create" className="mt-4 inline-block bg-orange-600 text-white px-5 py-2 rounded-md">
              Create a Project
            </Link>
          </div>
        )}
      </section>

      {/* Team Projects Section */}
      <section>
        <h2 className="text-2xl font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-6">Team Projects</h2>
        {teamProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamProjects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="block p-6 bg-white dark:bg-gray-800 border rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">{project.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">You haven&apos;t been invited to any team projects yet.</p>
        )}
      </section>
    </div>
  );
}

// The main export now wraps our component in Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-center py-20">Loading Dashboard...</p>}>
      <DashboardContent/>
    </Suspense>
  )
}