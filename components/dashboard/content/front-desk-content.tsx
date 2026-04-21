// src/components/dashboard/content/front-desk-content.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { RoomGrid } from "@/components/rooms/room-grid"
import { useHotelConfig } from "@/hooks/use-hotel-config"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuthStore } from "@/store"
import { BedDouble, RefreshCw, Building2, Users } from "lucide-react"
import { Room, RoomStatus, RoomType } from "@/lib/room-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Define the type for the config
interface HotelConfig {
  hotelName: string
  totalRooms: number
  totalFloors: number
  roomNumberFormat: string
  outlets: any[]
  outletKpiSettings: any
}

// Define the return type of useHotelConfig
interface UseHotelConfigReturn {
  config: HotelConfig
  loading: boolean
  error?: Error
}

const mapStatus = (dbStatus: string): RoomStatus => {
  switch (dbStatus) {
    case 'AVAILABLE':    return 'vacant'
    case 'OCCUPIED':     return 'occupied'
    case 'DIRTY':        return 'dirty'
    case 'CLEANING':     return 'inspection'
    case 'MAINTENANCE':  return 'maintenance'
    case 'OUT_OF_ORDER': return 'maintenance'
    default:             return 'vacant'
  }
}

const mapType = (dbType: string): RoomType => {
  switch (dbType) {
    case 'STANDARD':     return 'standard'
    case 'DELUXE':       return 'deluxe'
    case 'JUNIOR_SUITE': return 'junior-suite'
    case 'SUITE':        return 'suite'
    case 'PRESIDENTIAL': return 'presidential'
    default:             return 'standard'
  }
}

export function FrontDeskContent() {
  
  const { config, loading: configLoading } = useHotelConfig() as UseHotelConfigReturn
  const { user } = useAuthStore()

  const [refreshing, setRefreshing]       = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [floorOccupancy, setFloorOccupancy] = useState<Record<number, { occupied: number; total: number }>>({})
  const [rooms, setRooms]                 = useState<Room[]>([])
  const [roomsLoading, setRoomsLoading]   = useState(true)

  const fetchRooms = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/frontdesk/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const data = await res.json()
      
      const mappedRooms: Room[] = data.rooms.map((r: any) => {
        const activeRes = r.reservations?.[0]
        const guest     = activeRes?.guests
        const hkTask    = r.housekeeping_tasks?.[0]

        const checkIn  = activeRes?.check_in_date  ? new Date(activeRes.check_in_date).toISOString().split('T')[0]  : undefined
        const checkOut = activeRes?.check_out_date ? new Date(activeRes.check_out_date).toISOString().split('T')[0] : undefined
        const nights   = activeRes?.nights
          ?? (checkIn && checkOut
            ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
            : undefined)

        return {
          id:                  r.id,
          number:              r.room_number,
          floor:               r.floor || 1,
          position:            parseInt(r.room_number) % 100 || 1,
          type:                mapType(r.type || 'STANDARD'),
          status:              mapStatus(r.status),
          isVIP:               guest?.is_vip || false,
          guestName:           guest ? `${guest.first_name} ${guest.last_name}` : undefined,
          checkIn,
          checkOut,
          nights,
          rate:                activeRes?.room_rate ? Number(activeRes.room_rate) : undefined,
          specialRequests:     activeRes?.special_requests
            ? activeRes.special_requests.split('\n').filter(Boolean)
            : undefined,
          housekeepingAssigned: hkTask?.assigned_to || undefined,
          notes:               r.notes || undefined,
        }
      })
      
      setRooms(mappedRooms)
      
      // Calculate floor occupancy
      const occupancy: Record<number, { occupied: number; total: number }> = {}
      mappedRooms.forEach((r) => {
        if (!occupancy[r.floor]) occupancy[r.floor] = { occupied: 0, total: 0 }
        occupancy[r.floor].total += 1
        if (r.status === 'occupied') occupancy[r.floor].occupied += 1
      })
      setFloorOccupancy(occupancy)
    } catch (error) {
      console.error(error)
    } finally {
      setRoomsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // ── Real-time room status sync ──────────────────────────────────────────────
  // When housekeeping (or any other page) changes a room status, the PATCH to
  // /api/frontdesk/rooms broadcasts a `room_status` SSE event.  We catch it here
  // and immediately update the local rooms state so the grid reflects the change
  // without requiring a manual refresh.
  const handleRoomStatusChange = useCallback((payload: Record<string, unknown>) => {
    const { roomId, newStatus } = payload as { roomId: string; newStatus: string }
    if (!roomId || !newStatus) return

    setRooms(prev => {
      const updated = prev.map(r =>
        r.id === roomId ? { ...r, status: mapStatus(newStatus) } : r
      )

      // Recalculate floor occupancy with the updated list
      const occupancy: Record<number, { occupied: number; total: number }> = {}
      updated.forEach((r) => {
        if (!occupancy[r.floor]) occupancy[r.floor] = { occupied: 0, total: 0 }
        occupancy[r.floor].total += 1
        if (r.status === 'occupied') occupancy[r.floor].occupied += 1
      })
      setFloorOccupancy(occupancy)

      return updated
    })
  }, [])

  useRealtime({
    userId:               user?.id ?? 'frontdesk',
    onRoomStatusChange:   handleRoomStatusChange,
  })
  // ───────────────────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchRooms()
  }

  if (configLoading || !config || roomsLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-5">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="flex-1 w-full" />
      </div>
    )
  }

  const actualTotalRooms  = rooms.length > 0 ? rooms.length : config.totalRooms
  const dbFloors          = rooms.length > 0 
    ? Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b)
    : Array.from({ length: config.totalFloors }, (_, i) => i + 1)
  const actualTotalFloors = dbFloors.length
  const baseRoomsPerFloor = Math.floor(actualTotalRooms / actualTotalFloors)

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5 gap-5 min-h-0">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 drop-shadow-[0_0_4px_rgba(0,242,255,0.075)]">
            <BedDouble className="h-5 w-5 text-[#00f2ff] drop-shadow-[0_0_3px_rgba(0,242,255,0.2)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_4px_rgba(0,242,255,0.15)]">Front Desk</h1>
            <p className="text-sm text-[#5C6270] drop-shadow-[0_0_3px_rgba(0,242,255,0.05)]">
              {`${actualTotalRooms} rooms · ${actualTotalFloors} floors · Live occupancy`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/30 hover:border-[#00f2ff]/50 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)] transition-all">
              <Building2 className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_3px_rgba(0,242,255,0.15)]" />
              <span className="text-sm text-[#8E939D] drop-shadow-[0_0_3px_rgba(0,242,255,0.05)]">{`${actualTotalFloors} Floors`}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-all">
              <Users className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.15)]" />
              <span className="text-sm text-[#8E939D] drop-shadow-[0_0_3px_rgba(16,185,129,0.05)]">{`~${baseRoomsPerFloor} rooms/floor`}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 drop-shadow-[0_0_8px_rgba(16,185,129,0.1)]">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-xs text-emerald-400 font-medium drop-shadow-[0_0_3px_rgba(16,185,129,0.15)]">Live</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-[#00f2ff]/30 bg-[#00f2ff]/5 text-[#8E939D] hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:text-[#00f2ff] hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.2)] transition-all drop-shadow-[0_0_3px_rgba(0,242,255,0.05)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Floor Quick Navigation */}
      <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto pb-1 group relative overflow-hidden rounded-lg bg-[#0a0c10]/40 border-[#00f2ff]/10 border px-3 py-2 hover:border-[#00f2ff]/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />
        {dbFloors.map((floor) => (
          <Button
            key={floor}
            variant={selectedFloor === floor ? "default" : "outline"}
            size="sm"
            className={selectedFloor === floor 
              ? "relative z-10 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-[#0a0c10] font-bold drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" 
              : "relative z-10 border-[#00f2ff]/30 bg-[#00f2ff]/5 text-slate-300 hover:bg-[#00f2ff]/10 hover:text-[#00f2ff] hover:border-[#00f2ff]/40 hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.2)]"
            }
            onClick={() => setSelectedFloor(floor)}
          >
            <span>{`Floor ${floor}`}</span>
          </Button>
        ))}
        <Button
          variant={selectedFloor === null ? "default" : "outline"}
          size="sm"
          className={selectedFloor === null 
            ? "relative z-10 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-[#0a0c10] font-bold drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" 
            : "relative z-10 border-[#00f2ff]/30 bg-[#00f2ff]/5 text-slate-300 hover:bg-[#00f2ff]/10 hover:text-[#00f2ff] hover:border-[#00f2ff]/40 hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.2)]"
          }
          onClick={() => setSelectedFloor(null)}
        >
          <span>All Floors</span>
        </Button>
      </div>

      {/* Room Grid */}
      <div className="flex-1 min-h-0">
        <RoomGrid
          totalRooms={actualTotalRooms}
          totalFloors={actualTotalFloors}
          roomNumberFormat={config.roomNumberFormat}
          selectedFloor={selectedFloor}
          rooms={rooms}
        />
      </div>

      {/* Floor Summary Footer */}
      <div className="grid gap-2 flex-shrink-0" style={{ gridTemplateColumns: `repeat(${actualTotalFloors}, minmax(0, 1fr))` }}>
        {dbFloors.map((floor) => {
          const occ        = floorOccupancy[floor] || { occupied: 0, total: baseRoomsPerFloor }
          const percentage = Math.round((occ.occupied / occ.total) * 100)
          
          return (
            <Card 
              key={floor} 
              className="bg-[#0a0c10]/40 border-[#00f2ff]/20 cursor-pointer hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden" 
              onClick={() => setSelectedFloor(floor)}
            >
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardContent className="p-2 relative z-10">
                <div className="text-xs text-[#5C6270] drop-shadow-[0_0_3px_rgba(0,242,255,0.05)]">{`Floor ${floor}`}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium text-[#8E939D] drop-shadow-[0_0_3px_rgba(0,242,255,0.05)]">{`${occ.occupied}/${occ.total}`}</span>
                  <span className={`text-xs font-bold drop-shadow-[0_0_3px_rgba(0,242,255,0.05)] ${
                    percentage > 85 ? 'text-emerald-400' : 
                    percentage > 60 ? 'text-[#00f2ff]' : 
                    'text-amber-400'
                  }`}>
                    {`${percentage}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
