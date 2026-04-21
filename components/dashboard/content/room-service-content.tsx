"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSmartInterval } from "@/hooks/use-smart-interval"
import {
  Bell, Clock, ChefHat, CheckCircle2, AlertCircle, Truck,
  Plus, Search, Crown, X, RefreshCw, Loader2, BedDouble,
  Shirt, Wrench, Package, Star, AlertTriangle, Timer,
  Banknote, CreditCard, Users, Filter, Bike, Utensils,
  Coffee, Soup, Pizza, Sandwich
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface RSOrder {
  id: string; order_number: string; room_number: string
  status: string; subtotal: number; delivery_fee: number
  tax_amount: number; total_amount: number
  payment_method: string | null; special_requests: string | null
  placed_at: string; confirmed_at: string | null
  prepared_at: string | null; delivered_at: string | null
  is_vip: boolean; vip_level: string | null; guest_id: string | null
  room_service_order_items: {
    id: string; quantity: number; unit_price: number; total_price: number
    notes: string | null
    menu_items: { name: string; price: number } | null
  }[]
}

interface LaundryOrder {
  id: string; room_id: string | null; guest_id: string | null
  type: string; items: any; status: string; express: boolean
  total_amount: number | null; notes: string | null
  pickup_time: string | null; delivery_time: string | null
  created_at: string
}

interface MenuItem {
  id: string; name: string; price: number | string
  category_id: string; menu_categories: { name: string } | null
  is_halal: boolean; is_vegetarian: boolean; popular: boolean
}

interface HotelGuest {
  id: string; name: string; is_vip: boolean; loyalty_tier: string | null
  reservation_id: string; room_number: string
}

// ─── Status configs ──────────────────────────────────────────────────────────

const RS_STATUS: Record<string, { label: string; color: string; dot: string; glow: string }> = {
  PENDING:   { label: 'PENDING',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]' },
  CONFIRMED: { label: 'READY TO PICK',color: 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20', dot: 'bg-[#00f2ff]', glow: 'shadow-[0_0_8px_rgba(0,242,255,0.4)]' },
  PREPARING: { label: 'PREPARING',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.4)]' },
  READY:     { label: 'OUT FOR DELIVERY', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400', glow: 'shadow-[0_0_8px_rgba(251,146,60,0.4)]' },
  DELIVERED: { label: 'DELIVERED',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
  CANCELLED: { label: 'CANCELLED',    color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
}

const NEXT_STATUS: Record<string, string> = { CONFIRMED: 'READY', READY: 'DELIVERED' }
const NEXT_LABEL:  Record<string, string> = { CONFIRMED: 'PICK UP & DELIVER', READY: 'MARK DELIVERED' }

const LAUNDRY_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'PENDING',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  PICKED_UP:  { label: 'PICKED UP',  color: 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20' },
  PROCESSING: { label: 'PROCESSING', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  READY:      { label: 'READY',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DELIVERED:  { label: 'DELIVERED',  color: 'bg-slate-500/10 text-[#8E939D] border-slate-500/20' },
}

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RoomServiceContent() {
  const [activeTab,    setActiveTab]    = useState('food')
  const [orders,       setOrders]       = useState<RSOrder[]>([])
  const [laundry,      setLaundry]      = useState<LaundryOrder[]>([])
  const [summary,      setSummary]      = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // New food order modal
  const [newOpen,      setNewOpen]      = useState(false)
  const [menuItems,    setMenuItems]    = useState<MenuItem[]>([])
  const [categories,   setCategories]   = useState<{ id: string; name: string }[]>([])
  const [menuCat,      setMenuCat]      = useState('all')
  const [menuSearch,   setMenuSearch]   = useState('')
  const [cart,         setCart]         = useState<{ item: MenuItem; qty: number }[]>([])
  const [guestSearch,  setGuestSearch]  = useState('')
  const [guestResults, setGuestResults] = useState<HotelGuest[]>([])
  const [selGuest,     setSelGuest]     = useState<HotelGuest | null>(null)
  const [roomNumber,   setRoomNumber]   = useState('')
  const [specialReqs,  setSpecialReqs]  = useState('')
  const [payMethod,    setPayMethod]    = useState('ROOM_CHARGE')
  const [outlets,      setOutlets]      = useState<{ id: string; name: string; type: string }[]>([])
  const [selOutlet,    setSelOutlet]    = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // Detail modal
  const [detailOrder,  setDetailOrder]  = useState<RSOrder | null>(null)
  const [detailOpen,   setDetailOpen]   = useState(false)
  const [advancing,    setAdvancing]    = useState(false)

  // ── Fetch food orders ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/roomservice/orders?limit=100')
      if (res.ok) {
        const d = await res.json()
        setOrders(d.orders ?? [])
        setSummary(d.summary ?? null)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  // ── Fetch laundry orders ──────────────────────────────────────────────────
  const fetchLaundry = useCallback(async () => {
    try {
      const res = await fetch('/api/roomservice/laundry?limit=50')
      if (res.ok) { const d = await res.json(); setLaundry(d.orders ?? []) }
    } catch (e) { console.error(e) }
  }, [])

  // Initial load
useEffect(() => { 
  fetchOrders(); 
  fetchLaundry() 
}, [fetchOrders, fetchLaundry])

// Auto-refresh every 30 seconds (called at TOP LEVEL, not inside useEffect)
useSmartInterval(() => { 
  fetchOrders(); 
  fetchLaundry() 
}, 30000)

  // ── Load outlets list ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/outlets')
      .then(r => r.ok ? r.json() : { outlets: [] })
      .then(d => {
        const food = (d.outlets ?? []).filter((o: any) =>
          ['restaurant','bar','cafe','room-service','RESTAURANT','BAR','CAFE'].includes(o.type)
        )
        setOutlets(food)
        if (food.length > 0 && !selOutlet) setSelOutlet(food[0].id)
      })
  }, [])

  // ── Load menu per outlet ──────────────────────────────────────────────────
  const [outletMenus, setOutletMenus] = useState<Record<string, { categories: { id: string; name: string }[]; items: MenuItem[] }>>({})
  const [menuLoading, setMenuLoading] = useState(false)

  useEffect(() => {
    if (!selOutlet) return
    if (outletMenus[selOutlet]) {
      setCategories(outletMenus[selOutlet].categories)
      setMenuItems(outletMenus[selOutlet].items)
      setMenuCat('all')
      return
    }
    setMenuLoading(true)
    fetch(`/api/restaurants/pos?outletId=${selOutlet}`)
      .then(r => r.ok ? r.json() : { categories: [], items: [] })
      .then(d => {
        const cats  = d.categories ?? []
        const items = d.items      ?? []
        setOutletMenus(prev => ({ ...prev, [selOutlet]: { categories: cats, items } }))
        setCategories(cats)
        setMenuItems(items)
        setMenuCat('all')
        setMenuLoading(false)
      })
      .catch(() => setMenuLoading(false))
  }, [selOutlet])

  // ── Guest search ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (guestSearch.length < 2) { setGuestResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/restaurants/pos?guestSearch=${guestSearch}`)
      if (res.ok) { const d = await res.json(); setGuestResults(d.guests ?? []) }
    }, 300)
    return () => clearTimeout(t)
  }, [guestSearch])

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) =>
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id)
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { item, qty: 1 }]
    })
  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(c => c.item.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0))

  const cartSubtotal = cart.reduce((s, c) => s + Number(c.item.price) * c.qty, 0)
  const cartTotal    = cartSubtotal + 15 + cartSubtotal * 0.05

  // ── Submit order ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const rn = selGuest?.room_number || roomNumber
    if (!rn || cart.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/roomservice/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number:     rn,
          outletId:        selOutlet || null,
          guestId:         selGuest?.id             || null,
          reservationId:   selGuest?.reservation_id || null,
          paymentMethod:   payMethod,
          specialRequests: specialReqs || null,
          items: cart.map(c => ({ menuItemId: c.item.id, quantity: c.qty })),
        }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      setNewOpen(false)
      setCart([]); setSelGuest(null); setGuestSearch(''); setRoomNumber(''); setSpecialReqs('')
      fetchOrders()
    } catch (e: any) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  // ── Advance status ────────────────────────────────────────────────────────
  const advanceStatus = async (order: RSOrder) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setAdvancing(true)
    try {
      const res = await fetch(`/api/roomservice/orders/${order.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        const d = await res.json()
        const updated = { ...order, ...d.order }
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
        setDetailOrder(updated)
      }
    } finally { setAdvancing(false) }
  }

  const cancelOrder = async (order: RSOrder) => {
    await fetch(`/api/roomservice/orders/${order.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CANCELLED' } : o))
    setDetailOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : prev)
  }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return o.room_number.includes(q) || o.order_number.toLowerCase().includes(q)
      }
      return true
    })
  }, [orders, statusFilter, search])

  const activeOrders = orders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status))
  const filteredMenu = menuItems.filter(i => {
    const mc = menuCat === 'all' || i.category_id === menuCat
    const ms = !menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase())
    return mc && ms
  })

  if (loading) return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64 bg-[#00f2ff]/5" />
      <div className="grid grid-cols-5 gap-4">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-20 bg-[#00f2ff]/5"/>)}</div>
      {Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 bg-[#00f2ff]/5"/>)}
    </div>
  )

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <Bell className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            ROOM SERVICE <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> IN-ROOM DINING
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">In-room dining, laundry & guest requests</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button variant="ghost" size="sm"
            onClick={() => { fetchOrders(); fetchLaundry() }}
            disabled={refreshing}
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <RefreshCw className={cn("h-3 w-3 mr-2 text-[#00f2ff]", refreshing && "animate-spin")} />
            SYNC
          </Button>
          <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]"
            onClick={() => setNewOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            NEW ORDER
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'PENDING',    value: summary?.pending    ?? 0, color: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' },
          { label: 'CONFIRMED',  value: summary?.confirmed  ?? 0, color: 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]' },
          { label: 'PREPARING',  value: summary?.preparing  ?? 0, color: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' },
          { label: 'OUT FOR DELIVERY', value: summary?.ready ?? 0, color: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]' },
          { label: 'DELIVERED',  value: summary?.delivered  ?? 0, color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{label}</p>
              <p className={cn("text-2xl font-bold tracking-tight mt-1", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1">
          <TabsTrigger 
            value="food" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)] gap-2"
          >
            <ChefHat className="h-3 w-3" />
            FOOD & BEVERAGE
            {activeOrders.length > 0 && (
              <Badge className="bg-[#00f2ff]/20 text-[#00f2ff] text-[8px] tracking-widest border-0 shadow-[0_0_8px_rgba(0,242,255,0.2)] ml-1">{activeOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="laundry" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)] gap-2"
          >
            <Shirt className="h-3 w-3" />
            LAUNDRY
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)] gap-2"
          >
            <Package className="h-3 w-3" />
            GUEST REQUESTS
          </TabsTrigger>
        </TabsList>

        {/* ── FOOD TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="food" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
              <Input placeholder="ROOM OR ORDER NUMBER..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 w-48 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px] placeholder:tracking-widest" />
            </div>
            {['all','PENDING','PREPARING','CONFIRMED','READY','DELIVERED','CANCELLED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border",
                    statusFilter === s
                      ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                      : "bg-[#0a0c10] text-[#5C6270] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:text-[#00f2ff] hover:bg-[#00f2ff]/5"
                  )}>
                {s === 'all' ? `ALL (${orders.length})` : s.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Kanban columns — active orders */}
          {statusFilter === 'all' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['PENDING','PREPARING','CONFIRMED','READY'] as const).map(col => {
                const colOrders = orders.filter(o => o.status === col)
                const s = RS_STATUS[col]
                return (
                  <div key={col} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", s.dot, s.glow)} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00f2ff]">{s.label}</span>
                      </div>
                      <Badge className={cn("text-[8px] tracking-widest border", s.color)}>{colOrders.length}</Badge>
                    </div>
                    {colOrders.map(order => (
                      <div key={order.id}
                        onClick={() => { setDetailOrder(order); setDetailOpen(true) }}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden",
                          order.is_vip ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50" : "bg-[#00f2ff]/5 border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10"
                        )}>
                        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-center justify-between mb-1 relative z-10">
                          <div className="flex items-center gap-1.5">
                            {order.is_vip && <Crown className="h-3 w-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />}
                            <span className="text-sm font-bold text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.3)]">ROOM {order.room_number}</span>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{elapsed(order.placed_at)}</span>
                        </div>
                        <p className="text-[9px] text-[#8E939D] truncate relative z-10">
                          {order.room_service_order_items.slice(0,2).map(i => `${i.quantity}× ${i.menu_items?.name}`).join(', ')}
                          {order.room_service_order_items.length > 2 && ` +${order.room_service_order_items.length - 2}`}
                        </p>
                        <div className="flex items-center justify-between mt-2 relative z-10">
                          <span className="text-[9px] font-bold text-[#8E939D]">${Number(order.total_amount).toFixed(2)}</span>
                          {NEXT_STATUS[order.status] && (
                            <button
                              onClick={e => { e.stopPropagation(); advanceStatus(order) }}
                              className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 hover:bg-[#00f2ff]/30 transition-all shadow-[0_0_5px_rgba(0,242,255,0.2)]">
                              {NEXT_LABEL[order.status]}
                            </button>
                          )}
                        </div>
                        {order.special_requests && (
                          <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400 mt-1 truncate drop-shadow-[0_0_5px_rgba(251,191,36,0.25)] relative z-10">
                            ⚠ {order.special_requests}
                          </p>
                        )}
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-[#00f2ff]/15 text-center">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">NO ORDERS</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Full list */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">
                {statusFilter === 'all' ? 'ALL ORDERS' : `${statusFilter.toLowerCase()} ORDERS`} — {filteredOrders.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="h-10 w-10 text-[#5C6270] mx-auto mb-3" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">NO ORDERS</p>
                  <Button className="mt-4 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] text-[9px] font-bold uppercase tracking-widest border border-[#00f2ff]/30" onClick={() => setNewOpen(true)}>
                    <Plus className="h-3 w-3 mr-2" />PLACE ORDER
                  </Button>
                </div>
              ) : filteredOrders.map(order => {
                const s = RS_STATUS[order.status] ?? RS_STATUS.PENDING
                return (
                  <div key={order.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group cursor-pointer relative overflow-hidden"
                    onClick={() => { setDetailOrder(order); setDetailOpen(true) }}>
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex-shrink-0 w-14 text-center relative z-10">
                      <div className={cn("w-2 h-2 rounded-full mx-auto mb-1 animate-pulse", s.dot, s.glow)} />
                      <p className="text-sm font-bold text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.3)]">{order.room_number}</p>
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2">
                        {order.is_vip && <Crown className="h-3.5 w-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)] flex-shrink-0" />}
                        <p className="text-[11px] text-[#8E939D] truncate font-bold">
                          {order.room_service_order_items.map(i => `${i.quantity}× ${i.menu_items?.name ?? '?'}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                        <span className="font-mono">#{order.order_number.substring(0,8)}</span>
                        <span className="text-orange-400">${Number(order.total_amount).toFixed(2)}</span>
                        <span>{elapsed(order.placed_at)}</span>
                        {order.special_requests && <span className="text-amber-400 truncate">⚠ {order.special_requests}</span>}
                      </div>
                    </div>
                    <Badge className={cn("text-[8px] tracking-widest border flex-shrink-0 relative z-10", s.color)}>{s.label}</Badge>
                    {NEXT_STATUS[order.status] && (
                      <Button size="sm"
                        onClick={e => { e.stopPropagation(); advanceStatus(order) }}
                        className="flex-shrink-0 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[8px] font-bold uppercase tracking-widest h-7 border border-[#00f2ff]/30 shadow-[0_0_5px_rgba(0,242,255,0.2)]">
                        {NEXT_LABEL[order.status]}
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LAUNDRY TAB ───────────────────────────────────────────────── */}
        <TabsContent value="laundry" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
                <Shirt className="h-4 w-4" />LAUNDRY ORDERS — {laundry.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {laundry.length === 0 ? (
                <div className="text-center py-10">
                  <Shirt className="h-10 w-10 text-[#5C6270] mx-auto mb-3" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">NO LAUNDRY ORDERS</p>
                </div>
              ) : laundry.map(order => {
                const s = LAUNDRY_STATUS[order.status] ?? LAUNDRY_STATUS.PENDING
                return (
                  <div key={order.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                    <div className="flex-shrink-0">
                      <Shirt className="h-5 w-5 text-[#00f2ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {order.express && <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] tracking-widest">EXPRESS</Badge>}
                        <p className="text-sm font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">
                          {order.type} · {order.items ? (Array.isArray(order.items) ? `${order.items.length} items` : 'Items attached') : 'No items listed'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                        {order.pickup_time && <span>PICKUP: {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        {order.delivery_time && <span>DELIVERY: {new Date(order.delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        {order.total_amount && <span className="text-orange-400">${Number(order.total_amount).toFixed(2)}</span>}
                        <span>{elapsed(order.created_at)}</span>
                      </div>
                      {order.notes && <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400 mt-0.5 truncate">⚠ {order.notes}</p>}
                    </div>
                    <Badge className={cn("text-[8px] tracking-widest border flex-shrink-0", s.color)}>{s.label}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GUEST REQUESTS TAB ────────────────────────────────────────── */}
        <TabsContent value="requests" className="space-y-4">
          <GuestRequestsPanel />
        </TabsContent>
      </Tabs>

      {/* ── New Food Order Modal ─────────────────────────────────────────── */}
      <Dialog open={newOpen} onOpenChange={v => { setNewOpen(v); if (!v) { setCart([]); setSelGuest(null); setGuestSearch(''); setRoomNumber('') } }}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b border-[#00f2ff]/20 pb-3">
            <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f2ff]">
              <Bell className="h-5 w-5 text-[#00f2ff]" /> NEW ROOM SERVICE ORDER
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 flex-1 overflow-hidden min-h-0 pt-4">
            {/* Menu */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="space-y-2 flex-shrink-0 mb-2">
                {outlets.length > 0 && (
                  <Select value={selOutlet} onValueChange={v => { setSelOutlet(v); setCart([]) }}>
                    <SelectTrigger className="h-8 bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest">
                      <SelectValue placeholder="SELECT RESTAURANT..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                      {outlets.map(o => (
                        <SelectItem key={o.id} value={o.id} className="text-[#8E939D] text-[10px] font-bold uppercase tracking-widest">{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
                  <Input placeholder="SEARCH MENU..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                    className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setMenuCat('all')}
                    className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border", menuCat === 'all' ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_5px_rgba(0,242,255,0.2)]" : "bg-[#00f2ff]/5 text-[#5C6270] border-[#00f2ff]/20 hover:text-[#00f2ff]")}>
                    ALL
                  </button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setMenuCat(c.id)}
                      className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border", menuCat === c.id ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_5px_rgba(0,242,255,0.2)]" : "bg-[#00f2ff]/5 text-[#5C6270] border-[#00f2ff]/20 hover:text-[#00f2ff]")}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                {menuLoading && (
                  <p className="col-span-2 text-center text-[#5C6270] py-6 text-[10px] font-bold uppercase tracking-widest">LOADING MENU...</p>
                )}
                {!menuLoading && filteredMenu.length === 0 && (
                  <p className="col-span-2 text-center text-[#5C6270] py-6 text-[10px] font-bold uppercase tracking-widest">NO MENU ITEMS</p>
                )}
                {filteredMenu.map(item => {
                  const inCart = cart.find(c => c.item.id === item.id)
                  return (
                    <div key={item.id} onClick={() => addToCart(item)}
                      className={cn("relative p-2.5 rounded-lg border cursor-pointer transition-all hover:border-[#00f2ff]/50 group",
                        inCart ? "bg-[#00f2ff]/10 border-[#00f2ff]/30" : "bg-[#00f2ff]/5 border-[#00f2ff]/15")}>
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#00f2ff] rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,242,255,0.6)]">
                          <span className="text-[8px] font-bold text-black">{inCart.qty}</span>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors leading-tight uppercase">{item.name}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{item.menu_categories?.name}</p>
                      <p className="text-[10px] font-bold text-[#00f2ff] mt-1">${Number(item.price).toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order panel */}
            <div className="w-64 flex flex-col gap-3 flex-shrink-0 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">GUEST / ROOM</Label>
                <div className="relative">
                  <BedDouble className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
                  <Input placeholder="SEARCH GUEST..." value={guestSearch}
                    onChange={e => { setGuestSearch(e.target.value); if (!e.target.value) { setSelGuest(null); setGuestResults([]) } }}
                    className="pl-7 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" />
                </div>
                {guestResults.length > 0 && (
                  <div className="rounded-lg border border-[#00f2ff]/20 bg-[#00f2ff]/5 overflow-hidden">
                    {guestResults.map(g => (
                      <button key={g.id}
                        onClick={() => { setSelGuest(g); setGuestSearch(g.name); setRoomNumber(g.room_number); setGuestResults([]) }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#00f2ff]/10 text-left border-b border-[#00f2ff]/10 last:border-0">
                        {g.is_vip && <Crown className="h-3 w-3 text-amber-400 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-[#8E939D] truncate uppercase">{g.name}</p>
                          <p className="text-[8px] text-orange-400">ROOM {g.room_number}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!selGuest && (
                  <Input placeholder="OR TYPE ROOM NUMBER..." value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
                    className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" />
                )}
                {selGuest && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30">
                    <div>
                      <p className="text-[9px] font-bold text-[#00f2ff] uppercase">{selGuest.name}</p>
                      <p className="text-[8px] text-orange-400">ROOM {selGuest.room_number}</p>
                    </div>
                    <button onClick={() => { setSelGuest(null); setGuestSearch(''); setRoomNumber('') }}>
                      <X className="h-3 w-3 text-[#5C6270] hover:text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">CART</Label>
                {cart.length === 0 ? (
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 py-2 text-center">TAP ITEMS TO ADD</p>
                ) : cart.map(c => (
                  <div key={c.item.id} className="p-2 rounded bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[9px] font-bold text-[#8E939D] truncate flex-1 uppercase">{c.item.name}</p>
                      <p className="text-[9px] text-[#8E939D]">${Number(c.item.price).toFixed(2)}</p>
                      <button
                        onClick={() => setCart(prev => prev.filter(x => x.item.id !== c.item.id))}
                        className="w-4 h-4 rounded hover:bg-red-500/20 text-[#5C6270] hover:text-red-400 flex items-center justify-center">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(c.item.id, -1)} className="w-5 h-5 rounded bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] text-[10px] flex items-center justify-center">−</button>
                        <span className="text-[10px] font-bold text-[#8E939D] w-6 text-center">{c.qty}</span>
                        <button onClick={() => updateQty(c.item.id, 1)}  className="w-5 h-5 rounded bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] text-[10px] flex items-center justify-center">+</button>
                      </div>
                      <p className="text-[9px] font-bold text-[#00f2ff]">${(Number(c.item.price)*c.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="space-y-1 text-[9px] border-t border-[#00f2ff]/20 pt-2">
                  <div className="flex justify-between text-[#5C6270]"><span>SUBTOTAL</span><span>${cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[#5C6270]"><span>DELIVERY + TAX</span><span>${(cartTotal - cartSubtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-[#8E939D] pt-1 border-t border-[#00f2ff]/20">
                    <span>TOTAL</span><span className="text-[#00f2ff]">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">PAYMENT</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="h-7 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                    <SelectItem value="ROOM_CHARGE" className="text-[#8E939D] text-[9px] font-bold uppercase tracking-widest">CHARGE TO ROOM</SelectItem>
                    <SelectItem value="CASH"        className="text-[#8E939D] text-[9px] font-bold uppercase tracking-widest">CASH ON DELIVERY</SelectItem>
                    <SelectItem value="CREDIT_CARD" className="text-[#8E939D] text-[9px] font-bold uppercase tracking-widest">CARD ON DELIVERY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">SPECIAL REQUESTS</Label>
                <Textarea value={specialReqs} onChange={e => setSpecialReqs(e.target.value)}
                  placeholder="ALLERGIES, PREFERENCES..."
                  className="bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[8px] font-bold uppercase tracking-widest placeholder:text-[7px] min-h-[55px]" />
              </div>

              <Button
                className="w-full bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                disabled={cart.length === 0 || (!selGuest && !roomNumber) || submitting}
                onClick={handleSubmit}>
                {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Bike className="h-3 w-3 mr-2" />}
                PLACE ORDER
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Order Detail Modal ───────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-md">
          {detailOrder && (() => {
            const s    = RS_STATUS[detailOrder.status] ?? RS_STATUS.PENDING
            const next = NEXT_STATUS[detailOrder.status]
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f2ff]">
                    {detailOrder.is_vip && <Crown className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />}
                    ROOM {detailOrder.room_number}
                    <Badge className={cn("ml-auto text-[8px] tracking-widest border", s.color)}>{s.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PLACED</p>
                      <p className="text-sm font-bold text-[#8E939D]">{new Date(detailOrder.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[8px] text-[#5C6270]">{elapsed(detailOrder.placed_at)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PAYMENT</p>
                      <p className="text-sm text-[#8E939D] uppercase">{(detailOrder.payment_method ?? 'room charge').replace(/_/g,' ')}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 space-y-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">ITEMS</p>
                    {detailOrder.room_service_order_items.map(i => (
                      <div key={i.id} className="flex justify-between text-sm">
                        <span className="text-slate-300 font-bold">{i.quantity}× {i.menu_items?.name ?? 'Item'}</span>
                        <span className="text-[#8E939D]">${Number(i.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#00f2ff]/20 pt-2 space-y-1">
                      <div className="flex justify-between text-[9px] text-[#5C6270]"><span>SUBTOTAL</span><span>${Number(detailOrder.subtotal).toFixed(2)}</span></div>
                      <div className="flex justify-between text-[9px] text-[#5C6270]"><span>DELIVERY + TAX</span><span>${(Number(detailOrder.delivery_fee) + Number(detailOrder.tax_amount)).toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-[#8E939D]">
                        <span>TOTAL</span><span className="text-[#00f2ff]">${Number(detailOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {detailOrder.special_requests && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">SPECIAL REQUESTS</p>
                      <p className="text-sm text-amber-300">{detailOrder.special_requests}</p>
                    </div>
                  )}

                  {next && (
                    <Button className="w-full bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40"
                      disabled={advancing} onClick={() => advanceStatus(detailOrder)}>
                      {advancing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Bike className="h-3 w-3 mr-2" />}
                      {NEXT_LABEL[detailOrder.status]}
                    </Button>
                  )}
                  {detailOrder.status === 'DELIVERED' && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                      <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest">DELIVERED SUCCESSFULLY</p>
                    </div>
                  )}
                  {!['DELIVERED','CANCELLED'].includes(detailOrder.status) && (
                    <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => cancelOrder(detailOrder)}>
                      <X className="h-3 w-3 mr-2" />CANCEL ORDER
                    </Button>
                  )}
                  <Button variant="outline" className="w-full border-[#00f2ff]/20 text-slate-300 text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => setDetailOpen(false)}>CLOSE</Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Guest Requests Panel ────────────────────────────────────────────────────

function GuestRequestsPanel() {
  const [tasks,     setTasks]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/housekeeping/tasks?limit=50')
      .then(r => r.ok ? r.json() : { tasks: [] })
      .then(d => { setTasks(d.tasks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const TASK_STATUS: Record<string, { label: string; color: string }> = {
    PENDING:     { label: 'PENDING',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20' },
    COMPLETED:   { label: 'COMPLETED',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  }

  if (loading) return <Skeleton className="h-40 w-full bg-[#00f2ff]/5" />

  if (tasks.length === 0) return (
    <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
      <CardContent className="py-12 text-center">
        <Package className="h-10 w-10 text-[#5C6270] mx-auto mb-3" />
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">NO GUEST REQUESTS</p>
        <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-1">REQUESTS FROM HOUSEKEEPING AND MAINTENANCE WILL APPEAR HERE</p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
      <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
          <Package className="h-4 w-4" />GUEST REQUESTS — {tasks.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {tasks.map(task => {
          const s = TASK_STATUS[task.status] ?? TASK_STATUS.PENDING
          return (
            <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
              <Wrench className="h-4 w-4 text-[#5C6270] flex-shrink-0 group-hover:text-[#00f2ff] transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {task.is_vip && <Crown className="h-3.5 w-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)] flex-shrink-0" />}
                  <p className="text-sm font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors truncate">{task.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                  {task.room_number && <span className="text-orange-400">ROOM {task.room_number}</span>}
                  {task.guest_name  && <span>{task.guest_name}</span>}
                  <span>{elapsed(task.created_at)}</span>
                </div>
              </div>
              <Badge className={cn("text-[8px] tracking-widest border flex-shrink-0", s.color)}>{s.label}</Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}