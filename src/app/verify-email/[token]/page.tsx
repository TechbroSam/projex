// src/app/verify-email/[token]/page.tsx
'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function VerifyTokenContent({ token }: { token: string }) {
  const [status, setStatus] = useState('Verifying your email...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          throw new Error('Verification failed.');
        }
        setStatus('Your email has been successfully verified!');
        setIsSuccess(true);
      } catch (error) {
        setStatus('This verification link is invalid or has expired.');
        setIsSuccess(false);
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className={`text-2xl font-bold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
        {status}
      </h1>
      
      {/* Only show the login button on success */}
      {isSuccess && (
        <Link 
          href="/login" 
          className="mt-8 inline-block bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors"
        >
          Proceed to Login
        </Link>
      )}
    </div>
  );
}

// The main page component that handles Suspense
export default function VerifyTokenPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={<div className="text-center py-20">Verifying...</div>}>
      <VerifyTokenContent token={params.token} />
    </Suspense>
  )
}