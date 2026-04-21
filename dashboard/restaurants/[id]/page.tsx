"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, RefreshCw, Users, Utensils, Coffee, Wine, ChefHat, Receipt,
  CheckCircle2, Clock, Crown, Phone, Mail,
  BedDouble, X, Star, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableGuest {
  id: string; name: string; phone: string | null; email: string | null
  is_vip: boolean; loyalty_tier: string | null; nationality: string | null
}

interface TableOrder {
  id: string; order_number: string; status: string; type: string
  total_amount: number; guest_count: number; placed_at: string
  special_requests: string | null
  items: { name: string; price: number; quantity: number }[]
}

interface TableRoom {
  number: string; type: string; floor: number
}

interface RestaurantTable {
  id: string; table_number: string; section: string | null
  capacity: number; status: string; current_guests: number
  current_guest_name: string | null; current_order_id: string | null
  outlet_id: string
  outlets: { id: string; name: string; type: string } | null
  server: { name: string } | null
  order:  TableOrder  | null
  guest:  TableGuest  | null
  room:   TableRoom   | null
}

interface Outlet {
  id: string; name: string; type: string; status: string
  openingTime: string | null; closingTime: string | null
  twoSeatTables: number; fourSeatTables: number; sixSeatTables: number
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  AVAILABLE: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Available" },
  available: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Available" },
  OCCUPIED:  { bg: "bg-red-500/15",     border: "border-red-500/40",     dot: "bg-red-400",     label: "Occupied"  },
  occupied:  { bg: "bg-red-500/15",     border: "border-red-500/40",     dot: "bg-red-400",     label: "Occupied"  },
  RESERVED:  { bg: "bg-purple-500/15",  border: "border-purple-500/40",  dot: "bg-purple-400",  label: "Reserved"  },
  reserved:  { bg: "bg-purple-500/15",  border: "border-purple-500/40",  dot: "bg-purple-400",  label: "Reserved"  },
  CLEANING:  { bg: "bg-amber-500/15",   border: "border-amber-500/40",   dot: "bg-amber-400",   label: "Cleaning"  },
  cleaning:  { bg: "bg-amber-500/15",   border: "border-amber-500/40",   dot: "bg-amber-400",   label: "Cleaning"  },
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-amber-500/10 text-amber-400",
  PREPARING: "bg-blue-500/10 text-blue-400",
  READY:     "bg-purple-500/10 text-purple-400",
  DELIVERED: "bg-emerald-500/10 text-emerald-400",
  CANCELLED: "bg-slate-500/10 text-slate-400",
}

const OUTLET_ICON: Record<string, any> = {
  restaurant: Utensils, bar: Wine, cafe: Coffee,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RestaurantFloorPlanPage() {
  const params   = useParams()
  const router   = useRouter()
  const outletId = params.id as string

  const [outlet,     setOutlet]     = useState<Outlet | null>(null)
  const [tables,     setTables]     = useState<RestaurantTable[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState("all")

  // Table detail modal
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [modalOpen,     setModalOpen]     = useState(false)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [outletsRes, tablesRes] = await Promise.all([
        fetch("/api/outlets"),
        fetch(`/api/restaurants/tables?outletId=${outletId}`),
      ])
      const outletsData = outletsRes.ok ? await outletsRes.json() : { outlets: [] }
      const tablesData  = tablesRes.ok  ? await tablesRes.json()  : { tables: [] }

      const found = (outletsData.outlets ?? []).find((o: Outlet) => o.id === outletId)
      setOutlet(found ?? null)
      setTables(tablesData.tables ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [outletId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table)
    setModalOpen(true)
  }

  // Stats
  const stats = {
    total:     tables.length,
    available: tables.filter(t => ["available","AVAILABLE"].includes(t.status)).length,
    occupied:  tables.filter(t => ["occupied","OCCUPIED"].includes(t.status)).length,
    reserved:  tables.filter(t => ["reserved","RESERVED"].includes(t.status)).length,
    cleaning:  tables.filter(t => ["cleaning","CLEANING"].includes(t.status)).length,
    seats:     tables.reduce((s, t) => s + t.capacity, 0),
    guests:    tables.reduce((s, t) => s + (t.current_guests ?? 0), 0),
  }

  // Group by section
  const sections = tables.reduce<Record<string, RestaurantTable[]>>((acc, t) => {
    const sec = t.section ?? "Main"
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(t)
    return acc
  }, {})

  const OutletIcon = OUTLET_ICON[outlet?.type ?? "restaurant"] ?? Utensils

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6 p-6 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}
              className="text-slate-400 hover:text-[#8E939D]">
              <ArrowLeft className="h-4 w-4 mr-1" />Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <OutletIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#8E939D]">{outlet?.name ?? "Restaurant"}</h1>
                <p className="text-sm text-slate-400">
                  {outlet?.openingTime && outlet?.closingTime
                    ? `${outlet.openingTime} – ${outlet.closingTime} · ` : ""}
                  {stats.total} tables · {stats.seats} seats
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => router.push(`/dashboard/restaurants/${outletId}/reservations`)}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700">
              <Calendar className="h-4 w-4 mr-2" />
              Reservations
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => router.push(`/dashboard/restaurants/${outletId}/kds`)}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700">
              <ChefHat className="h-4 w-4 mr-2" />
              Kitchen
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => router.push(`/dashboard/restaurants/${outletId}/pos`)}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700">
              <Receipt className="h-4 w-4 mr-2" />
              POS
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700">
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total tables",   value: stats.total,     color: "text-[#8E939D]" },
            { label: "Available",      value: stats.available, color: "text-emerald-400" },
            { label: "Occupied",       value: stats.occupied,  color: "text-red-400" },
            { label: "Reserved",       value: stats.reserved,  color: "text-purple-400" },
            { label: "Cleaning",       value: stats.cleaning,  color: "text-amber-400" },
            { label: "Total seats",    value: stats.seats,     color: "text-blue-400" },
            { label: "Current guests", value: stats.guests,    color: "text-orange-400" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-slate-900/80 border-slate-800/60">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "all",       label: `All (${stats.total})` },
            { key: "available", label: `Available (${stats.available})` },
            { key: "occupied",  label: `Occupied (${stats.occupied})` },
            { key: "reserved",  label: `Reserved (${stats.reserved})` },
            { key: "cleaning",  label: `Cleaning (${stats.cleaning})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                filter === f.key
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Floor plan grouped by section */}
        {tables.length === 0 ? (
          <Card className="bg-slate-900/80 border-slate-800/60 p-12 text-center">
            <Utensils className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No tables yet</h3>
            <p className="text-sm text-slate-500 mb-4">
              Go to Settings → Outlets → set table counts → click Sync Tables
            </p>
            <Button variant="outline" className="border-slate-700 text-slate-300"
              onClick={() => router.push("/dashboard?view=settings")}>
              Go to Settings
            </Button>
          </Card>
        ) : (
          Object.entries(sections).map(([section, sectionTables]) => {
            const visible = sectionTables.filter(t =>
              filter === "all" || t.status.toLowerCase() === filter
            )
            if (visible.length === 0) return null

            return (
              <Card key={section} className="bg-slate-900/80 border-slate-800/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#8E939D] text-base capitalize">
                      {section.replace(/-/g, " ")} tables
                    </CardTitle>
                    <Badge className="bg-slate-800 text-slate-400 text-xs">
                      {visible.length} shown · {sectionTables.reduce((s, t) => s + t.capacity, 0)} seats
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {visible.map(table => {
                      const s = STATUS_CONFIG[table.status] ?? STATUS_CONFIG["AVAILABLE"]
                      const isOccupied = ["occupied","OCCUPIED"].includes(table.status)
                      return (
                        <div key={table.id} onClick={() => handleTableClick(table)}
                          className={cn(
                            "relative p-3 rounded-xl border-2 cursor-pointer",
                            "hover:scale-105 hover:shadow-lg transition-all duration-150",
                            s.bg, s.border
                          )}>
                          {/* Status dot */}
                          <div className={cn(
                            "absolute top-2 right-2 w-2 h-2 rounded-full",
                            s.dot, isOccupied && "animate-pulse"
                          )} />

                          {/* VIP crown */}
                          {table.guest?.is_vip && (
                            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="h-2.5 w-2.5 text-black" />
                            </div>
                          )}

                          <p className="font-bold text-[#8E939D] text-sm leading-none mb-2">
                            {table.table_number.split("-").pop()}
                          </p>

                          <div className="flex items-center gap-1 text-slate-300">
                            <Users className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {table.current_guests > 0 ? table.current_guests : "–"}/{table.capacity}
                            </span>
                          </div>

                          {/* Occupancy bar */}
                          <div className="mt-2 h-1 rounded-full bg-slate-700/50">
                            <div className={cn("h-full rounded-full transition-all", s.dot)}
                              style={{ width: table.capacity > 0 ? `${Math.round((table.current_guests / table.capacity) * 100)}%` : "0%" }}
                            />
                          </div>

                          {table.current_guest_name && (
                            <p className="text-[9px] text-slate-400 mt-1 truncate">
                              {table.current_guest_name}
                            </p>
                          )}

                          {table.room && (
                            <p className="text-[9px] text-orange-400 truncate font-medium">
                              Rm {table.room.number}
                            </p>
                          )}

                          {table.server && (
                            <p className="text-[9px] text-slate-500 truncate">
                              {table.server.name.split(" ")[0]}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Legend */}
        {tables.length > 0 && (
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            {[
              { label: "Available", dot: "bg-emerald-400" },
              { label: "Occupied",  dot: "bg-red-400" },
              { label: "Reserved",  dot: "bg-purple-400" },
              { label: "Cleaning",  dot: "bg-amber-400" },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", dot)} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="h-2.5 w-2.5 text-black" />
              </div>
              <span className="text-xs text-slate-400">VIP guest</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Table Detail Modal ─────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-md">
          {selectedTable && (() => {
            const s = STATUS_CONFIG[selectedTable.status] ?? STATUS_CONFIG["AVAILABLE"]
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    Table {selectedTable.table_number.split("-").pop()}
                    {selectedTable.guest?.is_vip && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Crown className="h-3 w-3 mr-1" /> VIP
                      </Badge>
                    )}
                    <Badge className={cn("ml-auto capitalize text-xs", s.bg, s.border)}
                      style={{ color: 'inherit' }}>
                      {s.label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">

                  {/* Table info */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500">Capacity</p>
                      <p className="text-xl font-bold text-[#8E939D] mt-1">{selectedTable.capacity}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500">Guests</p>
                      <p className="text-xl font-bold text-[#8E939D] mt-1">
                        {selectedTable.current_guests > 0 ? selectedTable.current_guests : "–"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500">Section</p>
                      <p className="text-sm font-medium text-[#8E939D] mt-1 capitalize">
                        {selectedTable.section?.replace("-", " ") ?? "Main"}
                      </p>
                    </div>
                  </div>

                  {/* Guest info — shown if occupied */}
                  {selectedTable.guest ? (
                    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Guest</p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-[#8E939D]">
                          {selectedTable.guest.name}
                        </p>
                        {selectedTable.guest.loyalty_tier && (
                          <Badge className="bg-blue-500/10 text-blue-400 text-xs">
                            {selectedTable.guest.loyalty_tier}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm text-slate-400">
                        {selectedTable.guest.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{selectedTable.guest.phone}</span>
                          </div>
                        )}
                        {selectedTable.guest.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{selectedTable.guest.email}</span>
                          </div>
                        )}
                        {selectedTable.guest.nationality && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Nationality:</span>
                            <span>{selectedTable.guest.nationality}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedTable.current_guest_name ? (
                    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Guest</p>
                      <p className="text-base font-semibold text-[#8E939D]">
                        {selectedTable.current_guest_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Walk-in guest</p>
                    </div>
                  ) : null}

                  {/* Room info — only show when occupied/reserved */}
                  {["occupied","OCCUPIED","reserved","RESERVED"].includes(selectedTable.status) && (
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Hotel room</p>
                      {selectedTable.room ? (
                        <div className="flex items-center gap-3">
                          <BedDouble className="h-5 w-5 text-orange-400" />
                          <div>
                            <p className="text-lg font-bold text-orange-400">
                              Room {selectedTable.room.number}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">
                              Floor {selectedTable.room.floor} · {selectedTable.room.type?.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <BedDouble className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-base text-slate-400">Walk-in guest</p>
                            <p className="text-xs text-slate-500">Not linked to a hotel reservation</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active order */}
                  {selectedTable.order && (
                    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Active order</p>
                        <Badge className={cn("text-xs", ORDER_STATUS_COLOR[selectedTable.order.status] ?? "bg-slate-500/10 text-slate-400")}>
                          {selectedTable.order.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-mono text-xs">
                          #{selectedTable.order.order_number.substring(0, 8)}
                        </span>
                        <span className="text-slate-300 font-semibold">
                          ${selectedTable.order.total_amount.toFixed(2)}
                        </span>
                      </div>
                      {/* Order items */}
                      {selectedTable.order.items.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedTable.order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-slate-400">
                              <span className="truncate">{item.quantity}× {item.name}</span>
                              <span className="ml-2 text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedTable.order.special_requests && (
                        <p className="text-xs text-amber-400 border-t border-slate-700 pt-2">
                          ⚠ {selectedTable.order.special_requests}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Placed at {new Date(selectedTable.order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}

                  {/* Server */}
                  {selectedTable.server && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <p className="text-xs text-slate-500">Server</p>
                      <p className="text-sm font-medium text-slate-300">{selectedTable.server.name}</p>
                    </div>
                  )}

                  {/* Empty table message */}
                  {!selectedTable.guest && !selectedTable.current_guest_name && !selectedTable.order && (
                    <div className="text-center py-4 text-slate-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
                      <p className="text-sm">Table is available</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
