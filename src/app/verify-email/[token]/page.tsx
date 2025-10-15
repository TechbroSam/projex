// src/app/verify-email/[token]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function VerifyTokenPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState('Verifying your email...');
  const router = useRouter(); // Initialize the router

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

        // FIX: Redirect to the login page after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000); // Redirect after 3 seconds

      } catch (error) {
        setStatus('Invalid or expired verification link.');
      }
    };
    verifyToken();
  }, [params.token, router]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{status}</h1>
      
      {/* Show a clear next step to the user */}
      {status.includes('successfully') && (
        <>
            <p className="mt-2 text-sm text-gray-500">You will be redirected to the login page shortly.</p>
            <Link href="/login" className="mt-6 inline-block bg-orange-600 text-white px-6 py-3 rounded-md">
            Proceed to Login Now
            </Link>
        </>
      )}
    </div>
  );
}