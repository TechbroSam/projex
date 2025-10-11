// src/components/InviteMemberModal.tsx
'use client';

import { useState } from 'react';

interface InviteMemberModalProps {
  projectId: string;
  onClose: () => void;
  onMemberInvited: () => void;
}

export default function InviteMemberModal({ projectId, onClose, onMemberInvited }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to invite member.');
      
      onMemberInvited();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError('An unknown error occurred.'); }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Invite a Team Member</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">User&apos;s Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
            </button>
            <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
                {isLoading ? 'Sending Invite...' : 'Send Invite'}
            </button>
        </div>
      </form>
    </div>
  );
}