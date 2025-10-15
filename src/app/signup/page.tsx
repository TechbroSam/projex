// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        router.push('/verify-email');
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create account.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError('Failed to create account.'); }
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input
            title='Name'
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input
            title='Email'
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-orange-500 focus:border-orange-500"
                pattern="^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$"
                title="Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <div className="ml-2 text-sm">
              <label htmlFor="terms" className="text-gray-500 dark:text-gray-400">
                By checking the box, you agree to the{' '}
                <Link href="/terms" target="_blank" className="font-medium text-orange-600 hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-orange-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}