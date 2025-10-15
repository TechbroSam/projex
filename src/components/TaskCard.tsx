// src/components/TaskCard.tsx
'use client';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Trash2 } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  assignee?: { name: string | null } | null;
  onDelete: (id: string) => void;
  canEdit: boolean; // Add the missing prop
}

export default function TaskCard({ id, title, assignee, onDelete, canEdit }: TaskCardProps) {
  // Conditionally disable dragging if the user does not have permission
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: !canEdit,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm group relative flex items-center gap-2"
    >
      {/* Drag Handle - only interactive if the user can edit */}
      <div
        {...(canEdit ? listeners : {})}
        {...(canEdit ? attributes : {})}
        className={`p-1 text-gray-400 ${canEdit ? 'cursor-grab touch-none' : 'cursor-default'}`}
      >
        <GripVertical size={18} />
      </div>

      <p className="flex-grow text-sm">{title}</p>

      {/* Assignee Avatar */}
      <div className="flex items-center space-x-6">
{assignee && (
        <div
          title={`Assigned to ${assignee.name}`}
          className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold"
        >
          {assignee.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      {/* Delete Button - only visible if the user can edit */}
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute top-1 right-1 p-1 text-gray-400 opacity-100 sm:opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      )}
      </div>
      
    </div>
  );
}