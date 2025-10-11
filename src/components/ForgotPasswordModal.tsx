// src/components/ForgotPasswordModal.tsx
'use client';

import { useState } from 'react';

interface ForgotPasswordModalProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordModal({ onSwitchToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
      
      {message ? (
        <div className="text-center">
          <p className="text-green-500 mb-6">{message}</p>
          <button onClick={onSwitchToLogin} className="w-full bg-orange-600 text-white py-2 rounded-md">
            Back to Log In
          </button>
        </div>
      ) : (
        <>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email-forgot" className="block text-sm font-medium">Email Address</label>
              <input 
                id="email-forgot"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" 
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="text-center mt-4">
            <button onClick={onSwitchToLogin} className="font-medium text-orange-600 hover:underline text-sm">
              Back to Log In
            </button>
          </div>
        </>
      )}
    </div>
  );
}