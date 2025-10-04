// src/components/TaskCard.tsx
'use-client';
import { useDraggable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

export default function TaskCard({ id, title, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm group relative"
    >
      <div {...listeners} {...attributes} className="w-full h-full touch-none">
        <p>{title}</p>
      </div>
      <button 
        onClick={() => onDelete(id)}
        className="absolute top-2 right-2 p-1 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 transition-opacity"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}