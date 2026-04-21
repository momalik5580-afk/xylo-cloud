"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Star, Crown, ArrowRight, Plane, Car, AlertTriangle, Loader2 } from "lucide-react"

interface Reservation {
  id: string
  status: string
  check_in_date: string
  check_out_date: string
  guest: {
    id: string
    first_name: string
    last_name: string
    is_vip: boolean
    loyalty_tier: string | null
    nationality: string | null
  }
  room: {
    room_number: string
    floor: number
    type: string
  } | null
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; shadow?: string }> = {
  PLATINUM: { label: "PLATINUM", color: "text-[#00f2ff]", bg: "bg-[#00f2ff]/10", border: "border-[#00f2ff]/30", shadow: "shadow-[0_0_8px_rgba(0,242,255,0.4)]" },
  GOLD:     { label: "GOLD",     color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", shadow: "shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
  SILVER:   { label: "SILVER",   color: "text-slate-300",  bg: "bg-slate-400/10",  border: "border-slate-400/30", shadow: "shadow-[0_0_8px_rgba(203,213,225,0.4)]"  },
  STANDARD: { label: "MEMBER",   color: "text-[#8E939D]", bg: "bg-[#0a0c10]", border: "border-[#00f2ff]/15", shadow: "" },
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function getGuestStatus(res: Reservation): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ci = new Date(res.check_in_date); ci.setHours(0, 0, 0, 0)
  const co = new Date(res.check_out_date); co.setHours(0, 0, 0, 0)

  if (res.status === "CHECKED_IN") {
    if (co.getTime() === today.getTime()) return "Departing Today"
    return "In House"
  }
  if (res.status === "CONFIRMED" && ci.getTime() === today.getTime()) return "Arriving Today"
  return res.status
}

export function VIPWidget() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard/vip")
        const json = await res.json()
        // API returns { reservations: [...] } with guest + room nested
        setReservations(json.reservations ?? json.vips ?? [])
      } catch (e) {
        console.error("VIPWidget:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  const inHouse   = reservations.filter((r) => r.status === "CHECKED_IN")
  const arriving  = reservations.filter((r) => {
    const ci = new Date(r.check_in_date); ci.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return r.status === "CONFIRMED" && ci.getTime() <= today.getTime() + 86_400_000
  })
  const departing = reservations.filter((r) => {
    const co = new Date(r.check_out_date); co.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return r.status === "CHECKED_IN" && co.getTime() === today.getTime()
  })

  return (
    <div className="rounded-2xl border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden p-5 flex flex-col gap-4">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between border-b border-[#00f2ff]/10 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">VIP Arrivals</h3>
        </div>
        <Link href="/vip" className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.3)] transition-all">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI mini grid */}
      <div className="grid grid-cols-4 gap-2 relative z-10">
        {[
          { label: "IN HOUSE",  value: inHouse.length,   color: "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]", bg: "bg-[#0a0c10]", border: "border-[#00f2ff]/10" },
          { label: "ARRIVING",  value: arriving.length,  color: "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]",    bg: "bg-[#00f2ff]/5",    border: "border-[#00f2ff]/30 shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]",    pulse: arriving.length > 0 },
          { label: "DEPARTING", value: departing.length, color: "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]",   bg: "bg-[#0a0c10]",   border: "border-[#00f2ff]/10"   },
          { label: "TOTAL VIP", value: reservations.length, color: "text-[#8E939D]", bg: "bg-[#0a0c10]", border: "border-[#00f2ff]/10" },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-lg border px-2 py-2 text-center transition-colors", item.bg, item.border)}>
            <div className="flex items-center justify-center gap-1.5">
              <p className={cn("text-lg font-bold", item.color)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#00f2ff]/40" /> : item.value}
              </p>
              {(item as any).pulse && item.value > 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-ping shadow-[0_0_8px_rgba(0,242,255,1)]" />
              )}
            </div>
            <p className="text-[8px] font-bold tracking-widest text-[#5C6270] mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Guest list */}
      <div className="space-y-2 relative z-10">
        {!loading && reservations.length === 0 && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C6270] text-center py-4">NO VIP ARRIVALS TODAY</p>
        )}
        {reservations.slice(0, 4).map((res) => {
          const tier    = res.guest.loyalty_tier ?? "STANDARD"
          const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.STANDARD
          const label   = getGuestStatus(res)

          return (
            <div key={res.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-transparent border border-[#00f2ff]/5 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/5 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all duration-300 group cursor-pointer">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]",
                tier === "PLATINUM"
                  ? "bg-[#0a0c10] border-[#00f2ff]/40 text-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                  : "bg-[#0a0c10] border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
              )}>
                {getInitials(res.guest.first_name, res.guest.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-[#8E939D] truncate group-hover:text-[#00f2ff] transition-colors">
                  {res.guest.first_name} {res.guest.last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{label}</span>
                  {res.room && <span className="text-[9px] font-bold text-[#00f2ff]/60">· RM {res.room.room_number}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Plane className="h-3 w-3 text-[#5C6270] group-hover:text-[#00f2ff] transition-colors" />
                <div className={cn("px-1.5 py-0.5 rounded-full text-[8px] tracking-widest font-bold border", tierCfg.bg, tierCfg.border, tierCfg.color, tierCfg.shadow)}>
                  {tierCfg.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reservations.length > 4 && (
        <Link href="/vip" className="text-center py-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.25)] transition-all relative z-10 block">
          +{reservations.length - 4} MORE VIP ARRIVALS →
        </Link>
      )}
    </div>
  )
}
