"use client"

import { useEffect, useState } from "react"
import { Loader2, TrendingUp, DollarSign, Users, AlertTriangle, BedDouble } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPIData {
  occupancyRate: number
  adr: number
  revenue: number
  activeAlerts: number
  staffOnDuty: number
}

const KPI_CONFIG = [
  {
    key: "occupancyRate" as keyof KPIData,
    label: "Occupancy Rate",
    icon: BedDouble,
    iconStyle: "text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]",
    iconBg: "bg-[#00f2ff]/10 border-r border-[#00f2ff]/10",
    format: (v: number) => `${v}%`,
  },
  {
    key: "adr" as keyof KPIData,
    label: "ADR",
    icon: DollarSign,
    iconStyle: "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]",
    iconBg: "bg-emerald-500/10 border-r border-[#00f2ff]/10",
    format: (v: number) => `$${v}`,
  },
  {
    key: "revenue" as keyof KPIData,
    label: "Revenue",
    icon: TrendingUp,
    iconStyle: "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]",
    iconBg: "bg-amber-500/10 border-r border-[#00f2ff]/10",
    format: (v: number) => `$${(v/1000).toFixed(1)}K`,
  },
  {
    key: "activeAlerts" as keyof KPIData,
    label: "Active Alerts",
    icon: AlertTriangle,
    iconStyle: "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]",
    iconBg: "bg-red-500/10 border-r border-[#00f2ff]/10",
    format: (v: number) => `${v}`,
  },
  {
    key: "staffOnDuty" as keyof KPIData,
    label: "Staff On Duty",
    icon: Users,
    iconStyle: "text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]",
    iconBg: "bg-purple-500/10 border-r border-[#00f2ff]/10",
    format: (v: number) => `${v}`,
  },
]

export function KPICardsContainer() {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/stats")
        const json = await res.json()
        setData({
          occupancyRate: json.occupancyRate ?? 0,
          adr: json.adr ?? 0,
          revenue: json.revenue ?? 0,
          activeAlerts: json.activeAlerts ?? 0,
          staffOnDuty: json.staffOnDuty ?? 0,
        })
      } catch (e) {
        console.error("KPI load error:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 30_000)
    return () => clearInterval(iv)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl bg-[#0a0c10] border border-[#00f2ff]/10 shadow-[0_0_15px_rgba(0,242,255,0.02)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Loader2 className="h-5 w-5 animate-spin text-[#00f2ff]/40 relative z-10" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPI_CONFIG.map((cfg) => {
        const Icon = cfg.icon
        const value = data?.[cfg.key] ?? 0
        const displayValue = cfg.format ? cfg.format(value) : value
        return (
          <div
            key={cfg.key}
            className={cn(
              "relative flex items-center rounded-xl overflow-hidden h-[72px] cursor-pointer bg-[#0a0c10] border border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.02)] transition-all duration-300 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/5 hover:shadow-[0_0_25px_rgba(0,242,255,0.2)] group"
            )}
          >
            {/* Overlay backdrop */}
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Left icon box */}
            <div className={cn("flex items-center justify-center h-full aspect-square flex-shrink-0 transition-colors duration-300 relative z-10", cfg.iconBg)}>
              <Icon className={cn("h-5 w-5 drop-shadow-[0_0_5px_rgba(255,255,255,0.15)]", cfg.iconStyle)} strokeWidth={1.8} />
            </div>

            {/* Center: number + label */}
            <div className="flex-1 px-4 relative z-10">
              <div className="text-2xl font-bold text-[#8E939D] leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">{displayValue}</div>
              <div className="text-[9px] uppercase tracking-[0.1em] text-[#5C6270] group-hover:text-[#00f2ff] mt-1 font-bold transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{cfg.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
