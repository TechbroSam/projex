// src/components/VideoChatModal.tsx
'use client';
import { X } from 'lucide-react';

interface VideoChatModalProps {
  projectId: string;
  onClose: () => void;
}

export default function VideoChatModal({ projectId, onClose }: VideoChatModalProps) {
  const domain = 'meet.jit.si';
  const roomName = `ProjeXY-${projectId.slice(-12)}`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col p-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          title="Close video chat"
        >
          <X size={24} />
        </button>
      </div>
      <iframe
        src={`https://${domain}/${roomName}`}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="w-full h-full border-0 rounded-lg"
        title="Video chat room"
      ></iframe>
    </div>
  );
}