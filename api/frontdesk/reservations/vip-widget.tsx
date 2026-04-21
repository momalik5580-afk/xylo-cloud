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

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PLATINUM: { label: "Platinum", color: "text-[#8E939D]", bg: "bg-slate-400/20", border: "border-slate-400/30" },
  GOLD:     { label: "Gold",     color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  SILVER:   { label: "Silver",   color: "text-blue-300",  bg: "bg-blue-400/20",  border: "border-blue-400/30"  },
  STANDARD: { label: "Member",   color: "text-slate-400", bg: "bg-slate-600/20", border: "border-slate-600/30" },
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
        // Fetch checked-in + today's arrivals in parallel
        const [inHouseRes, arrivalsRes] = await Promise.all([
          fetch("/api/frontdesk/reservations?status=CHECKED_IN&limit=50"),
          fetch("/api/frontdesk/reservations?date=today&limit=50"),
        ])
        const inHouseJson  = await inHouseRes.json()
        const arrivalsJson = await arrivalsRes.json()

        const combined: Reservation[] = [
          ...(inHouseJson.reservations ?? []),
          ...(arrivalsJson.reservations ?? []),
        ]

        // Deduplicate by id, keep only VIPs
        const seen = new Set<string>()
        const vips = combined.filter((r) => {
          if (seen.has(r.id) || !r.guest?.is_vip) return false
          seen.add(r.id)
          return true
        })

        setReservations(vips)
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
    return r.status === "CONFIRMED" && ci.getTime() === today.getTime()
  })
  const departing = reservations.filter((r) => {
    const co = new Date(r.check_out_date); co.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return r.status === "CHECKED_IN" && co.getTime() === today.getTime()
  })

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-[#8E939D]">VIP Guests</h3>
        </div>
        <Link href="/vip" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Full Dashboard <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI mini grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "In House",  value: inHouse.length,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Arriving",  value: arriving.length,  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    pulse: arriving.length > 0 },
          { label: "Departing", value: departing.length, color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
          { label: "Total VIP", value: reservations.length, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-lg border px-2 py-2 text-center", item.bg, item.border)}>
            <div className="flex items-center justify-center gap-1">
              <p className={cn("text-lg font-bold", item.color)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : item.value}
              </p>
              {(item as any).pulse && item.value > 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </div>
            <p className="text-[9px] text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Guest list */}
      <div className="space-y-2">
        {!loading && reservations.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-2">No VIP guests today</p>
        )}
        {reservations.slice(0, 4).map((res) => {
          const tier    = res.guest.loyalty_tier ?? "STANDARD"
          const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.STANDARD
          const label   = getGuestStatus(res)

          return (
            <div key={res.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                tier === "PLATINUM"
                  ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900"
                  : "bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-900"
              )}>
                {getInitials(res.guest.first_name, res.guest.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#8E939D] truncate">
                  {res.guest.first_name} {res.guest.last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-medium text-emerald-400">{label}</span>
                  {res.room && <span className="text-[9px] text-slate-500">· Room {res.room.room_number}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Plane className="h-3 w-3 text-blue-400" />
                <div className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-medium border", tierCfg.bg, tierCfg.border, tierCfg.color)}>
                  {tierCfg.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reservations.length > 4 && (
        <Link href="/vip" className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">
          +{reservations.length - 4} more VIP guests →
        </Link>
      )}
    </div>
  )
}
