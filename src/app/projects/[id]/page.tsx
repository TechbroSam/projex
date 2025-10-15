// src/app/projects/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Users} from "lucide-react";
import AddTaskModal from "@/components/AddTaskModal";
import Modal from "@/components/Modal";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import TaskCard from "@/components/TaskCard";
import InviteMemberModal from "@/components/InviteMemberModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import { Role } from "@prisma/client";
import { SimpleUser } from "@/types";

// Define simpler, more focused types for this component

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
  members: SimpleUser[];
}
// FIX: Define a specific type for the session user to avoid 'any'
interface SessionUser {
  name?: string | null;
  plan?: string;
}

// Reusable Column Component
function TaskColumn({
  id,
  title,
  tasks,
  onDelete,
  onTaskClick,
  canEdit,
}: {
  id: string;
  title: string;
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  canEdit: boolean;
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
              canEdit={canEdit}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// FIX: Use the standard, stable props signature
export default function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const user = session?.user as SessionUser;
  const currentPlan = user?.plan || "FREE";

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setTasks(data.project.tasks || []);
      setCurrentUserRole(data.currentUserRole);
    } else {
      setProject(null); // Explicitly set to null on failure
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProject();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [fetchProject, status, router]);
  
  const canEdit = currentUserRole === 'ADMIN';

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks((current) => current.filter((t) => t.id !== taskId));
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    }
  };

  if (status === "loading" || !project) {
    return <p className="text-center py-20">Loading project...</p>;
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
            <div className="flex flex-wrap gap-4 justify-between items-center mt-4">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {project.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentPlan === "PREMIUM" && canEdit && (
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      <Users size={20} /> Invite
                    </button>
                )}
                <button
                  onClick={() => setIsAddTaskModalOpen(true)}
                  disabled={!canEdit}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
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
            <TaskColumn id="TODO" title="To Do" tasks={tasksByStatus.TODO} onDelete={handleDeleteTask} onTaskClick={setSelectedTaskId} canEdit={canEdit} />
            <TaskColumn id="IN_PROGRESS" title="In Progress" tasks={tasksByStatus.IN_PROGRESS} onDelete={handleDeleteTask} onTaskClick={setSelectedTaskId} canEdit={canEdit} />
            <TaskColumn id="DONE" title="Done" tasks={tasksByStatus.DONE} onDelete={handleDeleteTask} onTaskClick={setSelectedTaskId} canEdit={canEdit} />
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
    </>
  );
}