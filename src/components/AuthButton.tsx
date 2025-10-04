// src/components/AuthButton.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButton() {
  const { data: session, status } = useSession();

  // Show a loading state while the session is being determined
  if (status === 'loading') {
    return <div className="w-24 h-9 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />;
  }

  // If the user is logged in, show their name and a Log Out button
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm hidden sm:inline">{session.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Log Out
        </button>
      </div>
    );
  }

  // If the user is not logged in, show a Log In button
  return (
    <Link
      href="/login"
      className="px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700"
    >
      Log In
    </Link>
  );
}