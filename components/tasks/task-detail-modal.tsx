"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Loader2, MapPin, Calendar, User, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  location: string
  locationType: string
  isVip: boolean
  escalationLevel: number
  slaBreached: boolean
  createdAt: string
  updatedAt: string
  department: {
    id: string
    name: string
    code: string
    color: string
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
  } | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  slaConfig?: {
    name: string
    responseTime: number
    resolutionTime: number
  }
}

interface TaskDetailModalProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: () => void
  onReassign: () => void
}

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onStatusUpdate,
  onReassign,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTask()
    }
  }, [taskId, isOpen])

  async function fetchTask() {
    if (!taskId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      const data = await res.json()
      setTask(data.task)
    } catch (error) {
      console.error("Error fetching task:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    if (!task) return
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchTask()
        onStatusUpdate()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/20 text-blue-400"
      case "IN_PROGRESS":
        return "bg-amber-500/20 text-amber-400"
      case "URGENT":
        return "bg-red-500/20 text-red-400 animate-pulse"
      case "READY":
        return "bg-emerald-500/20 text-emerald-400"
      case "CLOSED":
        return "bg-slate-500/20 text-slate-400"
      default:
        return "bg-slate-500/20 text-slate-400"
    }
  }

  function getNextStatus(currentStatus: string): string | null {
    const flow: { [key: string]: string } = {
      OPEN: "IN_PROGRESS",
      IN_PROGRESS: "READY",
      READY: "CLOSED",
    }
    return flow[currentStatus] || null
  }

  if (loading || !task) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const nextStatus = getNextStatus(task.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-[#8E939D] flex items-center gap-2">
                {task.title}
                {task.isVip && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-0">VIP</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-slate-400 mt-1">Task ID: {task.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn("capitalize", getPriorityColor(task.priority))}
              >
                {task.priority.toLowerCase()}
              </Badge>
              <Badge className={cn("capitalize", getStatusColor(task.status))}>
                {task.status.replace("_", " ").toLowerCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Description</h4>
            <p className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded-lg">
              {task.description || "No description provided"}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-[#8E939D]0">Location</p>
                <p className="text-sm text-slate-300">{task.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-[#8E939D]0">Department</p>
                <p className="text-sm text-slate-300">{task.department.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-[#8E939D]0">Created</p>
                <p className="text-sm text-slate-300">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-[#8E939D]0">Type</p>
                <p className="text-sm text-slate-300 capitalize">{task.type.toLowerCase()}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Assigned To */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3">Assigned To</h4>
            {task.assignedTo ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-700">
                  <AvatarFallback className="bg-slate-800 text-slate-300">
                    {task.assignedTo.firstName[0]}
                    {task.assignedTo.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-[#8E939D]">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-[#8E939D]0">{task.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#8E939D]0 italic">Unassigned</p>
            )}
          </div>

          {/* Alerts */}
          {(task.slaBreached || task.escalationLevel > 0) && (
            <div className="space-y-2">
              {task.slaBreached && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">SLA Breached</span>
                </div>
              )}
              {task.escalationLevel > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    Escalation Level {task.escalationLevel}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {nextStatus && (
              <Button
                onClick={() => updateStatus(nextStatus)}
                className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as {nextStatus.replace("_", " ")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onReassign}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Reassign
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}