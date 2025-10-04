// src/app/projects/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AddTaskModal from '@/components/AddTaskModal';
import Modal from '@/components/Modal';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import TaskCard from '@/components/TaskCard';

// Define types for our data
interface Task {
  id: string;
  title: string;
  status: string;
}
interface Project {
  name: string;
  description: string | null;
  tasks: Task[];
}

// Reusable Column Component with onDelete prop
function TaskColumn({ id, title, tasks, onDelete }: { id: string; title: string; tasks: Task[]; onDelete: (taskId: string) => void }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px]">
      <h2 className="font-bold text-lg mb-4">{title} ({tasks.length})</h2>
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskCard key={task.id} id={task.id} title={task.title} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setTasks(data.project.tasks);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'authenticated') fetchProject();
  }, [fetchProject, status]);
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && over.id !== active.data.current?.status) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    }
  };
  
  if (!project) return <p className="text-center py-20">Loading project...</p>;
  
  const tasksByStatus = {
    TODO: tasks.filter(task => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
    DONE: tasks.filter(task => task.status === 'DONE'),
  };

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:underline mb-4 inline-block">
              &larr; Back to Dashboard
            </Link>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                  <Plus size={20} /> Add Task
                </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TaskColumn id="TODO" title="To Do" tasks={tasksByStatus.TODO} onDelete={handleDeleteTask} />
            <TaskColumn id="IN_PROGRESS" title="In Progress" tasks={tasksByStatus.IN_PROGRESS} onDelete={handleDeleteTask} />
            <TaskColumn id="DONE" title="Done" tasks={tasksByStatus.DONE} onDelete={handleDeleteTask} />
          </div>
        </div>
      </DndContext>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddTaskModal 
          projectId={params.id}
          onClose={() => setIsModalOpen(false)}
          onTaskAdded={fetchProject}
        />
      </Modal>
    </>
  );
}