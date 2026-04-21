"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterState {
  status: string[]
  priority: string[]
  department: string[]
  type: string[]
  isVip: boolean | null
  dateRange: string
}

interface TaskFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  departments: { id: string; name: string; code: string }[]
  className?: string
}

const statusOptions = [
  { value: "OPEN", label: "Open", color: "bg-blue-500/20 text-blue-400" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500/20 text-amber-400" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500/20 text-red-400" },
  { value: "READY", label: "Ready", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-500/20 text-slate-400" },
]

const priorityOptions = [
  { value: "LOW", label: "Low", color: "bg-blue-500/20 text-blue-400" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-500/20 text-amber-400" },
  { value: "HIGH", label: "High", color: "bg-orange-500/20 text-orange-400" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-500/20 text-red-400" },
]

const typeOptions = [
  { value: "SERVICE", label: "Service" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HOUSEKEEPING", label: "Housekeeping" },
]

const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
]

export function TaskFilters({
  filters,
  onFilterChange,
  departments,
  className,
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  function toggleStatus(status: string) {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    onFilterChange({ ...filters, status: newStatus })
  }

  function togglePriority(priority: string) {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority]
    onFilterChange({ ...filters, priority: newPriority })
  }

  function toggleType(type: string) {
    const newType = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type]
    onFilterChange({ ...filters, type: newType })
  }

  function clearAllFilters() {
    onFilterChange({
      status: [],
      priority: [],
      department: [],
      type: [],
      isVip: null,
      dateRange: "all",
    })
  }

  const activeFiltersCount =
    filters.status.length +
    filters.priority.length +
    filters.department.length +
    filters.type.length +
    (filters.isVip !== null ? 1 : 0) +
    (filters.dateRange !== "all" ? 1 : 0)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "border-slate-700 text-slate-300 hover:bg-slate-800",
            isExpanded && "bg-slate-800"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-600 text-[#8E939D]"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-slate-400 hover:text-[#8E939D]"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Quick filters - always visible */}
        <div className="flex gap-2">
          {statusOptions.slice(0, 3).map((status) => (
            <Badge
              key={status.value}
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors",
                filters.status.includes(status.value)
                  ? status.color
                  : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500"
              )}
              onClick={() => toggleStatus(status.value)}
            >
              {status.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-4">
          {/* Status */}
          <div>
            <Label className="text-sm text-slate-400 mb-2 block">Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Badge
                  key={status.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.status.includes(status.value)
                      ? status.color
                      : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500"
                  )}
                  onClick={() => toggleStatus(status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Priority */}
          <div>
            <Label className="text-sm text-slate-400 mb-2 block">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <Badge
                  key={priority.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.priority.includes(priority.value)
                      ? priority.color
                      : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500"
                  )}
                  onClick={() => togglePriority(priority.value)}
                >
                  {priority.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Department */}
          <div>
            <Label className="text-sm text-slate-400 mb-2 block">Department</Label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.department.includes(dept.id)
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500"
                  )}
                  onClick={() => {
                    const newDept = filters.department.includes(dept.id)
                      ? filters.department.filter((d) => d !== dept.id)
                      : [...filters.department, dept.id]
                    onFilterChange({ ...filters, department: newDept })
                  }}
                >
                  {dept.code}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Type & VIP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-400 mb-2 block">Type</Label>
              <div className="space-y-2">
                {typeOptions.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={filters.type.includes(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                    />
                    <Label
                      htmlFor={`type-${type.value}`}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-400 mb-2 block">Other</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vip-only"
                    checked={filters.isVip === true}
                    onCheckedChange={(checked) =>
                      onFilterChange({
                        ...filters,
                        isVip: checked ? true : null,
                      })
                    }
                  />
                  <Label htmlFor="vip-only" className="text-sm text-slate-300 cursor-pointer">
                    VIP Tasks Only
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Date Range */}
          <div>
            <Label className="text-sm text-slate-400 mb-2 block">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                onFilterChange({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-[#8E939D]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {dateRangeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[#8E939D]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}