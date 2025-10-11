// src/components/CommentSection.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher";
import { Paperclip, Trash2 } from "lucide-react";

interface Attachment {
  url: string;
  fileName: string;
}
interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null };
  attachments?: Attachment[];
}

interface CommentSectionProps {
  taskId: string;
  projectId: string;
  initialComments: Comment[];
}

// Define a specific type for the session user to avoid using 'any'
interface SessionUser {
  id?: string;
  isAdmin?: boolean;
}

export default function CommentSection({
  taskId,
  projectId,
  initialComments,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<{url: string, fileName: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


   // Safely cast the session user to our specific type
  const user = session?.user as SessionUser;

  // Listen for new comments in real-time
  useEffect(() => {
    if (!projectId) return;

    const channel = pusherClient.subscribe(`private-project-${projectId}`);
    channel.bind("new-comment", (newComment: Comment) => {
      setComments((prevComments) => [newComment, ...prevComments]);
    });

    return () => {
      pusherClient.unsubscribe(`private-project-${projectId}`);
    };
  }, [projectId]);
 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setAttachments([...attachments, { url: data.url, fileName: file.name }]);
    } else {
        alert("File upload failed.");
    }
  };
 const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;
    setIsSubmitting(true);

    // This correctly includes attachments in the body
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment, taskId, attachments }),
    });
    
    setNewComment('');
    setAttachments([]);
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      // Optimistically remove from UI
      setComments(comments.filter((c) => c.id !== commentId));
      // Call the backend to delete
      await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    }
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
          className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        />
        <div className="text-xs space-y-1 mt-2 text-gray-500">
          {attachments.map((att, i) => (
            <p key={i} className="truncate">
              {att.fileName}
            </p>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2">
          <label
            htmlFor="comment-attachment"
            className="cursor-pointer text-gray-400 hover:text-orange-600"
            title="Add attachment"
          >
            <Paperclip size={18} />
            <input
              id="comment-attachment"
              type="file"
              onChange={handleFileChange}
              className="sr-only"
              title="Add attachment"
              placeholder="Attach a file"
            />
          </label>
          <button
            type="submit"
            disabled={
              isSubmitting || (!newComment.trim() && attachments.length === 0)
            }
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md disabled:bg-gray-400"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm group relative">
            <p>
              <span className="font-semibold">
                {comment.author.name || "User"}
              </span>
              <span className="text-gray-400 ml-2">
                {new Date(comment.createdAt).toLocaleString("en-GB")}
              </span>
            </p>
            <p className="mt-1 text-gray-800 dark:text-gray-300">
              {comment.text}
            </p>

            {/* Display Attachments */}
            <div className="mt-2 space-y-1">
              {comment.attachments?.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-orange-600 hover:underline"
                >
                  <Paperclip size={12} /> {att.fileName}
                </a>
              ))}
            </div>

            {/* Delete Button */}
            {(session?.user?.id === comment.author.id ||
              (session?.user as SessionUser)?.isAdmin) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                title="Delete comment"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
