// src/components/TaskDetailView.tsx
import type { Task } from '@prisma/client';

export default function TaskDetailView({ task }: { task: Partial<Task> }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">{task.title}</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
          <p className="mt-1">{task.description || 'No description provided.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</h3>
            <p className="mt-1">{task.priority || 'Not set'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
            <p className="mt-1">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'Not set'}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
        You are a member on this project. Only admins can edit tasks.
      </p>
    </div>
  );
}