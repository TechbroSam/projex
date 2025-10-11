// src/app/projects/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import AddTaskModal from "@/components/AddTaskModal";
import Modal from "@/components/Modal";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import TaskCard from "@/components/TaskCard";
import InviteMemberModal from "@/components/InviteMemberModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import { Video } from 'lucide-react'; 
import VideoChatModal from '@/components/VideoChatModal'; 


// Define types
interface User {
  id: string;
  image: string | null;
  name: string | null;
  email: string | null;
  hashedPassword: string | null;
  createdAt: Date;
  plan: "FREE" | "PREMIUM";
  stripeCustomerId: string | null;
  projectMembers: { role: string }[];
}
interface Task {
  id: string;
  title: string;
  status: string;
  assignee?: { id: string; name: string | null } | null;
}
interface Project {
  name: string;
  description: string | null;
  tasks: Task[];
  members: User[];
}

// Reusable Column Component
function TaskColumn({
  id,
  title,
  tasks,
  onDelete,
  onTaskClick,
}: {
  id: string;
  title: string;
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px]"
    >
      <h2 className="font-bold text-lg mb-4">
        {title} ({tasks.length})
      </h2>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick(task.id)}
            className="cursor-pointer"
          >
            <TaskCard
              id={task.id}
              title={task.title}
              assignee={task.assignee}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Correctly define the page's props
interface PageProps {
  params: {
    id: string;
  };
}

export default function ProjectPage({ params }: PageProps) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // FIX: Add state for the video chat modal, initialized to false
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);

  // Get the user's plan from the session, default to FREE
  const currentPlan = (session?.user as any)?.plan || "FREE";

 

  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setTasks(data.project.tasks || []);
      } else {
        console.error("Failed to fetch project");
        setProject(null);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProject();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [fetchProject, status, router]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (over) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks((current) => current.filter((t) => t.id !== taskId));
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    }
  };

  if (isLoading || status === "loading") {
    return <p className="text-center py-20">Loading project...</p>;
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">
          Failed to load project or you do not have access.
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:underline mt-4 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const tasksByStatus = {
    TODO: tasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: tasks.filter((task) => task.status === "DONE"),
  };

  const members = project.members || [];

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:underline mb-4 inline-block"
            >
              &larr; Back to Dashboard
            </Link>
            <div className="flex justify-between items-center mt-4">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {project.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Conditionally render the Invite button */}
                  {currentPlan === 'PREMIUM' && (
                <button onClick={() => setIsVideoChatOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  <Video size={20} /> Video Call
                </button>
              )}
                {/* Conditionally render the Invite button */}
                {currentPlan === "PREMIUM" && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    <Users size={20} /> Invite
                  </button>
                )}
                <button
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  <Plus size={20} /> Add Task
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <p className="text-sm font-semibold">Team:</p>
              <div className="flex -space-x-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    title={member.name || "User"}
                    className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900"
                  >
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                ))}
              </div>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TaskColumn
              id="TODO"
              title="To Do"
              tasks={tasksByStatus.TODO}
              onDelete={handleDeleteTask}
              onTaskClick={setSelectedTaskId}
            />
            <TaskColumn
              id="IN_PROGRESS"
              title="In Progress"
              tasks={tasksByStatus.IN_PROGRESS}
              onDelete={handleDeleteTask}
              onTaskClick={setSelectedTaskId}
            />
            <TaskColumn
              id="DONE"
              title="Done"
              tasks={tasksByStatus.DONE}
              onDelete={handleDeleteTask}
              onTaskClick={setSelectedTaskId}
            />
          </div>
        </div>
      </DndContext>
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      >
        <AddTaskModal
          projectId={id}
          onClose={() => setIsAddTaskModalOpen(false)}
          onTaskAdded={fetchProject}
        />
      </Modal>
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      >
        <InviteMemberModal
          projectId={id}
          onClose={() => setIsInviteModalOpen(false)}
          onMemberInvited={fetchProject}
        />
      </Modal>
      {selectedTaskId && (
        <Modal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        >
          <TaskDetailModal
            taskId={selectedTaskId}
            projectMembers={project.members}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={fetchProject}
          />
        </Modal>
      )}
        {/* FIX: Conditionally render the VideoChatModal */}
      {isVideoChatOpen && (
        <VideoChatModal 
          projectId={params.id} 
          onClose={() => setIsVideoChatOpen(false)} 
        />
      )}
    </>
  );
}
