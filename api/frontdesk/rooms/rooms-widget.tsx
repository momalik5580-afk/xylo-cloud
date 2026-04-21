"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/lib/room-data"
import type { RoomStatus } from "@/lib/room-data"
import { ArrowRight, BedDouble, Star, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Map DB status (UPPERCASE) → room-data STATUS_CONFIG keys (lowercase)
const STATUS_MAP: Record<string, RoomStatus> = {
  AVAILABLE:    "vacant",
  OCCUPIED:     "occupied",
  DIRTY:        "dirty",
  CLEANING:     "dirty",
  INSPECTION:   "inspection",
  MAINTENANCE:  "maintenance",
  OUT_OF_ORDER: "maintenance",
  RESERVED:     "reserved",
}

const cellBg: Record<RoomStatus, string> = {
  occupied:    "bg-blue-500",
  vacant:      "bg-emerald-500",
  dirty:       "bg-amber-500",
  inspection:  "bg-purple-500",
  maintenance: "bg-red-500",
  reserved:    "bg-orange-500",
}

interface ApiRoom {
  id: string
  room_number: string
  floor: number
  status: string
  reservations?: { guest?: { is_vip?: boolean } }[]
}

interface Stats {
  total: number
  occupied: number
  vacant: number
  dirty: number
  inspection: number
  maintenance: number
  reserved: number
  vip: number
  occupancyRate: number
}

export function RoomsWidget() {
  const [rooms,   setRooms]   = useState<ApiRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/frontdesk/rooms")
        const json = await res.json()
        if (json.rooms) setRooms(json.rooms)
      } catch (e) {
        console.error("RoomsWidget:", e)
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
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  // Build stats
  const stats: Stats = { total: rooms.length, occupied: 0, vacant: 0, dirty: 0, inspection: 0, maintenance: 0, reserved: 0, vip: 0, occupancyRate: 0 }
  rooms.forEach((r) => {
    const mapped = STATUS_MAP[r.status] ?? "vacant"
    stats[mapped] = (stats[mapped] || 0) + 1
    if (r.reservations?.some((res) => res.guest?.is_vip)) stats.vip++
  })
  stats.occupancyRate = stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0

  // Floor preview: top 5 floors
  const floors = rooms.map((r) => r.floor).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b - a).slice(0, 5).reverse()
  const floorData = floors.map((floor) => ({
    floor,
    rooms: rooms.filter((r) => r.floor === floor),
  }))

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-[#8E939D]">Room Occupancy</h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            {stats.occupancyRate}%
          </span>
        </div>
        <Link href="/dashboard?view=front-desk" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          View all {stats.total} rooms
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["occupied","vacant","dirty"] as RoomStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className={cn("rounded-lg border px-3 py-2 text-center", `${cfg.bg}/10`, cfg.border)}>
              <p className={cn("text-lg font-bold", cfg.color)}>{stats[status]}</p>
              <p className="text-[10px] text-slate-400">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {floorData.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Top {floorData.length} floors preview
          </p>
          {floorData.map(({ floor, rooms: floorRooms }) => (
            <div key={floor} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8 text-right flex-shrink-0">F{floor}</span>
              <div className="flex gap-px flex-1">
                {floorRooms.slice(0, 40).map((room) => {
                  const mapped = STATUS_MAP[room.status] ?? "vacant"
                  const isVIP  = room.reservations?.some((r) => r.guest?.is_vip)
                  return (
                    <div
                      key={room.id}
                      title={`${room.room_number} · ${room.status}`}
                      className={cn("h-3 flex-1 rounded-[2px] relative", cellBg[mapped])}
                    >
                      {isVIP && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-1 w-1 rounded-full bg-yellow-300" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1 border-t border-slate-800/60">
        {(Object.entries(STATUS_CONFIG) as [RoomStatus, typeof STATUS_CONFIG[RoomStatus]][]).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={cn("h-2 w-2 rounded-sm", cfg.bg)} />
            <span className="text-[10px] text-slate-500">{cfg.label} ({stats[status]})</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] text-slate-500">VIP ({stats.vip})</span>
        </div>
      </div>
    </div>
  )
}

export default RoomsWidget
