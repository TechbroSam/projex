// src/app/api/pusher/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // FIX: Read the form data only once
  const formData = await request.formData();
  const socketId = formData.get('socket_id') as string;
  const channel = formData.get('channel_name') as string;
  
  const userData = {
    user_id: session.user.id,
  };

  const authResponse = pusherServer.authorizeChannel(socketId, channel, userData);

  return NextResponse.json(authResponse);
}