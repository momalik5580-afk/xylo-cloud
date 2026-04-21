"use client"

import { useState } from "react"
import { TaskList } from "@/components/tasks/task-list"
import { CreateTaskModal } from "@/components/tasks/create-task-modal"

export default function TasksPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#8E939D]">All Tasks</h1>
        <p className="text-sm text-slate-400">View and manage all hotel operations tasks</p>
      </div>

      <TaskList
        title="Tasks"
        showCreateButton={true}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={() => window.location.reload()}
      />
    </div>
  )
}