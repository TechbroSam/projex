// src/app/projects/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false); // New state to control upgrade message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShowUpgrade(false);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        // Check for the special upgrade flag
        if (data.upgrade) {
          setShowUpgrade(true);
        } else {
          throw new Error(data.message || "Failed to create project.");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If showUpgrade is true, render the upgrade prompt instead of the form
  if (showUpgrade) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            You&apos;ve Reached Your Project Limit
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The free plan is limited to 3 projects. Upgrade to Premium to create
            unlimited projects and unlock features like AI assist, real-time
            chat, and more.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
            <Link
              href="/dashboard/billing"
              className="w-full sm:w-auto inline-block bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors"
            >
              Upgrade to Premium
            </Link>
            <button
              onClick={() => setShowUpgrade(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create a New Project</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Project Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
