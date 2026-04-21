"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Sparkles, Wrench, UtensilsCrossed, Shield,
  AlertCircle, CheckCircle2, Clock, BedDouble,
} from "lucide-react"

interface FeedEvent {
  id: string
  timestamp: string
  message: string
  type: "housekeeping" | "engineering" | "fb" | "security" | "system" | "frontdesk"
  icon: React.ElementType
}

const typeColors = {
  housekeeping: "text-emerald-400",
  engineering:  "text-amber-400",
  fb:           "text-orange-400",
  security:     "text-red-400",
  system:       "text-blue-400",
  frontdesk:    "text-purple-400",
}

const DEPT_TYPE_MAP: Record<string, FeedEvent["type"]> = {
  Housekeeping: "housekeeping",
  Engineering:  "engineering",
  "F&B":        "fb",
  Security:     "security",
  "Front Desk": "frontdesk",
  "Room Service":"fb",
}

const DEPT_ICON_MAP: Record<string, React.ElementType> = {
  Housekeeping:  Sparkles,
  Engineering:   Wrench,
  "F&B":         UtensilsCrossed,
  Security:      Shield,
  "Front Desk":  BedDouble,
  "Room Service":UtensilsCrossed,
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: "opened", IN_PROGRESS: "in progress", CLOSED: "completed",
    URGENT: "urgent", READY: "ready for review", CANCELLED: "cancelled",
  }
  return map[status] ?? status.toLowerCase()
}

export function RealTimeEventFeed() {
  const [events,   setEvents]   = useState<FeedEvent[]>([])
  const scrollRef               = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard/stats")
        const json = await res.json()
        if (!json.recentTasks?.length) return

        const feed: FeedEvent[] = json.recentTasks.map((t: any) => {
          const deptName = t.departments?.name ?? "General"
          const type     = DEPT_TYPE_MAP[deptName] ?? "system"
          const icon     = DEPT_ICON_MAP[deptName] ?? Clock
          const time     = new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          return {
            id:        t.id,
            timestamp: time,
            message:   `${t.title} — ${statusLabel(t.status)}`,
            type,
            icon,
          }
        })

        setEvents(feed)
      } catch (e) {
        console.error("EventFeed:", e)
      }
    }
    load()
    const iv = setInterval(load, 30_000)
    return () => clearInterval(iv)
  }, [])

  // Auto-scroll animation
  useEffect(() => {
    if (!scrollRef.current || isPaused || events.length === 0) return
    const el = scrollRef.current
    let animId: number
    let pos = 0
    const animate = () => {
      pos += 0.5
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [isPaused, events])

  if (events.length === 0) return null

  return (
    <Card className="border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div
        ref={scrollRef}
        className="flex items-center gap-6 py-3 px-4 overflow-x-hidden relative z-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {[...events, ...events].map((event, index) => {
          const Icon = event.icon
          return (
            <div key={`${event.id}-${index}`} className="flex items-center gap-3 flex-shrink-0 group/event cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-xs font-mono text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{event.timestamp}</span>
              <div className={cn("p-1.5 rounded-lg bg-[#0a0c10] border border-[#00f2ff]/15 group-hover/event:border-[#00f2ff]/30 group-hover/event:shadow-[0_0_10px_rgba(0,242,255,0.2)] transition-all", typeColors[event.type])}>
                <Icon className="h-3.5 w-3.5 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]" />
              </div>
              <span className="text-sm text-slate-300 group-hover/event:text-[#00f2ff] transition-colors whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]">
                {event.message}
              </span>
              <div className="h-4 w-[1px] bg-[#00f2ff]/20 ml-3 group-hover/event:bg-[#00f2ff]/40 transition-colors" />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
