"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Loader2, ConciergeBell, Sparkles, Bell, Wrench, UtensilsCrossed, Shield, Calendar, ChefHat, Flower2, Dumbbell, HeartPulse, Monitor, DollarSign, Users, TrendingUp } from "lucide-react"

interface DeptRaw {
  id: string
  code: string
  name: string
  stats: {
    totalTasks: number
    openWorkOrders: number
    inventoryItems: number
    incidents: number
    taskBreakdown: { status: string; _count: { status: number } }[]
  }
}

// Normalise any DB code → short key
function normalise(code: string): string {
  const map: Record<string, string> = {
    FRONT_OFFICE: "FO", FO: "FO", FD: "FO",
    HOUSEKEEPING: "HK", HK: "HK",
    ROOM_SERVICE: "RS", RS: "RS",
    ENGINEERING: "ENG", ENG: "ENG",
    "F&B": "FNB", FNB: "FNB", RNB: "FNB", RES: "FNB",
    SECURITY: "SEC", SEC: "SEC",
    BANQUETS: "BNQ", BNQ: "BNQ", BQT: "BNQ", BANQUET: "BNQ",
    KITCHEN: "KIT", KIT: "KIT",
    SPA: "SPA",
    GYM: "GYM", RECREATION: "GYM",
    CLINIC: "CLN", CLN: "CLN",
    IT: "IT",
    FINANCE: "FIN", FIN: "FIN",
    HR: "HR",
    SALES: "SLS", SLS: "SLS", SM: "SLS", SAL: "SLS",
  }
  return map[code] ?? code
}

// Short key → dashboard ?view= param
const CODE_TO_VIEW: Record<string, string> = {
  FO:  "front-desk",
  HK:  "housekeeping",
  RS:  "room-service",
  ENG: "engineering",
  FNB: "restaurants",
  SEC: "security",
  BNQ: "banquet",
  KIT: "kitchen",
  SPA: "spa",
  GYM: "gym",
  CLN: "clinic",
  IT:  "it",
  FIN: "finance",
  HR:  "hr",
  SLS: "sales",
}

const ORDER = ["FO","HK","RS","ENG","FNB","SEC","BNQ","KIT","SPA","GYM","CLN","IT","FIN","HR","SLS"]

const DEPT_META: Record<string, {
  label: string
  icon: React.ElementType
  metrics: { label: string; key: keyof DeptRaw["stats"] }[]
}> = {
  FO:  { label: "Front Desk",   icon: ConciergeBell,   metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory Items", key: "inventoryItems" }] },
  HK:  { label: "Housekeeping", icon: Sparkles,        metrics: [{ label: "Linen Inventory", key: "inventoryItems" }, { label: "Turndown Service", key: "openWorkOrders" }, { label: "Deep Cleaning Schedule", key: "incidents" }, { label: "Staff Utilization", key: "totalTasks" }] },
  RS:  { label: "Room Service", icon: Bell,            metrics: [{ label: "Active Orders", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory Items", key: "inventoryItems" }] },
  ENG: { label: "Engineering",  icon: Wrench,          metrics: [{ label: "Open Work Orders", key: "openWorkOrders" }, { label: "Critical Issues", key: "incidents" }, { label: "Active Tasks", key: "totalTasks" }, { label: "Parts Stock", key: "inventoryItems" }] },
  FNB: { label: "F&B",          icon: UtensilsCrossed, metrics: [{ label: "Active Orders", key: "openWorkOrders" }, { label: "Delayed", key: "incidents" }, { label: "Tables occupied", key: "totalTasks" }, { label: "Inventory Alerts", key: "inventoryItems" }] },
  SEC: { label: "Security",     icon: Shield,          metrics: [{ label: "Incidents", key: "incidents" }, { label: "Urgent", key: "openWorkOrders" }, { label: "Cameras offline", key: "totalTasks" }, { label: "Restricted Access", key: "inventoryItems" }] },
  BNQ: { label: "Banquet",      icon: Calendar,        metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  KIT: { label: "Kitchen",      icon: ChefHat,         metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  SPA: { label: "Spa",          icon: Flower2,         metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  GYM: { label: "Gym",          icon: Dumbbell,        metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  CLN: { label: "Clinic",       icon: HeartPulse,      metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  IT:  { label: "IT",           icon: Monitor,         metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  FIN: { label: "Finance",      icon: DollarSign,      metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  HR:  { label: "HR",           icon: Users,           metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
  SLS: { label: "Sales",        icon: TrendingUp,      metrics: [{ label: "Active Tasks", key: "totalTasks" }, { label: "Work Orders", key: "openWorkOrders" }, { label: "Incidents", key: "incidents" }, { label: "Inventory", key: "inventoryItems" }] },
}

function deriveStatus(stats: DeptRaw["stats"]): { label: string; dot: string; text: string } {
  if (stats.incidents > 3)    return { label: "CRITICAL", dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",     text: "text-red-500"     }
  if (stats.incidents > 0)    return { label: "WARNING",  dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",   text: "text-amber-400"   }
  if (stats.totalTasks > 20)  return { label: "BUSY",   dot: "bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.8)]",    text: "text-[#0ea5e9]"    }
  return                             { label: "NOMINAL", dot: "bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]", text: "text-[#00f2ff]" }
}

function DeptCard({ dept, onClick }: { dept: DeptRaw; onClick: () => void }) {
  const key  = normalise(dept.code)
  const meta = DEPT_META[key]
  if (!meta) return null

  const Icon   = meta.icon
  const status = deriveStatus(dept.stats)
  const pct    = Math.min(100, (dept.stats.totalTasks / 50) * 100)
  const filled = pct > 66 ? 3 : pct > 33 ? 2 : pct > 0 ? 1 : 0

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] p-4 flex flex-col cursor-pointer hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10 pb-2 border-b border-[#00f2ff]/10">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#00f2ff] opacity-70 group-hover:opacity-100 transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.25)] group-hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" strokeWidth={1.8} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] group-hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.15)] transition-all">{meta.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[8px] font-bold uppercase tracking-widest", status.text)}>{status.label}</span>
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse", status.dot)} />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2 flex-1 mt-1 relative z-10">
        {meta.metrics.map((m) => {
          const val = dept.stats[m.key] as number ?? 0
          return (
            <div key={m.label} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              <span className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{m.label}</span>
              {val === 0
                ? <span className="text-[10px] font-bold text-[#5C6270]">—</span>
                : <span className="text-[11px] font-bold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)] group-hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.4)] transition-all">{val}</span>
              }
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mt-3 pt-3 border-t border-[#00f2ff]/10 relative z-10">
        {[0,1,2].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-sm transition-colors duration-300", i < filled ? "bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.6)] group-hover:shadow-[0_0_12px_rgba(0,242,255,0.9)]" : "bg-[#00f2ff]/10")} />
        ))}
      </div>
    </div>
  )
}

const PAGE_SIZE = 4

export function DepartmentPanels() {
  const router = useRouter()
  const [departments, setDepartments] = useState<DeptRaw[]>([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard/stats")
        const json = await res.json()
        if (json.departments?.length) {
          // Deduplicate by normalised code, keep highest totalTasks
          const seen = new Map<string, DeptRaw>()
          for (const d of json.departments as DeptRaw[]) {
            const key = normalise(d.code)
            if (!DEPT_META[key]) continue
            const existing = seen.get(key)
            if (!existing || d.stats.totalTasks > existing.stats.totalTasks) {
              seen.set(key, d)
            }
          }
          // Sort by ORDER
          const sorted = Array.from(seen.values()).sort((a, b) => {
            const ai = ORDER.indexOf(normalise(a.code))
            const bi = ORDER.indexOf(normalise(b.code))
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
          })
          setDepartments(sorted)
        }
      } catch (e) {
        console.error("DepartmentPanels:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  const handleCardClick = (dept: DeptRaw) => {
    const key  = normalise(dept.code)
    const view = CODE_TO_VIEW[key]
    if (view) router.push(`/dashboard?view=${view}`)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#00f2ff]/10 bg-[#0a0c10] h-44 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#00f2ff]/40" />
          </div>
        ))}
      </div>
    )
  }

  if (departments.length === 0) return null

  const totalPages = Math.ceil(departments.length / PAGE_SIZE)
  const visible    = departments.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="relative">
      {/* Left arrow */}
      {page > 0 && (
        <button
          onClick={() => setPage(p => p - 1)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0c10] border border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#00f2ff]/10 hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all"
        >
          <ChevronLeft className="h-4 w-4 text-[#00f2ff]" />
        </button>
      )}

      {/* Cards — always 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visible.map(d => (
          <DeptCard key={d.id} dept={d} onClick={() => handleCardClick(d)} />
        ))}
        {Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
          <div key={`empty-${i}`} className="rounded-xl border border-dashed border-[#00f2ff]/10 bg-transparent h-44 opacity-50" />
        ))}
      </div>

      {/* Right arrow */}
      {page < totalPages - 1 && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0c10] border border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#00f2ff]/10 hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all"
        >
          <ChevronRight className="h-4 w-4 text-[#00f2ff]" />
        </button>
      )}

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === page ? "w-4 bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]" : "w-1.5 bg-[#00f2ff]/20"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
