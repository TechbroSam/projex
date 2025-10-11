// src/components/AuthButton.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {/* Link to the profile page using the user's avatar */}
        <Link href="/dashboard/profile" className="relative h-9 w-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {session.user?.image ? (
            <Image src={session.user.image} alt={session.user.name || "Profile"} fill className="object-cover" />
          ) : (
            <User className="h-full w-full text-gray-400" />
          )}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700"
    >
      Log In
    </Link>
  );
}