// src/components/TaskCard.tsx
'use client';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Trash2 } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  assignee?: { name: string | null } | null;
  onDelete: (id: string) => void;
}

export default function TaskCard({ id, title, assignee, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm group relative flex items-center gap-2"
    >
      {/* Drag Handle */}
      <div 
        {...listeners} 
        {...attributes} 
        className="cursor-grab touch-none p-1 text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={18} />
      </div>

      {/* Task Title (takes up the remaining space) */}
      <p className="flex-grow">{title}</p>

            {/* Assignee Avatar */}
      {assignee && (
        <div 
          title={`Assigned to ${assignee.name}`}
          className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold"
        >
          {assignee.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      
      {/* Delete Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="p-1 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 transition-opacity"
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}