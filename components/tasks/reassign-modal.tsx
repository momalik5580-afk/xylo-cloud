"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, User } from "lucide-react"
import { toast } from "react-hot-toast"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  department?: {
    name: string
    code: string
  }
  role?: {
    name: string
  }
}

interface ReassignModalProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  onReassigned: () => void
  currentAssigneeId?: string | null
}

export function ReassignModal({
  taskId,
  isOpen,
  onClose,
  onReassigned,
  currentAssigneeId,
}: ReassignModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      setSelectedUserId(currentAssigneeId || null)
    }
  }, [isOpen, currentAssigneeId])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load staff")
    } finally {
      setLoading(false)
    }
  }

  async function handleReassign() {
    if (!taskId || !selectedUserId) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: selectedUserId }),
      })

      if (res.ok) {
        toast.success("Task reassigned successfully")
        onReassigned()
        onClose()
      } else {
        toast.error("Failed to reassign task")
      }
    } catch (error) {
      console.error("Error reassigning task:", error)
      toast.error("Failed to reassign task")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#8E939D] flex items-center gap-2">
            <User className="h-5 w-5" />
            Reassign Task
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedUserId === user.id
                  ? "bg-blue-600/20 border border-blue-500/50"
                  : "bg-slate-950/50 border border-slate-800 hover:bg-slate-800/50"
              }`}
            >
              <Avatar className="h-10 w-10 border border-slate-700">
                <AvatarFallback className="bg-slate-800 text-slate-300">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#8E939D]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[#8E939D]0">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-slate-600">
                    {user.department.name} • {user.role?.name}
                  </p>
                )}
              </div>
              {selectedUserId === user.id && (
                <div className="h-4 w-4 rounded-full bg-blue-500" />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleReassign}
            disabled={!selectedUserId || submitting || selectedUserId === currentAssigneeId}
            className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}