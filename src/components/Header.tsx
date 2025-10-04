// src/components/Header.tsx
import Link from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import AuthButton from './AuthButton'; 

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ProjeXY
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <AuthButton /> {/* Ensure AuthButton is imported at the top */}
        </div>
      </div>
    </header>
  );
}