// src/components/TaskDetailModal.tsx
'use client';
import { useEffect, useState } from 'react';
import type { Task, Role, Comment, User } from '@prisma/client';
import { Sparkles } from 'lucide-react';
import CommentSection from './CommentSection';

// Define a more specific type for the Task object we expect from the API
interface TaskWithDetails extends Task {
  comments: (Comment & { author: { name: string | null } })[];
}

interface TaskDetailModalProps {
  taskId: string;
  projectMembers: User[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ taskId, projectMembers, onClose, onUpdate }: TaskDetailModalProps) {
  const [task, setTask] = useState<Partial<TaskWithDetails> | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setUserRole(data.userRole);
      }
      setIsLoading(false);
    };
    fetchTask();
  }, [taskId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setTask(prev => prev ? { ...prev, [name]: value || null } : null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGenerateDescription = async () => {
    if (!task?.title) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask(prev => prev ? { ...prev, description: data.description } : null);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };
  
  if (isLoading) return <div className="p-8 text-center">Loading task...</div>;
  if (!task) return <div className="p-8 text-center">Task not found.</div>;

  const isReadOnly = userRole === 'MEMBER';

  return (
    <div className="p-6">
      <input
      title='Read only'
        name="title"
        value={task.title || ''}
        onChange={handleInputChange}
        readOnly={isReadOnly}
        className={`text-xl font-bold mb-6 bg-transparent w-full focus:outline-none rounded-md p-1 -m-1 ${!isReadOnly && 'focus:bg-gray-100 dark:focus:bg-gray-700'}`}
      />
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isAiLoading}
                className="flex items-center gap-1 text-xs text-orange-600 hover:underline disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isAiLoading ? 'Generating...' : 'Generate with AI'}
              </button>
            )}
          </div>
          <textarea
            id="description"
            name="description"
            value={task.description || ''}
            onChange={handleInputChange}
            readOnly={isReadOnly}
            rows={5}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 read-only:bg-gray-100 dark:read-only:bg-gray-800"
            placeholder={isReadOnly && !task.description ? 'No description provided.' : 'Add a description...'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Priority</label>
            <select
              id="priority"
              name="priority"
              value={task.priority || 'Medium'}
              onChange={handleInputChange}
              disabled={isReadOnly}
              className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 disabled:opacity-70"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 read-only:opacity-70"
            />
          </div>
        </div>
        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Assign To</label>
          <select
            id="assigneeId"
            name="assigneeId"
            value={task.assigneeId || ''}
            onChange={handleInputChange}
            disabled={isReadOnly}
            className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 disabled:opacity-70"
          >
            <option value="">Unassigned</option>
            {projectMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <CommentSection
        projectId={task.projectId!}
        taskId={taskId}
        initialComments={
          (task.comments || []).map(comment => ({
            ...comment,
            createdAt: typeof comment.createdAt === 'string'
              ? comment.createdAt
              : comment.createdAt.toISOString(),
          }))
        }
      />
      
      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Close</button>
        {!isReadOnly && (
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}