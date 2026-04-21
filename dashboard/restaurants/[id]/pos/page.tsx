"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Search, Plus, Minus, Trash2, CreditCard,
  Banknote, BedDouble, Crown, CheckCircle2, Receipt,
  ChefHat, RefreshCw, X, Unlock, AlertTriangle, Calendar, Users, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string; name: string; price: number | string
  category_id: string; description: string | null
  is_halal: boolean; is_vegetarian: boolean; is_vegan: boolean
  popular: boolean; vip_only: boolean; preparation_time: number | null
  menu_categories: { name: string } | null
}

interface CartItem {
  menuItemId: string; name: string; unitPrice: number
  quantity: number; notes: string
}

interface HotelGuest {
  id: string; name: string; is_vip: boolean; loyalty_tier: string | null
  reservation_id: string; room_number: string; room_type: string; floor: number
}

interface TableReservation {
  id: string; guest_name: string; party_size: number; status: string
  occasion: string | null; special_requests: string | null
  guest: { id: string; name: string; is_vip: boolean; loyalty_tier: string | null } | null
  hotel_reservation: { id: string; room_number: string | null; room_type: string | null } | null
}

interface Table {
  id: string; table_number: string; capacity: number; status: string
  current_guest_name: string | null; current_order_id: string | null
  reservation: TableReservation | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function tableStatusColor(status: string) {
  const s = status.toUpperCase()
  if (s === 'AVAILABLE') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (s === 'OCCUPIED')  return 'bg-red-500/10    text-red-400    border-red-500/30'
  if (s === 'RESERVED')  return 'bg-amber-500/10  text-amber-400  border-amber-500/30'
  return 'bg-slate-800 text-slate-400 border-slate-700'
}

function tableLabel(t: Table) {
  return t.table_number.split('-').pop() ?? t.table_number
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function POSPage() {
  const params   = useParams()
  const router   = useRouter()
  const outletId = params.id as string

  const [outletName,      setOutletName]      = useState('')
  const [menuItems,       setMenuItems]       = useState<MenuItem[]>([])
  const [categories,      setCategories]      = useState<{ id: string; name: string }[]>([])
  const [tables,          setTables]          = useState<Table[]>([])
  const [loading,         setLoading]         = useState(true)
  const [activeCategory,  setActiveCategory]  = useState('all')
  const [menuSearch,      setMenuSearch]      = useState('')

  // Cart
  const [cart,          setCart]          = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  // Guest search
  const [guestSearch,    setGuestSearch]    = useState('')
  const [guestResults,   setGuestResults]   = useState<HotelGuest[]>([])
  const [selectedGuest,  setSelectedGuest]  = useState<HotelGuest | null>(null)
  const [searchingGuests, setSearchingGuests] = useState(false)

  // Payment modal
  const [paymentOpen,   setPaymentOpen]   = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'charge_to_room' | 'cash' | 'card'>('cash')
  const [processing,    setProcessing]    = useState(false)
  const [receipt,       setReceipt]       = useState<any>(null)
  const [receiptOpen,   setReceiptOpen]   = useState(false)
  const [payError,      setPayError]      = useState('')

  // Free table confirm
  const [freeTableOpen,  setFreeTableOpen]  = useState(false)
  const [freeingTable,   setFreeingTable]   = useState(false)

  // ── Load menu and tables ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [menuRes, outletsRes, tablesRes] = await Promise.all([
        fetch(`/api/restaurants/pos?outletId=${outletId}`),
        fetch('/api/outlets'),
        fetch(`/api/restaurants/tables?outletId=${outletId}`),
      ])
      const menuData    = menuRes.ok    ? await menuRes.json()    : { categories: [], items: [] }
      const outletsData = outletsRes.ok ? await outletsRes.json() : { outlets: [] }
      const tablesData  = tablesRes.ok  ? await tablesRes.json()  : { tables: [] }

      const outlet = (outletsData.outlets ?? []).find((o: any) => o.id === outletId)
      if (outlet) setOutletName(outlet.name)

      setCategories(menuData.categories ?? [])
      setMenuItems(menuData.items       ?? [])
      setTables(tablesData.tables       ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [outletId])

  useEffect(() => { loadData() }, [loadData])

  // ── Guest search ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (guestSearch.length < 2) { setGuestResults([]); return }
    const timer = setTimeout(async () => {
      setSearchingGuests(true)
      const res = await fetch(`/api/restaurants/pos?guestSearch=${guestSearch}`)
      if (res.ok) {
        const d = await res.json()
        setGuestResults(d.guests ?? [])
      }
      setSearchingGuests(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [guestSearch])

  // ── When table selected, auto-link reservation guest to POS ────────────────
  useEffect(() => {
    if (!selectedTable) return
    const res = selectedTable.reservation
    if (!res) {
      // No restaurant reservation — clear guest if it was from a previous table
      return
    }
    // If the reservation has a linked hotel guest with a hotel reservation, auto-set them
    if (res.guest && res.hotel_reservation) {
      setSelectedGuest({
        id:             res.guest.id,
        name:           res.guest.name,
        is_vip:         res.guest.is_vip,
        loyalty_tier:   res.guest.loyalty_tier,
        reservation_id: res.hotel_reservation.id,
        room_number:    res.hotel_reservation.room_number ?? '',
        room_type:      res.hotel_reservation.room_type   ?? '',
        floor:          0,
      })
      setGuestSearch(res.guest.name)
    } else {
      // Walk-in reservation — just fill the name for reference, no room charge available
      setGuestSearch(res.guest_name)
    }
  }, [selectedTable])

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    const price = Number(item.price)
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id)
      if (existing) return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { menuItemId: item.id, name: item.name, unitPrice: price, quantity: 1, notes: '' }]
    })
  }

  const updateQty = (menuItemId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.menuItemId === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter(i => i.quantity > 0)
    )
  }

  const removeFromCart = (menuItemId: string) => setCart(prev => prev.filter(i => i.menuItemId !== menuItemId))

  const clearCart = () => {
    setCart([])
    setSelectedGuest(null)
    setGuestSearch('')
    setSelectedTable(null)
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal      = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const taxAmount     = subtotal * 0.14
  const serviceCharge = subtotal * 0.12
  const total         = subtotal + taxAmount + serviceCharge

  // ── Process payment ─────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (cart.length === 0) return
    if (paymentMethod === 'charge_to_room' && !selectedGuest) {
      setPayError('Please select a hotel guest to charge to room')
      return
    }
    setPayError('')
    setProcessing(true)
    try {
      const res = await fetch('/api/restaurants/pos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId,
          tableId:              selectedTable?.id                              || null,
          guestId:              selectedGuest?.id                             || null,
          reservationId:        selectedGuest?.reservation_id                 || null,
          diningReservationId:  selectedTable?.reservation?.id                || null,
          paymentMethod,
          roomNumber:           selectedGuest?.room_number                    || null,
          guestCount:           selectedTable?.reservation?.party_size
                                  ?? selectedTable?.capacity
                                  ?? 1,
          specialRequests:      selectedTable?.reservation?.special_requests  || null,
          items: cart.map(i => ({
            menuItemId: i.menuItemId,
            name:       i.name,
            quantity:   i.quantity,
            unitPrice:  i.unitPrice,
            notes:      i.notes || null,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPayError(data.error || 'Payment failed')
        return
      }

      setReceipt(data.receipt)
      setPaymentOpen(false)
      setReceiptOpen(true)
      clearCart()
      loadData()
    } catch (e: any) {
      setPayError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  // ── Free table manually (no order) ─────────────────────────────────────────
  const handleFreeTable = async () => {
    if (!selectedTable) return
    setFreeingTable(true)
    try {
      const res = await fetch('/api/restaurants/tables', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          status:  'AVAILABLE',
          currentGuests: 0,
          currentGuestName: null,
        }),
      })
      if (res.ok) {
        setFreeTableOpen(false)
        setSelectedTable(null)
        setSelectedGuest(null)
        setGuestSearch('')
        loadData()
      }
    } catch (e) { console.error(e) }
    finally { setFreeingTable(false) }
  }

  // ── Filtered menu ───────────────────────────────────────────────────────────
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory
    const matchesSearch   = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const cartQty = (id: string) => cart.find(i => i.menuItemId === id)?.quantity ?? 0

  // Tables to show: all active tables (available, occupied, reserved)
  const visibleTables = tables.filter(t => {
    const s = t.status.toUpperCase()
    return s === 'AVAILABLE' || s === 'OCCUPIED' || s === 'RESERVED'
  })

  const selectedTableStatus = selectedTable?.status?.toUpperCase() ?? ''
  const tableIsOccupiedOrReserved = selectedTableStatus === 'OCCUPIED' || selectedTableStatus === 'RESERVED'

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({length:12}).map((_,i) => <Skeleton key={i} className="h-24"/>)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">

      {/* ── Left: Menu ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}
              className="text-slate-400 hover:text-[#8E939D]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-[#8E939D]">{outletName} — POS</h1>
              <p className="text-xs text-slate-500">{menuItems.length} items</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}
            className="border-slate-700 text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table selector */}
        <div className="px-4 py-2 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 flex-shrink-0">Table:</span>
            <button
              onClick={() => setSelectedTable(null)}
              className={cn(
                "px-2 py-1 rounded text-xs border flex-shrink-0 transition-all",
                !selectedTable
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}>
              None
            </button>
            {visibleTables.map(t => (
              <button key={t.id}
                onClick={() => setSelectedTable(t)}
                className={cn(
                  "px-2 py-1 rounded text-xs border flex-shrink-0 transition-all",
                  selectedTable?.id === t.id
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                    : tableStatusColor(t.status)
                )}>
                {tableLabel(t)}
                <span className="ml-1 opacity-60 text-[9px] uppercase">{t.status.charAt(0)}</span>
              </button>
            ))}
          </div>
          {/* Free table button — shown when a reserved/occupied table is selected with no cart */}
          {selectedTable && tableIsOccupiedOrReserved && cart.length === 0 && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300 flex-1">
                Table {tableLabel(selectedTable)} is {selectedTable.status.toLowerCase()}
                {selectedTable.current_guest_name ? ` · ${selectedTable.current_guest_name}` : ''}
              </p>
              <button
                onClick={() => setFreeTableOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30 hover:bg-amber-500/30 transition-all">
                <Unlock className="h-3 w-3" /> Free
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input placeholder="Search menu..." value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              className="pl-8 h-8 bg-slate-800 border-slate-700 text-[#8E939D] text-sm" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 overflow-x-auto flex-shrink-0">
          <button onClick={() => setActiveCategory('all')}
            className={cn(
              "px-3 py-1 rounded text-xs border whitespace-nowrap transition-all",
              activeCategory === 'all'
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded text-xs border whitespace-nowrap transition-all",
                activeCategory === cat.id
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMenu.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No items found</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredMenu.map(item => {
                const qty = cartQty(item.id)
                return (
                  <div key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "relative p-3 rounded-xl border cursor-pointer transition-all hover:border-orange-500/40",
                      qty > 0
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-slate-800/50 border-slate-700/50"
                    )}>
                    {qty > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#8E939D]">{qty}</span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-[#8E939D] leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.menu_categories?.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold text-orange-400">${Number(item.price).toFixed(2)}</p>
                      <div className="flex gap-1">
                        {item.popular       && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">Hot</span>}
                        {item.is_halal      && <span className="text-[9px] bg-green-500/10 text-green-400 px-1 rounded">H</span>}
                        {item.is_vegetarian && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded">V</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart & Payment ────────────────────────────────────────────── */}
      <div className="w-80 flex flex-col bg-slate-900 flex-shrink-0">

        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="font-semibold text-[#8E939D] flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-400" />
            Order
            {selectedTable && (
              <span className="text-xs text-orange-400">
                · Table {tableLabel(selectedTable)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-slate-500 hover:text-red-400">
              Clear
            </button>
          )}
        </div>

        {/* Reservation banner — shown when table has an active dining reservation */}
        {selectedTable?.reservation && (
          <div className="px-4 py-2 border-b border-slate-800 bg-orange-500/5">
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {selectedTable.reservation.guest?.is_vip && (
                    <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-[#8E939D] truncate">
                    {selectedTable.reservation.guest_name}
                  </p>
                  {selectedTable.reservation.guest?.loyalty_tier && (
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded flex-shrink-0">
                      {selectedTable.reservation.guest.loyalty_tier}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Users className="h-2.5 w-2.5" />{selectedTable.reservation.party_size} guests
                  </span>
                  {selectedTable.reservation.hotel_reservation?.room_number && (
                    <span className="text-[10px] text-orange-400">
                      Room {selectedTable.reservation.hotel_reservation.room_number}
                    </span>
                  )}
                  {selectedTable.reservation.occasion && (
                    <span className="text-[10px] text-amber-400">🎉 {selectedTable.reservation.occasion}</span>
                  )}
                </div>
                {selectedTable.reservation.special_requests && (
                  <p className="text-[10px] text-orange-300 mt-0.5 truncate">
                    ⚠ {selectedTable.reservation.special_requests}
                  </p>
                )}
              </div>
              {/* Show room charge badge if hotel guest is linked */}
              {selectedTable.reservation.hotel_reservation ? (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                  Room charge ✓
                </span>
              ) : (
                <span className="text-[9px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                  Walk-in
                </span>
              )}
            </div>
          </div>
        )}

        {/* Guest search */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="relative">
            <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input placeholder="Search hotel guest..."
              value={guestSearch}
              onChange={e => {
                setGuestSearch(e.target.value)
                if (!e.target.value) { setSelectedGuest(null); setGuestResults([]) }
              }}
              className="pl-8 h-8 bg-slate-800 border-slate-700 text-[#8E939D] text-sm" />
          </div>

          {guestResults.length > 0 && (
            <div className="mt-1 rounded-lg border border-slate-700 bg-slate-800 overflow-hidden z-10">
              {guestResults.map(g => (
                <button key={g.id}
                  onClick={() => { setSelectedGuest(g); setGuestSearch(g.name); setGuestResults([]) }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 text-left">
                  {g.is_vip && <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#8E939D] truncate">{g.name}</p>
                    <p className="text-[10px] text-orange-400">Room {g.room_number}</p>
                  </div>
                  {g.loyalty_tier && (
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded flex-shrink-0">{g.loyalty_tier}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedGuest && (
            <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div>
                <div className="flex items-center gap-1">
                  {selectedGuest.is_vip && <Crown className="h-3 w-3 text-yellow-400" />}
                  <p className="text-xs font-medium text-[#8E939D]">{selectedGuest.name}</p>
                </div>
                <p className="text-[10px] text-orange-400">Room {selectedGuest.room_number}</p>
              </div>
              <button onClick={() => { setSelectedGuest(null); setGuestSearch('') }}
                className="text-slate-500 hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tap items to add to order</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#8E939D] truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">${item.unitPrice.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.menuItemId, -1)}
                    className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center">
                    <Minus className="h-2.5 w-2.5 text-slate-300" />
                  </button>
                  <span className="text-xs font-bold text-[#8E939D] w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.menuItemId, 1)}
                    className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center">
                    <Plus className="h-2.5 w-2.5 text-slate-300" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#8E939D]">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.menuItemId)}
                    className="text-slate-600 hover:text-red-400 mt-0.5">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Tax (14%)</span><span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Service (12%)</span><span>${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#8E939D] pt-1 border-t border-slate-800">
              <span>Total</span><span className="text-orange-400">${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment buttons */}
        <div className="px-4 pb-4 space-y-2">
          {cart.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm"
                onClick={() => { setPaymentMethod('cash'); setPayError(''); setPaymentOpen(true) }}
                className="bg-emerald-600 hover:bg-emerald-700 text-[#8E939D] text-xs h-9 flex flex-col gap-0.5">
                <Banknote className="h-3.5 w-3.5" />Cash
              </Button>
              <Button size="sm"
                onClick={() => { setPaymentMethod('card'); setPayError(''); setPaymentOpen(true) }}
                className="bg-blue-600 hover:bg-blue-700 text-[#8E939D] text-xs h-9 flex flex-col gap-0.5">
                <CreditCard className="h-3.5 w-3.5" />Card
              </Button>
              <Button size="sm"
                onClick={() => { setPaymentMethod('charge_to_room'); setPayError(''); setPaymentOpen(true) }}
                className={cn(
                  "text-xs h-9 flex flex-col gap-0.5",
                  selectedGuest
                    ? "bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                )}>
                <BedDouble className="h-3.5 w-3.5" />Room
              </Button>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-600 py-2">Add items to process payment</div>
          )}
        </div>
      </div>

      {/* ── Payment Confirmation Modal ─────────────────────────────────────── */}
      <Dialog open={paymentOpen} onOpenChange={v => { setPaymentOpen(v); if (!v) setPayError('') }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-2">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.quantity}× {item.name}</span>
                  <span className="text-slate-400">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax + Service</span>
                  <span>${(taxAmount + serviceCharge).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#8E939D]">
                  <span>Total</span>
                  <span className="text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'charge_to_room'] as const).map(method => (
                <button key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "p-2 rounded-lg border text-xs text-center transition-all",
                    paymentMethod === method
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  )}>
                  {method === 'cash'           && <><Banknote    className="h-4 w-4 mx-auto mb-1" />Cash</>}
                  {method === 'card'           && <><CreditCard  className="h-4 w-4 mx-auto mb-1" />Card</>}
                  {method === 'charge_to_room' && <><BedDouble   className="h-4 w-4 mx-auto mb-1" />Room</>}
                </button>
              ))}
            </div>

            {paymentMethod === 'charge_to_room' && (
              selectedGuest ? (
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    {selectedGuest.is_vip && <Crown className="h-4 w-4 text-yellow-400" />}
                    <div>
                      <p className="text-sm font-semibold text-[#8E939D]">{selectedGuest.name}</p>
                      <p className="text-xs text-orange-400">Room {selectedGuest.room_number} · {selectedGuest.room_type}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    ${total.toFixed(2)} will be charged to room folio
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-xs text-red-400">Search for a hotel guest on the left panel first</p>
                </div>
              )
            )}

            {payError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{payError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300"
                onClick={() => setPaymentOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-[#8E939D]"
                disabled={processing || (paymentMethod === 'charge_to_room' && !selectedGuest)}
                onClick={handlePayment}>
                {processing ? 'Processing...' : `Charge $${total.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Receipt Modal ──────────────────────────────────────────────────── */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Payment Complete
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-2 font-mono text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span><span>${receipt.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax</span><span>${receipt.tax}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Service</span><span>${receipt.serviceCharge}</span>
                </div>
                <div className="flex justify-between font-bold text-[#8E939D] border-t border-slate-700 pt-2">
                  <span>Total</span><span className="text-emerald-400">${receipt.total}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Payment</span>
                  <span className="capitalize">{receipt.paymentMethod.replace(/_/g,' ')}</span>
                </div>
                {receipt.roomNumber && (
                  <div className="flex justify-between text-orange-400">
                    <span>Room</span><span>{receipt.roomNumber}</span>
                  </div>
                )}
                {receipt.chargedToFolio && (
                  <p className="text-xs text-emerald-400 pt-1">✓ Charged to guest folio</p>
                )}
              </div>
              <p className="text-xs text-center text-emerald-400 flex items-center justify-center gap-1">
                <Unlock className="h-3 w-3" /> Table has been freed
              </p>
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-[#8E939D]"
                onClick={() => setReceiptOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Free Table Confirm ─────────────────────────────────────────────── */}
      <Dialog open={freeTableOpen} onOpenChange={setFreeTableOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-[#8E939D] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Unlock className="h-5 w-5 text-amber-400" />
              Free Table
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-300">
              Mark Table <strong className="text-[#8E939D]">{selectedTable ? tableLabel(selectedTable) : ''}</strong> as
              available? This will clear the guest and reservation without processing a payment.
            </p>
            {selectedTable?.current_guest_name && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400">Current guest</p>
                <p className="text-sm font-medium text-[#8E939D] mt-0.5">{selectedTable.current_guest_name}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300"
                onClick={() => setFreeTableOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-[#8E939D]"
                disabled={freeingTable} onClick={handleFreeTable}>
                {freeingTable ? 'Freeing...' : 'Free Table'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
