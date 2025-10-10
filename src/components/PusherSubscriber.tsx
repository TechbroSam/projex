// src/components/PusherSubscriber.tsx
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import toast from 'react-hot-toast';

export default function PusherSubscriber() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Subscribe to the user's private channel
    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    // Bind to the 'new-task' event
    channel.bind('new-task', (data: { message: string }) => {
      toast.success(data.message); // Show a success toast
    });

    // Clean up subscription on component unmount
    return () => {
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
    };
  }, [session]);

  return null; // This component doesn't render any UI itself
}