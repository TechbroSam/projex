// src/components/Header.tsx
import Link from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ProjeX
          </h1>
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
}