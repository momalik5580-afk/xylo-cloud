// src/components/dashboard/content/restaurants-content.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSmartInterval } from "@/hooks/use-smart-interval"
import {
  Utensils, TrendingUp, Users, Clock, DollarSign,
  ChefHat, Wine, Coffee, Calendar, Search,
  Plus, ArrowUpRight, ArrowDownRight, AlertCircle,
  CheckCircle2, Timer, Receipt, Star, RefreshCw, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Outlet {
  id: string
  name: string
  code: string
  type: string
  status: string
  openingTime: string | null
  closingTime:  string | null
  twoSeatTables:  number
  fourSeatTables: number
  sixSeatTables:  number
  tableCount: number
  orderCount: number
}

interface RestaurantTable {
  id: string
  table_number: string
  section:      string | null
  capacity:     number
  min_capacity: number
  status:       string
  current_guests:     number
  current_guest_name: string | null
  outlet_id:    string
  outlets:      { id: string; name: string; type: string } | null
  users:        { first_name: string; last_name: string } | null
}

interface FnbOrder {
  id:           string
  order_number: string
  type:         string
  status:       string
  total_amount: number | string
  guest_count:  number
  placed_at:    string
  notes:        string | null
  special_requests: string | null
  outlet_id:    string
  outlets:      { id: string; name: string; type: string } | null
  users:        { first_name: string; last_name: string } | null
  restaurant_tables_fnb_orders_table_idTorestaurant_tables: {
    table_number: string; section: string | null
  } | null
  fnb_order_items: {
    id: string; quantity: number; unit_price: number
    menu_items: { name: string; price: number } | null
  }[]
}

interface MenuItem {
  id:           string
  name:         string
  description:  string | null
  category_id:  string
  outlet_id:    string
  price:        number | string
  is_available: boolean
  popular:      boolean
  is_vegetarian: boolean
  is_vegan:     boolean
  is_halal:     boolean
  vip_only:     boolean
  menu_categories: { name: string } | null
}

interface OrderSummary {
  pending:       number
  preparing:     number
  ready:         number
  delivered:     number
  todayRevenue:  number
  todayOrders:   number
  todayAvgCheck: number
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PREPARING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  READY:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-slate-500/10 text-[#8E939D] border-slate-500/20",
}

const TABLE_STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/20 border-emerald-500/30",
  available: "bg-emerald-500/20 border-emerald-500/30",
  occupied:  "bg-red-500/20 border-red-500/30",
  OCCUPIED:  "bg-red-500/20 border-red-500/30",
  reserved:  "bg-purple-500/20 border-purple-500/30",
  RESERVED:  "bg-purple-500/20 border-purple-500/30",
  cleaning:  "bg-amber-500/20 border-amber-500/30",
  CLEANING:  "bg-amber-500/20 border-amber-500/30",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RestaurantsContent() {
  const router = useRouter()

  const [activeTab,           setActiveTab]           = useState("overview")
  const [selectedOutlet,      setSelectedOutlet]      = useState("all")
  const [searchQuery,         setSearchQuery]         = useState("")
  const [isLoading,           setIsLoading]           = useState(true)
  const [refreshing,          setRefreshing]          = useState(false)

  // DB data
  const [outlets,    setOutlets]    = useState<Outlet[]>([])
  const [tables,     setTables]     = useState<RestaurantTable[]>([])
  const [orders,     setOrders]     = useState<FnbOrder[]>([])
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([])
  const [summary,    setSummary]    = useState<OrderSummary | null>(null)

  // New Order modal
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [newOrder, setNewOrder] = useState({
    outletId:   "",
    tableId:    "",
    guestName:  "",
    type:       "DINE_IN" as string,
    notes:      "",
    guestCount: 1,
  })
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState<FnbOrder | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)

  // ── Fetch all data ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [outletsRes, tablesRes, ordersRes, menuRes] = await Promise.all([
        fetch("/api/outlets"),
        fetch("/api/restaurants/tables"),
        fetch("/api/fnb/orders?active=true&limit=50"),
        fetch("/api/fnb/menu?available=true"),
      ])

      const [outletsData, tablesData, ordersData, menuData] = await Promise.all([
        outletsRes.ok  ? outletsRes.json()  : { outlets: [] },
        tablesRes.ok   ? tablesRes.json()   : { tables: [] },
        ordersRes.ok   ? ordersRes.json()   : { orders: [], summary: null },
        menuRes.ok     ? menuRes.json()     : { items: [] },
      ])

      setOutlets(outletsData.outlets  ?? [])
      setTables(tablesData.tables     ?? [])
      setOrders(ordersData.orders     ?? [])
      setMenuItems(menuData.items     ?? [])
      setSummary(ordersData.summary   ?? null)
    } catch (e) {
      console.error("RestaurantsContent fetchAll error:", e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Auto-refresh every 60 seconds (like VIP dashboard)
 // Initial load
useEffect(() => {
  fetchAll()
}, [fetchAll])

// Auto-refresh every 60 seconds (called at TOP LEVEL, not inside useEffect)
useSmartInterval(() => fetchAll(), 60000)

  // ── Navigate to full floor plan page ────────────────────────────────────────
  const openDetails = (outlet: Outlet) => {
    router.push(`/dashboard/restaurants/${outlet.id}`)
  }

  // ── Submit new order ─────────────────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!newOrder.outletId) return
    setSubmittingOrder(true)
    try {
      const res = await fetch("/api/fnb/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          outletId:   newOrder.outletId,
          tableId:    newOrder.tableId   || null,
          type:       newOrder.type,
          notes:      newOrder.notes     || null,
          guestCount: newOrder.guestCount,
          items:      [], // items would be added via a menu selector in a full implementation
        }),
      })
      if (!res.ok) throw new Error("Failed to create order")
      setNewOrderOpen(false)
      fetchAll()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmittingOrder(false)
    }
  }

  // ── Optimistic order status update (like VIP task status) ────────────────────
  const handleOrderStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    // Update UI immediately (optimistic)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    )
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
    )
    
    // Send to API
    try {
      await fetch(`/api/fnb/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // Optimistic update already applied — error is handled silently
    }
  }, [])

  // ── Derived values ────────────────────────────────────────────────────────────
  const filteredOutlets = useMemo(() =>
    selectedOutlet === "all" ? outlets : outlets.filter(o => o.id === selectedOutlet),
    [outlets, selectedOutlet]
  )

  const filteredOrders = useMemo(() =>
    orders.filter(o => {
      if (selectedOutlet !== "all" && o.outlet_id !== selectedOutlet) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const table = o.restaurant_tables_fnb_orders_table_idTorestaurant_tables
        return (
          o.order_number.toLowerCase().includes(q) ||
          table?.table_number.toLowerCase().includes(q) ||
          o.outlets?.name.toLowerCase().includes(q)
        )
      }
      return true
    }),
    [orders, selectedOutlet, searchQuery]
  )

  const activeOrderCount = orders.filter(o =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
  ).length

  const topOutlet = useMemo(() =>
    outlets.length
      ? [...outlets].sort((a, b) => b.orderCount - a.orderCount)[0]
      : null,
    [outlets]
  )

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    )
  }

  // ── No outlets configured ────────────────────────────────────────────────────
  if (outlets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
          <Utensils className="h-12 w-12 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-[#8E939D] mb-2">No Outlets Configured</h2>
        <p className="text-sm text-[#8E939D] text-center max-w-md mb-6">
          No active restaurants or bars found. Go to Hotel Settings to add outlets.
        </p>
        <Button onClick={() => router.push("/dashboard/hotel-settings")} className="bg-orange-600 hover:bg-orange-700">
          Go to Hotel Settings
        </Button>
      </div>
    )
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.125)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.2)] transition-all">
              <Utensils className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.15)]" />
            </div>
            Restaurants & Bars
          </h1>
          <p className="text-xs text-[#5C6270] mt-1 uppercase tracking-widest font-semibold">
            {outlets.length} active outlets · live data
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAll}
            disabled={refreshing}
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
          >
            <RefreshCw className={cn("h-3 w-3 mr-2 text-[#00f2ff]", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Calendar className="h-3 w-3 mr-2 text-[#00f2ff]" />
            Reservations
          </Button>
          <Button className="bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 hover:bg-[#00f2ff]/30 text-[10px] font-bold uppercase tracking-widest h-8" onClick={() => setNewOrderOpen(true)}>
            <Plus className="h-3 w-3 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Today Revenue</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  ${((summary?.todayRevenue ?? 0) / 1000).toFixed(1)}k
                </p>
                <DollarSign className="h-5 w-5 text-emerald-400 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Today Orders</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.2)]">{summary?.todayOrders ?? 0}</p>
                <Receipt className="h-5 w-5 text-[#00f2ff] opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Active Orders</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">{activeOrderCount}</p>
                <ChefHat className="h-5 w-5 text-amber-400 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Avg Check</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.2)]">
                  ${Math.round(summary?.todayAvgCheck ?? 0)}
                </p>
                <TrendingUp className="h-5 w-5 text-purple-400 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Tables</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.2)]">{tables.length}</p>
                  <p className="text-[8px] text-[#5C6270] mt-1 group-hover:text-[#00f2ff]/70 transition-colors">
                    {tables.filter(t => ['occupied','OCCUPIED'].includes(t.status)).length} occupied
                  </p>
                </div>
                <Users className="h-5 w-5 text-teal-400 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        {topOutlet && (
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Top Outlet</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)] truncate max-w-[100px]">
                    {topOutlet.name}
                  </p>
                  <TrendingUp className="h-5 w-5 text-emerald-400 opacity-80 flex-shrink-0" />
                </div>
                <p className="text-[8px] uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors mt-1">{topOutlet.orderCount} orders today</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Outlet selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedOutlet("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
            selectedOutlet === "all"
              ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40"
              : "bg-[#0a0c10] text-[#8E939D] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/5"
          )}
        >
          All Venues
        </button>
        {outlets.map(outlet => (
          <button
            key={outlet.id}
            onClick={() => setSelectedOutlet(outlet.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border",
              selectedOutlet === outlet.id
                ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40"
                : "bg-[#0a0c10] text-[#8E939D] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/5"
            )}
          >
            {outlet.name}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              outlet.status === "active"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-slate-500/20 text-[#8E939D]"
            )}>
              {outlet.status}
            </span>
          </button>
        ))}
      </div>

      {/* Outlet cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map(outlet => {
          const outletTables = tables.filter(t => t.outlet_id === outlet.id)
          const occupied = outletTables.filter(t => ['occupied','OCCUPIED'].includes(t.status)).length
          const totalSeats = outlet.twoSeatTables * 2 + outlet.fourSeatTables * 4 + outlet.sixSeatTables * 6

          return (
            <Card
              key={outlet.id}
              className={cn(
                "bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 cursor-pointer transition-all duration-300 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 group relative overflow-hidden",
                selectedOutlet === outlet.id && "border-[#00f2ff]/40 ring-1 ring-[#00f2ff]/30"
              )}
              onClick={() => setSelectedOutlet(selectedOutlet === outlet.id ? "all" : outlet.id)}
            >
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardContent className="p-5 space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]">{outlet.name}</p>
                    <p className="text-sm text-[#5C6270] capitalize">{outlet.type.replace("-", " ")}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    outlet.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-[#8E939D] border-[#00f2ff]/20"
                  )}>
                    {outlet.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Hours</p>
                    <p className="text-[#0ea5e9] text-xs mt-1 drop-shadow-[0_0_5px_rgba(14,165,233,0.075)]">
                      {outlet.openingTime && outlet.closingTime
                        ? `${outlet.openingTime} – ${outlet.closingTime}`
                        : "Not set"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Tables / Seats</p>
                    <p className="text-[#00f2ff] text-xs mt-1 drop-shadow-[0_0_5px_rgba(0,242,255,0.15)]">
                      {outlet.twoSeatTables + outlet.fourSeatTables + outlet.sixSeatTables} / {totalSeats}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Occupied</p>
                    <p className="text-amber-400 text-xs mt-1 drop-shadow-[0_0_5px_rgba(251,191,36,0.075)]">{occupied} / {outletTables.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">Orders Today</p>
                    <p className="text-[#00f2ff] text-xs mt-1 drop-shadow-[0_0_5px_rgba(0,242,255,0.075)]">{outlet.orderCount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#00f2ff]/20">
                  <div className="flex gap-2">
                    {outlet.twoSeatTables > 0  && <span className="text-[10px] text-[#5C6270]">{outlet.twoSeatTables}×2</span>}
                    {outlet.fourSeatTables > 0 && <span className="text-[10px] text-[#5C6270]">{outlet.fourSeatTables}×4</span>}
                    {outlet.sixSeatTables > 0  && <span className="text-[10px] text-[#5C6270]">{outlet.sixSeatTables}×6</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => { e.stopPropagation(); openDetails(outlet) }}
                    className="text-[#00f2ff] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 text-sm"
                  >
                    Details
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15">
          <TabsTrigger value="overview"  className="data-[state=active]:bg-[#00f2ff]/20 data-[state=active]:text-[#00f2ff] data-[state=active]:drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] data-[state=inactive]:text-[#5C6270] text-xs font-bold uppercase tracking-widest">Live Orders</TabsTrigger>
          <TabsTrigger value="floor"     className="data-[state=active]:bg-[#00f2ff]/20 data-[state=active]:text-[#00f2ff] data-[state=active]:drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] data-[state=inactive]:text-[#5C6270] text-xs font-bold uppercase tracking-widest">Floor Plan</TabsTrigger>
          <TabsTrigger value="menu"      className="data-[state=active]:bg-[#00f2ff]/20 data-[state=active]:text-[#00f2ff] data-[state=active]:drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] data-[state=inactive]:text-[#5C6270] text-xs font-bold uppercase tracking-widest">Menu</TabsTrigger>
        </TabsList>

        {/* ── Live Orders ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 flex flex-row items-center justify-between">
              <CardTitle className="text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.05)] text-[10px] uppercase font-bold tracking-widest">
                Active Orders
                <span className="ml-2 text-sm font-normal text-[#8E939D]">({filteredOrders.length})</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270]" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-slate-400 focus:border-[#00f2ff]/50"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredOrders.length === 0 ? (
                <p className="text-center text-[#5C6270] py-8">No active orders</p>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => {
                    const table = order.restaurant_tables_fnb_orders_table_idTorestaurant_tables
                    const server = order.users
                    const statusColor = ORDER_STATUS_COLOR[order.status] ?? "bg-slate-500/10 text-[#8E939D]"
                    return (
                    <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 cursor-pointer hover:bg-[#00f2ff]/10 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)] group" onClick={() => { setSelectedOrder(order); setOrderDetailsOpen(true) }}>
                        <div className={cn("p-2 rounded-lg border", statusColor)}>
                          {order.status === "PENDING"   && <Clock      className="h-4 w-4" />}
                          {order.status === "PREPARING" && <ChefHat    className="h-4 w-4" />}
                          {order.status === "READY"     && <CheckCircle2 className="h-4 w-4" />}
                          {order.status === "DELIVERED" && <Utensils   className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px] tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{order.outlets?.name ?? "Unknown outlet"}</span>
                            {table && (
                              <Badge variant="secondary" className="text-xs bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20">
                                {table.table_number}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs bg-[#00f2ff]/5 text-[#5C6270] border border-[#00f2ff]/15">
                              {order.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#8E939D]">
                            <span className="font-bold tracking-widest">{order.fnb_order_items.length} items</span>
                            <span>•</span>
                            <span className="text-[#00f2ff]">${Number(order.total_amount).toFixed(2)}</span>
                            <span>•</span>
                            <span>{new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {order.guest_count > 0 && <><span>•</span><span className="text-amber-400">{order.guest_count} guests</span></>}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={cn("capitalize text-xs", statusColor)}>
                            {order.status.toLowerCase()}
                          </Badge>
                          {server && (
                            <p className="text-xs text-[#5C6270] mt-1 font-bold uppercase tracking-widest">
                              {server.first_name} {server.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Floor Plan ──────────────────────────────────────────────────────── */}
        <TabsContent value="floor" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#8E939D]">Table Layout</h3>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-56 bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400 hover:border-[#00f2ff]/40 focus:border-[#00f2ff]/40">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/40 border shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                <SelectItem value="all" className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">All Outlets</SelectItem>
                {outlets.map(o => (
                  <SelectItem key={o.id} value={o.id} className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredOutlets.map(outlet => {
            const outletTables = tables.filter(t => t.outlet_id === outlet.id)
            if (outletTables.length === 0) return null
            return (
              <Card key={outlet.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.05)] text-lg">{outlet.name}</CardTitle>
                    <Badge className="bg-blue-500/10 text-blue-400">
                      {outletTables.length} tables · {outletTables.reduce((s, t) => s + t.capacity, 0)} seats
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {outletTables.map(table => (
                      <div
                        key={table.id}
                        className={cn(
                          "p-3 rounded-lg border-2 cursor-pointer hover:scale-105 transition-all",
                          TABLE_STATUS_COLOR[table.status] ?? "bg-[#00f2ff]/5 border-[#00f2ff]/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-400 text-sm">{table.table_number}</span>
                          <Users className="h-3 w-3 text-[#8E939D]" />
                        </div>
                        <div className="text-xl font-bold text-slate-400 text-center">
                          {table.current_guests || "–"}/{table.capacity}
                        </div>
                        <div className="text-[10px] text-center text-[#8E939D] mt-1 capitalize">
                          {table.status.toLowerCase()}
                        </div>
                        {table.users && (
                          <div className="text-[9px] text-center text-[#5C6270] mt-1 truncate">
                            {table.users.first_name} {table.users.last_name[0]}.
                          </div>
                        )}
                        {table.current_guest_name && (
                          <div className="text-[9px] text-center text-[#5C6270] truncate">
                            {table.current_guest_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#00f2ff]/20 text-xs">
                    {[
                      { label: "Available", color: "bg-emerald-500/30 border-emerald-500" },
                      { label: "Occupied",  color: "bg-red-500/30 border-red-500" },
                      { label: "Reserved",  color: "bg-purple-500/30 border-purple-500" },
                      { label: "Cleaning",  color: "bg-amber-500/30 border-amber-500" },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className={cn("w-3 h-3 rounded-full border", color)} />
                        <span className="text-[#8E939D]">{label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {tables.filter(t => selectedOutlet === "all" || t.outlet_id === selectedOutlet).length === 0 && (
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 p-8 text-center">
              <p className="text-[#5C6270]">No tables found. Add table counts in Hotel Settings.</p>
            </Card>
          )}
        </TabsContent>

        {/* ── Menu ────────────────────────────────────────────────────────────── */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#8E939D]">Menu Items by Outlet</h3>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-56 bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/40 border shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                <SelectItem value="all" className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">All Outlets</SelectItem>
                {outlets.map(o => (
                  <SelectItem key={o.id} value={o.id} className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredOutlets.map(outlet => {
            const items = menuItems.filter(m => m.outlet_id === outlet.id)
            if (items.length === 0) return (
              <Card key={outlet.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
                <CardHeader>
                  <CardTitle className="text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]">{outlet.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#5C6270] text-sm text-center py-4">No menu items configured yet</p>
                </CardContent>
              </Card>
            )

            // Group by category
            const byCategory: Record<string, MenuItem[]> = {}
            items.forEach(item => {
              const cat = item.menu_categories?.name ?? "Uncategorised"
              if (!byCategory[cat]) byCategory[cat] = []
              byCategory[cat].push(item)
            })

            return (
              <Card key={outlet.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
                <CardHeader>
                  <CardTitle className="text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]">{outlet.name} Menu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(byCategory).map(([category, catItems]) => (
                    <div key={category}>
                      <h4 className="text-xs uppercase tracking-wider text-[#5C6270] mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {catItems.map(item => (
                          <div key={item.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-400 text-sm">{item.name}</span>
                              <span className="text-slate-300 font-medium text-sm">${Number(item.price).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.popular       && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Popular</span>}
                              {item.is_halal      && <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Halal</span>}
                              {item.is_vegetarian && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Veg</span>}
                              {item.is_vegan      && <span className="text-[10px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded">Vegan</span>}
                              {item.vip_only      && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">VIP</span>}
                              {!item.is_available && <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Unavailable</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      {orderDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setOrderDetailsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,242,255,0.2)] border border-[#00f2ff]/30 bg-[#0a0c10]">
            <button
              onClick={() => setOrderDetailsOpen(false)}
              className="absolute top-3 right-3 z-20 flex items-center justify-center h-8 w-8 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] hover:text-[#00f2ff] hover:bg-[#00f2ff]/20 transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.15)]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#8E939D]">Order {selectedOrder.order_number}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedOrder.outlets?.name ?? "Unknown outlet"}</p>
                  </div>
                  <Badge className={cn("capitalize text-sm py-1 px-3", ORDER_STATUS_COLOR[selectedOrder.status] ?? "bg-slate-500/10 text-[#8E939D]")}>
                    {selectedOrder.status.toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">
                  <p className="text-[10px] text-[#5C6270] uppercase tracking-widest font-bold">Table</p>
                  <p className="text-sm font-semibold text-[#0ea5e9] mt-1">
                    {selectedOrder.restaurant_tables_fnb_orders_table_idTorestaurant_tables?.table_number ?? "–"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">
                  <p className="text-[10px] text-[#5C6270] uppercase tracking-widest font-bold">Type</p>
                  <p className="text-sm font-semibold text-[#00f2ff] mt-1">{selectedOrder.type.replace("_", " ")}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">
                  <p className="text-[10px] text-[#5C6270] uppercase tracking-widest font-bold">Guests</p>
                  <p className="text-sm font-semibold text-amber-400 mt-1">{selectedOrder.guest_count}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">
                  <p className="text-[10px] text-[#5C6270] uppercase tracking-widest font-bold">Total</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-1">${Number(selectedOrder.total_amount).toFixed(2)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-[#00f2ff] mb-2">Order Items ({selectedOrder.fnb_order_items.length})</h3>
                <div className="space-y-2">
                  {selectedOrder.fnb_order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">
                      <div>
                        <p className="text-sm font-medium text-slate-400">{item.menu_items?.name ?? "Unknown item"}</p>
                        <p className="text-xs text-[#5C6270]">Qty: <span className="text-amber-400">{item.quantity}</span></p>
                      </div>
                      <p className="text-sm font-semibold text-[#00f2ff]">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-[#00f2ff] mb-2">Notes</h3>
                  <p className="text-sm text-slate-400 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Update Buttons */}
              {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                <div>
                  <h3 className="text-sm font-semibold text-[#00f2ff] mb-2">Update Status</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["PENDING", "PREPARING", "READY", "DELIVERED"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleOrderStatusChange(selectedOrder.id, status)}
                        disabled={selectedOrder.status === status}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                          selectedOrder.status === status
                            ? "bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#5C6270] cursor-not-allowed"
                            : "bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]/50"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-slate-400">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-400">New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Outlet</Label>
              <Select value={newOrder.outletId} onValueChange={v => setNewOrder({ ...newOrder, outletId: v, tableId: "" })}>
                <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400 hover:border-[#00f2ff]/40 focus:border-[#00f2ff]/40">
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/40 border shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                  {outlets.map(o => (
                    <SelectItem key={o.id} value={o.id} className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Table</Label>
              <Select
                value={newOrder.tableId}
                onValueChange={v => setNewOrder({ ...newOrder, tableId: v })}
                disabled={!newOrder.outletId}
              >
                <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400 hover:border-[#00f2ff]/40 focus:border-[#00f2ff]/40 disabled:opacity-50">
                  <SelectValue placeholder="Select table (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/40 border shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                  {tables.filter(t => t.outlet_id === newOrder.outletId).map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">
                      {t.table_number} — {t.capacity} seats ({t.status.toLowerCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Order Type</Label>
              <Select value={newOrder.type} onValueChange={v => setNewOrder({ ...newOrder, type: v })}>
                <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400 hover:border-[#00f2ff]/40 focus:border-[#00f2ff]/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/40 border shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                  {["DINE_IN", "ROOM_SERVICE", "TAKEAWAY"].map(t => (
                    <SelectItem key={t} value={t} className="text-slate-400 focus:bg-[#00f2ff]/20 focus:text-[#00f2ff] cursor-pointer">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Guests</Label>
              <Input
                type="number"
                min={1}
                value={newOrder.guestCount}
                onChange={e => setNewOrder({ ...newOrder, guestCount: parseInt(e.target.value) || 1 })}
                className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                placeholder="Special requests..."
                value={newOrder.notes}
                onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-400 min-h-[60px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                onClick={() => setNewOrderOpen(false)}
              >Cancel</Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
                disabled={!newOrder.outletId || submittingOrder}
                onClick={handleSubmitOrder}
              >
                {submittingOrder ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
