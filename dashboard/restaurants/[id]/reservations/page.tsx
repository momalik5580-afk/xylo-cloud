"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Search, Calendar, Users, Clock,
  Crown, Phone, Mail, CheckCircle2, XCircle,
  ChefHat, AlertCircle, RefreshCw, Star, Utensils,
  Edit2, Table2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Reservation {
  id: string
  guest_name: string
  phone: string | null
  email: string | null
  party_size: number
  reservation_date: string
  duration: number
  status: string
  occasion: string | null
  special_requests: string | null
  notes: string | null
  table_id: string | null
  confirmed_at: string | null
  seated_at: string | null
  restaurant_tables: { table_number: string; capacity: number; section: string | null } | null
  guests: { id: string; first_name: string; last_name: string; is_vip: boolean; loyalty_tier: string | null; phone: string | null; email: string | null } | null
}

interface AvailableTable {
  id: string; table_number: string; capacity: number; section: string | null
}

interface Outlet {
  id: string; name: string; type: string
  openingTime: string | null; closingTime: string | null
}

interface HotelGuest {
  id: string; first_name: string; last_name: string
  is_vip: boolean; loyalty_tier: string | null; phone: string | null; email: string | null
}

// ─── Status config (handles both lowercase and UPPERCASE from DB) ───────────────

type StatusKey = 'confirmed' | 'CONFIRMED' | 'seated' | 'SEATED' | 'completed' | 'COMPLETED' | 'cancelled' | 'CANCELLED' | 'no_show' | 'NO_SHOW' | 'reserved' | 'RESERVED'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-500/10    text-blue-400    border-blue-500/20' },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-blue-500/10    text-blue-400    border-blue-500/20' },
  seated:     { label: 'Seated',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  SEATED:     { label: 'Seated',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  completed:  { label: 'Completed',  color: 'bg-slate-500/10   text-slate-400   border-slate-500/20' },
  COMPLETED:  { label: 'Completed',  color: 'bg-slate-500/10   text-slate-400   border-slate-500/20' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-500/10     text-red-400     border-red-500/20' },
  CANCELLED:  { label: 'Cancelled',  color: 'bg-red-500/10     text-red-400     border-red-500/20' },
  no_show:    { label: 'No Show',    color: 'bg-amber-500/10   text-amber-400   border-amber-500/20' },
  NO_SHOW:    { label: 'No Show',    color: 'bg-amber-500/10   text-amber-400   border-amber-500/20' },
  reserved:   { label: 'Reserved',   color: 'bg-purple-500/10  text-purple-400  border-purple-500/20' },
  RESERVED:   { label: 'Reserved',   color: 'bg-purple-500/10  text-purple-400  border-purple-500/20' },
}

function getStatus(s: string) {
  return STATUS_MAP[s] ?? STATUS_MAP['confirmed']
}

function isConfirmed(s: string) { return ['confirmed','CONFIRMED','reserved','RESERVED'].includes(s) }
function isSeated(s: string)    { return ['seated','SEATED'].includes(s) }
function isTerminal(s: string)  { return ['completed','COMPLETED','cancelled','CANCELLED','no_show','NO_SHOW'].includes(s) }

const OCCASIONS = ['Birthday', 'Anniversary', 'Business Dinner', 'Date Night', 'Family Gathering', 'Other']

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const params   = useParams()
  const router   = useRouter()
  const outletId = params.id as string

  const [outlet,       setOutlet]       = useState<Outlet | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [summary,      setSummary]      = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // New reservation modal
  const [newOpen,           setNewOpen]           = useState(false)
  const [availTables,       setAvailTables]       = useState<AvailableTable[]>([])
  const [guestSuggestions,  setGuestSuggestions]  = useState<HotelGuest[]>([])
  const [newRes, setNewRes] = useState({
    guestName: '', phone: '', email: '', roomNumber: '', partySize: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00', duration: 90, tableId: '',
    occasion: '', specialRequests: '', guestId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Detail modal
  const [detailRes,        setDetailRes]        = useState<Reservation | null>(null)
  const [detailOpen,       setDetailOpen]       = useState(false)
  const [updatingStatus,   setUpdatingStatus]   = useState(false)
  const [statusError,      setStatusError]      = useState('')

  // Assign table modal (inside detail)
  const [assignTableOpen,  setAssignTableOpen]  = useState(false)
  const [assignTables,     setAssignTables]     = useState<AvailableTable[]>([])
  const [selectedAssignTable, setSelectedAssignTable] = useState('')

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [outletsRes, resRes] = await Promise.all([
        fetch('/api/outlets'),
        fetch(`/api/restaurants/reservations?outletId=${outletId}&date=${selectedDate}`),
      ])
      const outletsData = outletsRes.ok ? await outletsRes.json() : { outlets: [] }
      const resData     = resRes.ok     ? await resRes.json()     : { reservations: [], summary: null }

      setOutlet((outletsData.outlets ?? []).find((o: Outlet) => o.id === outletId) ?? null)
      setReservations(resData.reservations ?? [])
      setSummary(resData.summary ?? null)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [outletId, selectedDate])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Load available tables when new res form changes ─────────────────────────
  useEffect(() => {
    if (!newOpen) return
    const load = async () => {
      const res = await fetch(
        `/api/restaurants/availability?outletId=${outletId}&date=${newRes.date}&time=${newRes.time}&partySize=${newRes.partySize}&duration=${newRes.duration}`
      )
      if (res.ok) {
        const d = await res.json()
        setAvailTables(d.availableTables ?? [])
      }
    }
    load()
  }, [newOpen, newRes.date, newRes.time, newRes.partySize, outletId, newRes.duration])

  // ── Load tables for assign table panel ─────────────────────────────────────
  const openAssignTable = async () => {
    if (!detailRes) return
    const res = await fetch(`/api/restaurants/tables?outletId=${outletId}`)
    if (res.ok) {
      const d = await res.json()
      // Show available + reserved tables only
      const eligible = (d.tables ?? []).filter((t: any) => {
        const s = t.status?.toUpperCase()
        return s === 'AVAILABLE' || (s === 'RESERVED' && t.id === detailRes.table_id)
      })
      setAssignTables(eligible)
      setSelectedAssignTable(detailRes.table_id ?? '')
      setAssignTableOpen(true)
    }
  }

  const handleAssignTable = async () => {
    if (!detailRes) return
    const res = await fetch(`/api/restaurants/reservations/${detailRes.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tableId: selectedAssignTable || null }),
    })
    if (res.ok) {
      const d = await res.json()
      // Update detailRes with new table info
      setDetailRes(prev => prev ? { ...prev, table_id: selectedAssignTable, restaurant_tables: d.reservation.restaurant_tables } : prev)
      setAssignTableOpen(false)
      fetchData()
    }
  }

  // ── Search hotel guests ─────────────────────────────────────────────────────
  const searchGuests = async (q: string) => {
    if (q.length < 2) { setGuestSuggestions([]); return }
    const res = await fetch(`/api/frontdesk/guests?search=${q}&limit=5`)
    if (res.ok) {
      const d = await res.json()
      setGuestSuggestions(d.guests ?? [])
    }
  }

  // ── Submit new reservation ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!newRes.guestName || !newRes.date) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/restaurants/reservations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName:       newRes.guestName,
          phone:           newRes.phone     || null,
          email:           newRes.email     || null,
          partySize:       newRes.partySize,
          reservationDate: `${newRes.date}T${newRes.time}:00`,
          duration:        newRes.duration,
          tableId:         newRes.tableId   || null,
          occasion:        newRes.occasion  || null,
          specialRequests: newRes.specialRequests || null,
          guestId:         newRes.guestId   || null,
          notes:           newRes.roomNumber ? `Room: ${newRes.roomNumber}` : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error)
        return
      }
      setNewOpen(false)
      setNewRes({
        guestName: '', phone: '', email: '', roomNumber: '', partySize: 2,
        date: new Date().toISOString().split('T')[0],
        time: '19:00', duration: 90, tableId: '', occasion: '', specialRequests: '', guestId: '',
      })
      fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  // ── Update reservation status ───────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true)
    setStatusError('')
    try {
      const res = await fetch(`/api/restaurants/reservations/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusError(data.error || 'Failed to update status')
        return
      }
      // Update local state immediately — no need to wait for fetchData
      const updated: Reservation = data.reservation
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
      setDetailRes(updated)   // keep modal open with fresh data
      fetchData()             // sync in background
    } catch (e: any) {
      setStatusError(e.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = reservations.filter(r => {
    if (statusFilter !== 'all') {
      // Normalise both to lowercase for comparison
      if (r.status.toLowerCase() !== statusFilter.toLowerCase()) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        r.guest_name.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.restaurant_tables?.table_number.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalCovers = filtered.reduce((s, r) => s + r.party_size, 0)

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20"/>)}
        </div>
        {Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-16"/>)}
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
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#8E939D] flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-400" />
                {outlet?.name} — Reservations
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {summary?.today ?? 0} today · {summary?.todayCovers ?? 0} covers · {summary?.upcoming ?? 0} upcoming
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}
              className="border-slate-700 bg-slate-800/50 text-slate-300">
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
              onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Reservation
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Today',    value: summary?.today       ?? 0, color: 'text-blue-400' },
            { label: 'Covers',   value: summary?.todayCovers ?? 0, color: 'text-orange-400' },
            { label: 'Upcoming', value: summary?.upcoming    ?? 0, color: 'text-emerald-400' },
            { label: 'Showing',  value: filtered.length,           color: 'text-[#8E939D]' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-slate-900/80 border-slate-800/60">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-[#8E939D] text-sm"
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input placeholder="Search guest, table..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-56 bg-slate-800/50 border-slate-700 text-[#8E939D]" />
          </div>
          {['all','confirmed','seated','completed','cancelled','no_show'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all",
                statusFilter === s
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800"
              )}>
              {s === 'all' ? `All (${reservations.length})` : s.replace('_',' ')}
            </button>
          ))}
        </div>

        {/* Reservations list */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#8E939D] text-base flex items-center justify-between">
              <span>
                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : selectedDate} Reservations
              </span>
              <span className="text-sm font-normal text-slate-400">{totalCovers} total covers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No reservations for this date</p>
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add First Reservation
                </Button>
              </div>
            ) : (
              filtered.map(res => {
                const s    = getStatus(res.status)
                const time = new Date(res.reservation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isVip = res.guests?.is_vip
                return (
                  <div key={res.id}
                    onClick={() => {
                      setDetailRes(res)
                      setStatusError('')
                      setDetailOpen(true)
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-orange-500/30 cursor-pointer transition-all">

                    <div className="text-center w-14 flex-shrink-0">
                      <p className="text-base font-bold text-[#8E939D]">{time}</p>
                      <p className="text-xs text-slate-500">{res.duration}min</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isVip && <Crown className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
                        <p className="font-semibold text-[#8E939D] truncate">{res.guest_name}</p>
                        {res.guests?.loyalty_tier && (
                          <Badge className="bg-blue-500/10 text-blue-400 text-xs flex-shrink-0">
                            {res.guests.loyalty_tier}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{res.party_size} guests
                        </span>
                        {res.restaurant_tables ? (
                          <span className="flex items-center gap-1">
                            <Utensils className="h-3 w-3" />
                            Table {res.restaurant_tables.table_number.split('-').pop()}
                          </span>
                        ) : (
                          <span className="text-amber-500">No table</span>
                        )}
                        {res.occasion && (
                          <span className="text-amber-400">{res.occasion}</span>
                        )}
                        {res.special_requests && (
                          <span className="text-orange-400 truncate">⚠ {res.special_requests}</span>
                        )}
                      </div>
                    </div>

                    <Badge className={cn("text-xs flex-shrink-0 border", s.color)}>{s.label}</Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── New Reservation Modal ────────────────────────────────────────────── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            <div className="space-y-2">
              <Label className="text-slate-300">Guest Name</Label>
              <div className="relative">
                <Input placeholder="Type name or search hotel guests..."
                  value={newRes.guestName}
                  onChange={e => {
                    setNewRes({...newRes, guestName: e.target.value, guestId: ''})
                    searchGuests(e.target.value)
                  }}
                  className="bg-slate-800 border-slate-700 text-[#8E939D]" />
                {guestSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                    {guestSuggestions.map(g => (
                      <button key={g.id}
                        onClick={() => {
                          setNewRes({...newRes,
                            guestName: `${g.first_name} ${g.last_name}`,
                            phone:     g.phone  ?? '',
                            email:     g.email  ?? '',
                            guestId:   g.id,
                          })
                          setGuestSuggestions([])
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-left">
                        {g.is_vip && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                        <div>
                          <p className="text-sm font-medium text-[#8E939D]">{g.first_name} {g.last_name}</p>
                          <p className="text-xs text-slate-400">{g.email}</p>
                        </div>
                        {g.loyalty_tier && (
                          <Badge className="ml-auto bg-blue-500/10 text-blue-400 text-xs">{g.loyalty_tier}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {newRes.guestId && <p className="text-xs text-emerald-400">✓ Linked to hotel guest profile</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input value={newRes.phone}
                  onChange={e => setNewRes({...newRes, phone: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-[#8E939D]" placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input value={newRes.email}
                  onChange={e => setNewRes({...newRes, email: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-[#8E939D]" placeholder="guest@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Date</Label>
                <input type="date" value={newRes.date}
                  onChange={e => setNewRes({...newRes, date: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-[#8E939D] text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Time</Label>
                <input type="time" value={newRes.time}
                  onChange={e => setNewRes({...newRes, time: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-[#8E939D] text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Guests</Label>
                <Input type="number" min={1} max={20} value={newRes.partySize}
                  onChange={e => setNewRes({...newRes, partySize: parseInt(e.target.value) || 1})}
                  className="bg-slate-800 border-slate-700 text-[#8E939D]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Room Number <span className="text-slate-500 font-normal">(if hotel guest)</span></Label>
              <Input value={newRes.roomNumber}
                onChange={e => setNewRes({...newRes, roomNumber: e.target.value})}
                className="bg-slate-800 border-slate-700 text-[#8E939D]" placeholder="e.g. 301" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                Table
                <span className="ml-2 text-xs text-slate-500">
                  {availTables.length > 0 ? `${availTables.length} available` : 'No tables available for this slot'}
                </span>
              </Label>
              <Select value={newRes.tableId} onValueChange={v => setNewRes({...newRes, tableId: v === 'none' ? '' : v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-[#8E939D]">
                  <SelectValue placeholder="Select table (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-48 overflow-y-auto">
                  <SelectItem value="none" className="text-slate-400">No table assigned</SelectItem>
                  {availTables.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-[#8E939D]">
                      Table {t.table_number.split('-').slice(1).join('-') || t.table_number} — {t.capacity} seats ({t.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Occasion</Label>
              <Select value={newRes.occasion} onValueChange={v => setNewRes({...newRes, occasion: v === 'none' ? '' : v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-[#8E939D]">
                  <SelectValue placeholder="Select occasion (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700" position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="none" className="text-slate-400">None</SelectItem>
                  {OCCASIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-[#8E939D]">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Special Requests</Label>
              <Textarea value={newRes.specialRequests}
                onChange={e => setNewRes({...newRes, specialRequests: e.target.value})}
                placeholder="Allergies, preferences, seating requests..."
                className="bg-slate-800 border-slate-700 text-[#8E939D] min-h-[70px]" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300"
                onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
                disabled={!newRes.guestName || submitting} onClick={handleSubmit}>
                {submitting ? 'Booking...' : 'Confirm Reservation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reservation Detail Modal ─────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) setStatusError('') }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-md">
          {detailRes && (() => {
            const s       = getStatus(detailRes.status)
            const time    = new Date(detailRes.reservation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const dateStr = new Date(detailRes.reservation_date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {detailRes.guests?.is_vip && <Crown className="h-5 w-5 text-yellow-400" />}
                    {detailRes.guest_name}
                    <Badge className={cn("ml-auto text-xs border", s.color)}>{s.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">

                  {/* Time / party / table */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="text-base font-bold text-[#8E939D] mt-1">{time}</p>
                      <p className="text-xs text-slate-500">{dateStr}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500">Guests</p>
                      <p className="text-xl font-bold text-[#8E939D] mt-1">{detailRes.party_size}</p>
                    </div>
                    <button
                      onClick={openAssignTable}
                      disabled={isTerminal(detailRes.status)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        detailRes.restaurant_tables
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                          : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
                        isTerminal(detailRes.status) && "opacity-40 cursor-not-allowed"
                      )}>
                      <p className="text-xs text-slate-500">Table</p>
                      <p className="text-base font-bold text-[#8E939D] mt-1">
                        {detailRes.restaurant_tables
                          ? detailRes.restaurant_tables.table_number.split('-').pop()
                          : '—'}
                      </p>
                      {!isTerminal(detailRes.status) && (
                        <p className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-center gap-0.5">
                          <Edit2 className="h-2 w-2" />assign
                        </p>
                      )}
                    </button>
                  </div>

                  {/* Contact */}
                  {(detailRes.phone || detailRes.email || detailRes.guests?.loyalty_tier) && (
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-2">
                      {detailRes.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />{detailRes.phone}
                        </div>
                      )}
                      {detailRes.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />{detailRes.email}
                        </div>
                      )}
                      {detailRes.guests?.loyalty_tier && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-blue-400">{detailRes.guests.loyalty_tier} member</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detailRes.occasion && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-xs text-amber-400">🎉 {detailRes.occasion}</p>
                    </div>
                  )}

                  {detailRes.special_requests && (
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-xs text-slate-500 mb-1">Special requests</p>
                      <p className="text-sm text-orange-300">{detailRes.special_requests}</p>
                    </div>
                  )}

                  {/* Error display */}
                  {statusError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400">{statusError}</p>
                    </div>
                  )}

                  {/* ── Status action buttons ─── */}
                  {isConfirmed(detailRes.status) && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Guest Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-[#8E939D]"
                          disabled={updatingStatus}
                          onClick={() => updateStatus(detailRes.id, 'seated')}>
                          <ChefHat className="h-4 w-4 mr-2" />
                          {updatingStatus ? '...' : 'Seat Guest'}
                        </Button>
                        <Button variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          disabled={updatingStatus}
                          onClick={() => updateStatus(detailRes.id, 'no_show')}>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          No Show
                        </Button>
                      </div>
                      <Button variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={updatingStatus}
                        onClick={() => updateStatus(detailRes.id, 'cancelled')}>
                        <XCircle className="h-4 w-4 mr-2" /> Cancel Reservation
                      </Button>
                    </div>
                  )}

                  {isSeated(detailRes.status) && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Guest Actions</p>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                        disabled={updatingStatus}
                        onClick={() => updateStatus(detailRes.id, 'completed')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {updatingStatus ? 'Updating...' : 'Mark Dining Complete'}
                      </Button>
                      <Button variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={updatingStatus}
                        onClick={() => updateStatus(detailRes.id, 'cancelled')}>
                        <XCircle className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  )}

                  {isTerminal(detailRes.status) && (
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                      <p className="text-sm text-slate-400">
                        This reservation is <span className="text-[#8E939D] font-medium">{s.label}</span>
                      </p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full border-slate-700 text-slate-300"
                    onClick={() => setDetailOpen(false)}>Close</Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Assign Table Modal ───────────────────────────────────────────────── */}
      <Dialog open={assignTableOpen} onOpenChange={setAssignTableOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Table2 className="h-5 w-5 text-orange-400" /> Assign Table
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">
              Select a table for <span className="text-[#8E939D] font-medium">{detailRes?.guest_name}</span>
              {' '}({detailRes?.party_size} guests)
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <button
                onClick={() => setSelectedAssignTable('')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  !selectedAssignTable
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                )}>
                <div className="flex-1">
                  <p className="text-sm font-medium">No table assigned</p>
                </div>
              </button>
              {assignTables.map(t => {
                const fits = t.capacity >= (detailRes?.party_size ?? 0)
                return (
                  <button key={t.id}
                    onClick={() => setSelectedAssignTable(t.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      selectedAssignTable === t.id
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600",
                      !fits && "opacity-50"
                    )}>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", selectedAssignTable === t.id ? "text-orange-400" : "text-[#8E939D]")}>
                        Table {t.table_number.split('-').pop()}
                      </p>
                      <p className="text-xs text-slate-400">{t.section} · {t.capacity} seats</p>
                    </div>
                    {!fits && <span className="text-[10px] text-red-400">Too small</span>}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300"
                onClick={() => setAssignTableOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
                onClick={handleAssignTable}>
                Assign Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
