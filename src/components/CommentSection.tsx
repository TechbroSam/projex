// src/components/CommentSection.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher'; // Import pusher client

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { name: string | null };
}

interface CommentSectionProps {
  taskId: string;
  projectId: string; 
  initialComments: Comment[];
}

export default function CommentSection({ taskId, projectId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  // Listen for new comments in real-time
  useEffect(() => {
    if (!projectId) return;

    const channel = pusherClient.subscribe(`private-project-${projectId}`);
    channel.bind('new-comment', (newComment: Comment) => {
      // Add the new comment to the top of the list
      setComments((prevComments) => [newComment, ...prevComments]);
    });

    return () => {
      pusherClient.unsubscribe(`private-project-${projectId}`);
    };
  }, [projectId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ text: newComment, taskId }),
    });
    
    // We no longer need to manually update state here, Pusher will handle it
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full p-2 border rounded-md"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="mt-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-md disabled:bg-gray-400"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm">
            <p>
              <span className="font-semibold">{comment.author.name || 'User'}</span>
              <span className="text-gray-400 ml-2">
                {/* Add the time of post */}
                {new Date(comment.createdAt).toLocaleString('en-GB')}
              </span>
            </p>
            <p className="mt-1">{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}