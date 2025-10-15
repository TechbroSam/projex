// src/app/verify-email/[token]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyTokenPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState('Verifying your email...');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });
        if (!res.ok) throw new Error('Verification failed.');
        setStatus('Your email has been successfully verified!');
      } catch (error) {
        setStatus('Invalid or expired verification link.');
      }
    };
    verifyToken();
  }, [params.token]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{status}</h1>
      {status.includes('successfully') && (
        <Link href="/login" className="mt-6 inline-block bg-orange-600 text-white px-6 py-3 rounded-md">
          Proceed to Login
        </Link>
      )}
    </div>
  );
}