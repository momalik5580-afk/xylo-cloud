"use client"

import { useState, useEffect } from "react"
import {
  ConciergeBell, Sparkles, Utensils, Calendar, Bell, ChefHat,
  Flower2, Dumbbell, HeartPulse, Wrench, Shield, Monitor,
  DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

// DB department code → dashboard view name
// DB returns full codes like FRONT_OFFICE, HOUSEKEEPING, GYM etc.
const CODE_TO_VIEW: Record<string, string> = {
  // Full DB codes
  FRONT_OFFICE:  "front-desk",
  HOUSEKEEPING:  "housekeeping",
  RES:           "restaurants",
  BNQ:           "banquet",
  BANQUETS:      "banquet",
  RS:            "room-service",
  KIT:           "kitchen",
  SPA:           "spa",
  GYM:           "gym",
  RECREATION:    "gym",
  CLINIC:        "clinic",
  ENGINEERING:   "engineering",
  SECURITY:      "security",
  IT:            "it",
  FINANCE:       "finance",
  HR:            "hr",
  SALES:         "sales",
  "F&B":         "restaurants",
  // Short codes (fallback)
  FO:            "front-desk",
  FD:            "front-desk",
  HK:            "housekeeping",
  RNB:           "restaurants",
  BQT:           "banquet",
  SLS:           "sales",
  SAL:           "sales",
  ENG:           "engineering",
  SEC:           "security",
  FIN:           "finance",
  GM:            "gm-overview",
}

const DEPARTMENTS = [
  { code: "FO",  name: "Front Office",           icon: ConciergeBell, color: "blue"    },
  { code: "HK",  name: "Housekeeping",            icon: Sparkles,      color: "green"   },
  { code: "RNB", name: "Restaurants & Bars",      icon: Utensils,      color: "orange"  },
  { code: "BQT", name: "Banquet & Events",        icon: Calendar,      color: "purple"  },
  { code: "RS",  name: "Room Service",            icon: Bell,          color: "pink"    },
  { code: "KIT", name: "Kitchen",                 icon: ChefHat,       color: "red"     },
  { code: "SPA", name: "Spa",                     icon: Flower2,       color: "teal"    },
  { code: "GYM", name: "Gym & Recreation",        icon: Dumbbell,      color: "cyan"    },
  { code: "CLN", name: "Clinic",                  icon: HeartPulse,    color: "rose"    },
  { code: "ENG", name: "Engineering",             icon: Wrench,        color: "yellow"  },
  { code: "SEC", name: "Security",                icon: Shield,        color: "slate"   },
  { code: "IT",  name: "IT Department",           icon: Monitor,       color: "indigo"  },
  { code: "FIN", name: "Finance",                 icon: DollarSign,    color: "emerald" },
  { code: "HR",  name: "Human Resources",         icon: Users,         color: "violet"  },
  { code: "SM",  name: "Sales & Marketing",       icon: TrendingUp,    color: "amber"   },
]

const COLOR_MAP: Record<string, string> = {
  blue:    "bg-blue-500/10    text-blue-400    border-blue-500/30",
  green:   "bg-green-500/10   text-green-400   border-green-500/30",
  orange:  "bg-orange-500/10  text-orange-400  border-orange-500/30",
  purple:  "bg-purple-500/10  text-purple-400  border-purple-500/30",
  pink:    "bg-pink-500/10    text-pink-400    border-pink-500/30",
  red:     "bg-red-500/10     text-red-400     border-red-500/30",
  teal:    "bg-teal-500/10    text-teal-400    border-teal-500/30",
  cyan:    "bg-cyan-500/10    text-cyan-400    border-cyan-500/30",
  rose:    "bg-rose-500/10    text-rose-400    border-rose-500/30",
  yellow:  "bg-yellow-500/10  text-yellow-400  border-yellow-500/30",
  slate:   "bg-slate-500/10   text-[#8E939D]   border-slate-500/30",
  indigo:  "bg-indigo-500/10  text-indigo-400  border-indigo-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  violet:  "bg-violet-500/10  text-violet-400  border-violet-500/30",
  amber:   "bg-amber-500/10   text-amber-400   border-amber-500/30",
}

interface Metrics {
  activeTasks: number
  workOrders: number
  incidents: number
  slaBreaches: number
}

interface DepartmentTabProps {
  dept: typeof DEPARTMENTS[0]
  metrics?: Metrics
  isActive: boolean
  onClick: () => void
}

function DepartmentTab({ dept, metrics, isActive, onClick }: DepartmentTabProps) {
  const Icon       = dept.icon
  const colorClass = COLOR_MAP[dept.color] ?? COLOR_MAP.blue

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-w-[170px] flex-col gap-2 rounded-xl border p-3 text-left transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg",
        isActive
          ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
          : "bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20/60 hover:border-slate-600/80",
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        {metrics && metrics.slaBreaches > 0 && (
          <Badge variant="outline" className="h-5 text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
            {metrics.slaBreaches} SLA
          </Badge>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#8E939D] leading-none">{dept.name}</h4>
        <p className="text-xs text-[#5C6270] mt-0.5">{dept.code}</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex flex-col">
            <span className="text-[#5C6270]">Tasks</span>
            <span className="font-semibold text-[#8E939D]">{metrics.activeTasks}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5C6270]">W/Orders</span>
            <span className="font-semibold text-[#8E939D]">{metrics.workOrders}</span>
          </div>
          {metrics.incidents > 0 && (
            <div className="col-span-2 text-amber-400 font-medium">
              ⚠ {metrics.incidents} incident{metrics.incidents > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </button>
  )
}

interface DepartmentTabsProps {
  selectedDept?: string
  onDeptSelect?: (code: string) => void
}

export function DepartmentTabs({ selectedDept = "FO", onDeptSelect }: DepartmentTabsProps) {
  const router  = useRouter()
  const [metrics, setMetrics] = useState<Record<string, Metrics>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res  = await fetch("/api/departments")
        const data = await res.json()

        // API returns { departments: [...] }
        const list = Array.isArray(data) ? data : (data.departments ?? [])

        const formatted: Record<string, Metrics> = {}
        // Store metrics by DB code, dept id, and name for reliable lookup
        list.forEach((dept: any) => {
          const entry = {
            activeTasks: dept._count?.tasks       ?? 0,
            workOrders:  dept._count?.work_orders ?? 0,
            incidents:   dept._count?.incidents   ?? 0,
            slaBreaches: 0,
          }
          if (dept.code) formatted[dept.code] = entry
          if (dept.id)   formatted[dept.id]   = entry
          if (dept.name) formatted[dept.name] = entry
        })
        setMetrics(formatted)
      } catch (err) {
        console.error("DepartmentTabs fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
    const iv = setInterval(fetchMetrics, 60_000)
    return () => clearInterval(iv)
  }, [])

  const handleClick = (dept: typeof DEPARTMENTS[0]) => {
    const view = CODE_TO_VIEW[dept.code] ?? dept.code.toLowerCase()
    if (onDeptSelect) {
      onDeptSelect(dept.code)
    } else {
      router.push(`/dashboard?view=${view}`)
    }
  }

  if (loading) {
    return (
      <ScrollArea className="w-full">
        <div className="flex gap-3 p-1">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-[170px] rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/10" />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 p-1">
        {DEPARTMENTS.map((dept) => (
          <DepartmentTab
            key={dept.code}
            dept={dept}
            metrics={metrics[dept.code] ?? metrics[dept.name] ?? undefined}
            isActive={selectedDept === dept.code}
            onClick={() => handleClick(dept)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
