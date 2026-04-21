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
  occupied:    "bg-[#0ea5e9] shadow-[0_0_5px_rgba(14,165,233,0.8)]",
  vacant:      "bg-[#00f2ff] shadow-[0_0_5px_rgba(0,242,255,0.8)]",
  dirty:       "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]",
  inspection:  "bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]",
  maintenance: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]",
  reserved:    "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]",
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
      <div className="rounded-2xl border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden p-5 space-y-4">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <Skeleton className="h-4 w-32 relative z-10" />
        <Skeleton className="h-20 w-full relative z-10" />
        <Skeleton className="h-16 w-full relative z-10" />
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
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => b - a).slice(0, 5).reverse()
  const floorData = floors.map((floor) => ({
    floor,
    rooms: rooms.filter((r) => r.floor === floor),
  }))

  return (
    <div className="rounded-2xl border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden p-5 flex flex-col gap-4">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between border-b border-[#00f2ff]/10 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Room Occupancy</h3>
          <span className="px-2 py-0.5 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)] text-[9px] uppercase tracking-wider shadow-[0_0_8px_rgba(0,242,255,0.2)] font-bold">
            {stats.occupancyRate}%
          </span>
        </div>
        <Link href="/dashboard?view=front-desk" className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.3)] transition-all">
          View All {stats.total} Rooms
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 relative z-10">
        {(["occupied","vacant","dirty"] as RoomStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className={cn("rounded-lg border px-3 py-2 text-center border-[#00f2ff]/10 bg-[#0a0c10] shadow-[0_0_10px_rgba(0,242,255,0.02)] transition-colors hover:border-[#00f2ff]/30 hover:bg-[#00f2ff]/5 hover:shadow-[0_0_15px_rgba(0,242,255,0.15)] group")}>
              <p className={cn("text-lg font-bold group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.25)] transition-all duration-300", cfg.color.replace("text-blue-400", "text-[#0ea5e9]").replace("text-emerald-500", "text-[#00f2ff]"))}>
                {stats[status]}
              </p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {floorData.length > 0 && (
        <div className="space-y-2 mt-2 relative z-10">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#00f2ff]/60 border-l border-[#00f2ff]/40 pl-2">
            TOP {floorData.length} FLOORS PREVIEW
          </p>
          {floorData.map(({ floor, rooms: floorRooms }) => (
            <div key={floor} className="flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-widest text-[#8E939D] w-8 text-right flex-shrink-0">F{floor}</span>
              <div className="flex gap-px flex-1 bg-[#0a0c10] border border-[#00f2ff]/15 rounded-[3px] p-[1px]">
                {floorRooms.slice(0, 40).map((room) => {
                  const mapped = STATUS_MAP[room.status] ?? "vacant"
                  const isVIP  = room.reservations?.some((r) => r.guest?.is_vip)
                  return (
                    <div
                      key={room.id}
                      title={`${room.room_number} · ${room.status}`}
                      className={cn("h-3 flex-1 rounded-[1px] relative transition-transform hover:scale-150 hover:z-10 hover:shadow-[0_0_10px_rgba(255,255,255,0.8)] cursor-pointer", cellBg[mapped])}
                    >
                      {isVIP && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-1 w-1 rounded-full bg-yellow-300 shadow-[0_0_4px_rgba(253,224,71,1)]" />
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

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-[#00f2ff]/10 relative z-10">
        {(Object.entries(STATUS_CONFIG) as [RoomStatus, typeof STATUS_CONFIG[RoomStatus]][]).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.3)]", cellBg[status]?.split(' ')[0] || cfg.bg)} />
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{cfg.label} ({stats[status]})</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Star className="h-2 w-2 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">VIP ({stats.vip})</span>
        </div>
      </div>
    </div>
  )
}

export default RoomsWidget
