// src/components/CommentSection.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher";
import { Paperclip, Trash2 } from "lucide-react";
import Link from "next/link";

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

interface SessionUser {
  id?: string;
  plan?: string;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = session?.user as SessionUser;
  const currentPlan = user?.plan || "FREE";

  useEffect(() => {
    if (!projectId) return;

    const channel = pusherClient.subscribe(`private-project-${projectId}`);
    channel.bind("new-comment", (newCommentData: Comment) => {
      setComments((prevComments) => {
        if (prevComments.some((c) => c.id === newCommentData.id)) {
          return prevComments;
        }
        return [newCommentData, ...prevComments];
      });
    });

    return () => {
      pusherClient.unsubscribe(`private-project-${projectId}`);
    };
  }, [projectId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data: { url: string } = await res.json();
      setAttachments([...attachments, { url: data.url, fileName: file.name }]);
    } else {
      alert("File upload failed. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;
    setIsSubmitting(true);

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, taskId, attachments }),
    });

    setNewComment("");
    setAttachments([]);
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setComments(comments.filter((c) => c.id !== commentId));
      await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-semibold mb-4">Activity</h3>
      {currentPlan === "PREMIUM" ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or attach a file..."
            rows={2}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-orange-500 focus:border-orange-500"
          />
          <div className="text-xs space-y-1 mt-2 text-gray-500 dark:text-gray-400">
            {attachments.map((att, i) => (
              <p key={i} className="truncate">
                {att.fileName}
              </p>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2">
            <label
              htmlFor="comment-attachment"
              className="cursor-pointer text-gray-400 hover:text-orange-600 transition-colors"
              title="Add attachment"
            >
              <Paperclip size={18} />
              <input
                accept="image/*,video/*,audio/*"
                multiple
                title="Attach File"
                id="comment-attachment"
                type="file"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <button
              type="submit"
              disabled={
                isSubmitting || (!newComment.trim() && attachments.length === 0)
              }
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm p-3 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md mb-6">
          <Link
            href="/dashboard/billing"
            className="font-semibold text-yellow-800 dark:text-yellow-300 hover:underline"
          >
            Upgrade to Premium to post comments and attach files.
          </Link>
        </div>
      )}

      {/* FIX: Add max-height and overflow classes to this container */}
      <div className="space-y-6 max-h-64 overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm group relative">
            <div className="flex justify-between items-start">
              <p>
                <span className="font-semibold">
                  {comment.author.name || "User"}
                </span>
                <span className="text-gray-400 ml-2">
                  {new Date(comment.createdAt).toLocaleString("en-GB")}
                </span>
              </p>
              {(user?.id === comment.author.id || user?.isAdmin) && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="absolute top-0 right-0 p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  title="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="mt-1 text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
              {comment.text}
            </p>

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
          </div>
        ))}
      </div>
    </div>
  );
}
