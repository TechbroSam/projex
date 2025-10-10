// src/app/page.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {session ? (
        // --- VIEW FOR LOGGED-IN USERS ---
        <div>
          <h1 className="text-4xl font-bold">Welcome back, {session.user?.name}!</h1>
          <p className="mt-4 text-lg text-gray-400">Ready to manage your projects?</p>
          <Link href="/dashboard" className="mt-6 inline-block bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700">
            Go to Your Dashboard
          </Link>
        </div>
      ) : (
        // --- VIEW FOR VISITORS ---
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Organize Your Work with <span className="text-orange-500">ProjeXY</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto text-gray-400 ">
            The intuitive project management tool designed to help you organize tasks, track progress, and collaborate seamlessly.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup" className="rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
              Get started for free
            </Link>
            <Link href="/login" className="text-sm font-semibold leading-6">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}