// src/app/dashboard/profile/page.tsx

'use client';

import { useSession, signOut } from 'next-auth/react'; // Import signOut
import { Crown, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function ProfilePage() {
 const { data: session, update } = useSession();
  // In both files, at the top of the component:
const user = session?.user as { name?: string; email?: string; plan?: string; image?: string; };

    const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');


   const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPasswordMessage(data.message || data.error);
  };
  
  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  
  const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!uploadRes.ok) {
    alert("Failed to upload picture.");
    return;
  }
  const uploadData = await uploadRes.json();
  
  if (uploadData.url) {
    await fetch('/api/users/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: uploadData.url }),
    });
    // This will now correctly trigger our updated auth logic
    update({ image: uploadData.url });
  }
};

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <div className="space-y-8 max-w-2xl">
                {/* Profile Picture Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {user?.image ? (
                <Image src={user.image} alt="Profile picture" fill className="object-cover" />
              ) : (
                <UserIcon className="h-full w-full text-gray-400" />
              )}
            </div>
            <label htmlFor="picture-upload" className="cursor-pointer text-sm font-medium text-orange-600 hover:underline">
              Change Picture
              <input id="picture-upload" type="file" accept="image/*" onChange={handlePictureChange} className="sr-only" />
            </label>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Profile Details</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Subscription</h2>
          <div className="mt-4">
            {user?.plan === 'PREMIUM' ? (
              <div className="flex items-center gap-2 text-yellow-500">
                <Crown size={20} />
                <p>You are on the <strong>Premium Plan</strong>.</p>
              </div>
            ) : (
              <p>You are on the <strong>Free Plan</strong>.</p>
            )}
          </div>
        </div>

          {/* Change Password Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
            <div>
                  {/* FIX: Added htmlFor and id */}
              <label htmlFor="currentPassword" className="block text-sm font-medium">Current Password</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 w-full p-2 border rounded-md" />
            </div>
            <div>
              {/* FIX: Added htmlFor and id */}
              <label htmlFor="newPassword" className="block text-sm font-medium">New Password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="mt-1 w-full p-2 border rounded-md" />
            </div>
            {passwordMessage && <p className="text-sm text-green-500">{passwordMessage}</p>}
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md">Update Password</button>
          </form>
        </div>

        {/* Log Out Button */}
        <div className="mt-8">
            <button
                onClick={() => signOut({ callbackUrl: '/' })} // Add onClick handler to sign out and redirect
                className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
                Log Out
            </button>
        </div>
      </div>
    </div>
  );
}