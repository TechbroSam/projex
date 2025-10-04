// src/components/AddTaskModal.tsx
'use client';

import { useState } from 'react';

interface AddTaskModalProps {
  projectId: string;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function AddTaskModal({ projectId, onClose, onTaskAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, projectId, status: 'TODO' }), // Default status is TODO
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create task.');
      }
      
      onTaskAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Add New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
                {isLoading ? 'Adding...' : 'Add Task'}
            </button>
        </div>
      </form>
    </div>
  );
}