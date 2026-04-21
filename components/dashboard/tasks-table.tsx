"use client"

import { useState } from "react"
import { TaskList } from "@/components/tasks/task-list"
import { CreateTaskModal } from "@/components/tasks/create-task-modal"

export function RunningTasksTable() {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <>
      <TaskList 
        title="Running Tasks"
        showCreateButton={false}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={() => window.location.reload()}
      />
    </>
  )
}