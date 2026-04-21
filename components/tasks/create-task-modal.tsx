"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface Department {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  departmentId: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
  defaultDepartmentId?: string
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultDepartmentId,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "SERVICE",
    priority: "MEDIUM",
    location: "",
    locationType: "ROOM",
    departmentId: defaultDepartmentId || "",
    assignedToId: "",
    isVip: false,
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchStaff()
      if (defaultDepartmentId) {
        setFormData((prev) => ({ ...prev, departmentId: defaultDepartmentId }))
      }
    }
  }, [isOpen, defaultDepartmentId])

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments")
      const data = await res.json()
      setDepartments(data.departments || [])
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  async function fetchStaff() {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setStaff(data.users || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.departmentId) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Get current user ID from your auth system
      const createdById = "current-user-id" // Replace with actual user ID

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          createdById,
        }),
      })

      if (res.ok) {
        toast.success("Task created successfully")
        onTaskCreated()
        onClose()
        resetForm()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to create task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      type: "SERVICE",
      priority: "MEDIUM",
      location: "",
      locationType: "ROOM",
      departmentId: defaultDepartmentId || "",
      assignedToId: "",
      isVip: false,
    })
  }

  const filteredStaff = staff.filter((s) => s.departmentId === formData.departmentId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#8E939D]">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className="bg-slate-950 border-slate-700 text-[#8E939D]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              className="bg-slate-950 border-slate-700 text-[#8E939D] min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Department <span className="text-red-400">*</span></Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value, assignedToId: "" })
                }
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-[#8E939D]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-[#8E939D]">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Assign To</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                disabled={!formData.departmentId}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-[#8E939D]">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="unassigned" className="text-[#8E939D]">
                    Unassigned
                  </SelectItem>
                  {filteredStaff.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-[#8E939D]">
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-[#8E939D]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="LOW" className="text-[#8E939D]">Low</SelectItem>
                  <SelectItem value="MEDIUM" className="text-[#8E939D]">Medium</SelectItem>
                  <SelectItem value="HIGH" className="text-[#8E939D]">High</SelectItem>
                  <SelectItem value="CRITICAL" className="text-[#8E939D]">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-[#8E939D]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="SERVICE" className="text-[#8E939D]">Service</SelectItem>
                  <SelectItem value="MAINTENANCE" className="text-[#8E939D]">Maintenance</SelectItem>
                  <SelectItem value="EMERGENCY" className="text-[#8E939D]">Emergency</SelectItem>
                  <SelectItem value="HOUSEKEEPING" className="text-[#8E939D]">Housekeeping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-slate-300">
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Room 1823, Lobby, Kitchen"
              className="bg-slate-950 border-slate-700 text-[#8E939D]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isVip"
              checked={formData.isVip}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isVip: checked as boolean })
              }
            />
            <Label htmlFor="isVip" className="text-slate-300 cursor-pointer">
              VIP Guest Task
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}