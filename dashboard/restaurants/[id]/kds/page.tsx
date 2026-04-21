"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, RefreshCw, ChefHat, Clock, AlertTriangle,
  CheckCircle2, Flame, Users, Crown, Filter, Bell, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface KitchenOrderItem {
  id: string
  name: string
  quantity: number
  station_type: string | null
  prep_time: number | null
  special_instructions: string | null
  status: string
}

interface KitchenOrder {
  id: string
  ticket_number: string
  source: string
  source_type: string
  guest_name: string
  room_number: string | null
  is_vip: boolean
  priority: string
  status: string
  order_time: string
  started_at: string | null
  completed_at: string | null
  estimated_time: number | null
  elapsed_minutes: number
  is_urgent: boolean
  is_late: boolean
  allergy: string[]
  notes: string | null
  chef_assigned_name: string | null
  kitchen_stations: { id: string; name: string; station_type: string } | null
  kitchen_order_items: KitchenOrderItem[]
}

interface KitchenStation {
  id: string
  name: string
  station_type: string
  capacity: number
  current_load: number
  staff_required: number | null
  staff_assigned: number | null
  status: string | null
}

interface Summary {
  pending: number
  in_progress: number
  urgent: number
  avgWait: number
}

// ─── Priority config ───────────────────────────────────────────────────────────

const PRIORITY = {
  high:   { label: 'High',   color: 'bg-red-500/20 border-red-500/40 text-red-400',    dot: 'bg-red-400' },
  normal: { label: 'Normal', color: 'bg-slate-500/20 border-slate-500/40 text-slate-400', dot: 'bg-slate-400' },
  low:    { label: 'Low',    color: 'bg-blue-500/20 border-blue-500/40 text-blue-400', dot: 'bg-blue-400' },
}

const STATUS_COLOR = {
  pending:     'border-l-amber-400',
  in_progress: 'border-l-blue-400',
  completed:   'border-l-emerald-400',
}

// ─── Timer component ───────────────────────────────────────────────────────────

function ElapsedTimer({ orderTime, status }: { orderTime: string; status: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(orderTime).getTime()) / 1000)
      setElapsed(diff)
    }
    calc()
    if (status === 'completed') return
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [orderTime, status])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const isUrgent = mins >= 20
  const isLate   = mins >= 30

  return (
    <span className={cn(
      "font-mono text-sm font-bold",
      isLate   ? "text-red-400" :
      isUrgent ? "text-amber-400" :
                 "text-slate-300"
    )}>
      {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
    </span>
  )
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onStatusChange, stations }: {
  order: KitchenOrder
  onStatusChange: (id: string, status: string) => void
  stations: KitchenStation[]
}) {
  const p = PRIORITY[order.priority as keyof typeof PRIORITY] ?? PRIORITY.normal

  return (
    <div className={cn(
      "rounded-xl border border-slate-700/50 border-l-4 bg-slate-900/90 overflow-hidden transition-all",
      STATUS_COLOR[order.status as keyof typeof STATUS_COLOR] ?? 'border-l-slate-600',
      order.is_late   && "ring-1 ring-red-500/50",
      order.is_urgent && !order.is_late && "ring-1 ring-amber-500/30",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">{order.ticket_number}</span>
          {order.is_vip && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
          {order.is_room_service && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 font-medium">
              🛎 DELIVERY
            </span>
          )}
          {order.is_late   && <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
          {order.is_urgent && !order.is_late && <Flame className="h-3.5 w-3.5 text-amber-400" />}
        </div>
        <ElapsedTimer orderTime={order.order_time} status={order.status} />
      </div>

      {/* Guest info */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#8E939D] text-sm">{order.guest_name}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="capitalize">{order.source_type.replace('_',' ')}</span>
              {order.room_number && (
                <><span>·</span><span className="text-orange-400">Rm {order.room_number}</span></>
              )}
              {order.kitchen_stations && (
                <><span>·</span><span className="text-blue-400">{order.kitchen_stations.station_type}</span></>
              )}
            </div>
          </div>
          <Badge className={cn("text-xs", p.color)}>{p.label}</Badge>
        </div>
        {order.allergy.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            {order.allergy.map(a => (
              <span key={a} className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.kitchen_order_items.length > 0 ? (
          order.kitchen_order_items.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="text-slate-400 text-sm font-bold w-5 flex-shrink-0">{item.quantity}×</span>
              <div className="flex-1">
                <p className="text-sm text-[#8E939D]">{item.name}</p>
                {item.special_instructions && (
                  <p className="text-xs text-amber-400 mt-0.5">↳ {item.special_instructions}</p>
                )}
              </div>
              {item.station_type && (
                <span className="text-[10px] text-slate-500 flex-shrink-0">{item.station_type}</span>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic">No items detail</p>
        )}
        {order.notes && (
          <p className="text-xs text-orange-300 mt-2 pt-2 border-t border-slate-800">
            📝 {order.notes}
          </p>
        )}
      </div>

      {/* Chef + actions */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          {order.chef_assigned_name
            ? <span className="text-slate-300">👨‍🍳 {order.chef_assigned_name}</span>
            : <span>Unassigned</span>}
        </div>
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <Button size="sm"
              className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-[#8E939D] text-xs"
              onClick={() => onStatusChange(order.id, 'in_progress')}>
              Start
            </Button>
          )}
          {order.status === 'in_progress' && (
            <Button size="sm"
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-[#8E939D] text-xs"
              onClick={() => onStatusChange(order.id, 'completed')}>
              Done
            </Button>
          )}
          {order.status === 'completed' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KDSPage() {
  const params   = useParams()
  const router   = useRouter()
  const outletId = params.id as string

  const [orders,     setOrders]     = useState<KitchenOrder[]>([])
  const [stations,   setStations]   = useState<KitchenStation[]>([])
  const [summary,    setSummary]    = useState<Summary | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stationFilter, setStationFilter] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [outletName, setOutletName] = useState('')
  const prevOrderCount = useRef(0)
  const [newOrderAlert, setNewOrderAlert] = useState(false)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const statuses = showCompleted ? 'pending,in_progress,completed' : 'pending,in_progress'
      const [kdsRes, outletsRes] = await Promise.all([
        fetch(`/api/restaurants/kds?status=${statuses}&outletId=${outletId}`),
        fetch('/api/outlets'),
      ])
      const kdsData     = kdsRes.ok     ? await kdsRes.json()     : { orders: [], stations: [], summary: null }
      const outletsData = outletsRes.ok ? await outletsRes.json() : { outlets: [] }

      const outlet = (outletsData.outlets ?? []).find((o: any) => o.id === outletId)
      if (outlet) setOutletName(outlet.name)

      setOrders(kdsData.orders     ?? [])
      setStations(kdsData.stations ?? [])
      setSummary(kdsData.summary   ?? null)

      // New order alert
      const newCount = (kdsData.orders ?? []).filter((o: KitchenOrder) => o.status === 'pending').length
      if (newCount > prevOrderCount.current) {
        setNewOrderAlert(true)
        setTimeout(() => setNewOrderAlert(false), 3000)
      }
      prevOrderCount.current = newCount
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [outletId, showCompleted])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 15s — KDS needs to be fast
  useEffect(() => {
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/restaurants/kds/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    fetchData()
  }

  // Filter by station
  const filteredOrders = orders.filter(o => {
    if (stationFilter === 'all') return true
    return o.kitchen_stations?.id === stationFilter || o.station_id === stationFilter
  })

  // Group by status for column layout
  const pending     = filteredOrders.filter(o => o.status === 'pending')
  const inProgress  = filteredOrders.filter(o => o.status === 'in_progress')
  const completed   = filteredOrders.filter(o => o.status === 'completed')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-400">Loading kitchen display...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">

      {/* New order alert banner */}
      {newOrderAlert && (
        <div className="bg-amber-500 text-black text-center py-2 text-sm font-bold animate-pulse flex items-center justify-center gap-2">
          <Bell className="h-4 w-4" /> NEW ORDER RECEIVED
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}
            className="text-slate-400 hover:text-[#8E939D]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <ChefHat className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#8E939D]">{outletName} — Kitchen Display</h1>
              <p className="text-xs text-slate-400">
                {summary?.pending ?? 0} pending · {summary?.in_progress ?? 0} in progress · avg {summary?.avgWait ?? 0}min wait
                {summary?.urgent ? <span className="text-amber-400 ml-2">⚠ {summary.urgent} urgent</span> : null}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs border transition-all",
              showCompleted
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}>
            {showCompleted ? 'Hide' : 'Show'} completed
          </button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}
            className="border-slate-700 bg-slate-800/50 text-slate-300">
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Station tabs */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 overflow-x-auto flex-shrink-0">
        <button onClick={() => setStationFilter('all')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap transition-all",
            stationFilter === 'all'
              ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
          )}>
          All Stations ({filteredOrders.length})
        </button>
        {stations.map(s => {
          const count = orders.filter(o => o.station_id === s.id && ['pending','in_progress'].includes(o.status)).length
          const isOverloaded = s.current_load >= s.capacity
          return (
            <button key={s.id} onClick={() => setStationFilter(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap transition-all flex items-center gap-1.5",
                stationFilter === s.id
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700",
                isOverloaded && "border-red-500/40"
              )}>
              {s.station_type}
              {count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  isOverloaded ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-300"
                )}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Stations load bar */}
      {stations.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-800/50 overflow-x-auto flex-shrink-0">
          {stations.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-slate-500">{s.name}</span>
              <div className="w-16 h-1.5 rounded-full bg-slate-800">
                <div
                  className={cn("h-full rounded-full transition-all",
                    s.current_load >= s.capacity ? "bg-red-400" :
                    s.current_load >= s.capacity * 0.7 ? "bg-amber-400" : "bg-emerald-400"
                  )}
                  style={{ width: `${Math.min(100, (s.current_load / Math.max(s.capacity, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{s.current_load}/{s.capacity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Order columns */}
      <div className="flex-1 overflow-hidden flex gap-0">
        {/* Pending */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-[#8E939D]">Pending</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{pending.length}</span>
            </div>
            {pending.some(o => o.is_urgent) && (
              <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pending.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No pending orders</p>
              </div>
            ) : pending.map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} stations={stations} />
            ))}
          </div>
        </div>

        {/* In Progress */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-[#8E939D]">In Progress</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{inProgress.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {inProgress.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <Flame className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Nothing cooking</p>
              </div>
            ) : inProgress.map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} stations={stations} />
            ))}
          </div>
        </div>

        {/* Completed */}
        {showCompleted && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-[#8E939D]">Completed</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{completed.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {completed.map(order => (
                <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} stations={stations} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
