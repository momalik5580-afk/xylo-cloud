"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface TopPerformersProps {
  data: Array<{ name: string; department: string; image: string | null; completedTasks: number }>
  isLoading?: boolean
}

export function TopPerformers({ data, isLoading }: TopPerformersProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2"><div className="h-4 w-32 bg-slate-800 rounded" /><div className="h-3 w-20 bg-slate-800 rounded" /></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((performer, index) => (
        <div key={performer.name} className="flex items-center gap-4">
          <div className="flex-shrink-0 w-6 text-center font-bold text-[#8E939D]0">
            {index === 0 ? <Trophy className="h-5 w-5 text-yellow-400 mx-auto" /> : index + 1}
          </div>
          <Avatar className="h-10 w-10 border-2 border-slate-700">
            <AvatarImage src={performer.image || undefined} />
            <AvatarFallback className="bg-slate-800 text-slate-300">{performer.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#8E939D] truncate">{performer.name}</p>
            <p className="text-xs text-[#8E939D]0">{performer.department}</p>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 bg-slate-800 text-slate-300 border-slate-700">
            {performer.completedTasks} tasks
          </Badge>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-[#8E939D]0 text-center py-4">No completed tasks in this period</p>}
    </div>
  )
}