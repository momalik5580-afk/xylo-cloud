// src/components/dashboard/content/hotel-settings-content.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import type { OutletType, OutletKpiSettings } from "@/hooks/use-hotel-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Save, Trash2, Plus, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutletRow {
  id: string
  name: string
  code: string
  type: OutletType
  status: string
  openingTime: string | null
  closingTime: string | null
  twoSeatTables: number
  fourSeatTables: number
  sixSeatTables: number
  capacity: number | null
  description: string | null
  tableCount?: number
  orderCount?: number
  // UI-only flags
  _isNew?: boolean
  _isDirty?: boolean
}

interface HotelConfig {
  hotelId?:         string
  hotelName:        string
  address?:         string
  city?:            string
  country?:         string
  phone?:           string
  email?:           string
  totalRooms:       number
  totalFloors:      number
  roomNumberFormat: string
  currency:         string
  timezone:         string
  checkInTime:      string
  checkOutTime:     string
  taxRate?:         number
  serviceCharge?:   number
  starRating?:      number
  modules:          Record<string, boolean>
  outletKpiSettings: OutletKpiSettings
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTLET_TYPES: { value: OutletType; label: string }[] = [
  { value: "restaurant",   label: "Restaurant" },
  { value: "bar",          label: "Bar" },
  { value: "cafe",         label: "Café" },
  { value: "room-service", label: "Room Service" },
  { value: "banquet",      label: "Banquet & Events" },
]

const MODULES = [
  { key: "spa",     label: "Spa" },
  { key: "gym",     label: "Gym & Recreation" },
  { key: "banquet", label: "Banquet & Events" },
  { key: "ird",     label: "In-Room Dining" },
  { key: "pool",    label: "Pool" },
  { key: "clinic",  label: "Medical Clinic" },
]

const KPI_OPTIONS = [
  { key: "trackBeverageCost",  label: "Beverage Cost %" },
  { key: "trackWaste",         label: "Waste %" },
  { key: "trackLaborCost",     label: "Labor Cost %" },
  { key: "trackTableTurnover", label: "Table Turnover" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HotelSettingsContent() {
  const [config, setConfig]     = useState<HotelConfig | null>(null)
  const [outlets, setOutlets]   = useState<OutletRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [outletToDelete, setOutletToDelete] = useState<OutletRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Load hotel config + outlets from DB ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, outletsRes] = await Promise.all([
        fetch("/api/hotel/config"),
        fetch("/api/outlets"),
      ])

      if (!configRes.ok) throw new Error("Failed to load hotel config")
      if (!outletsRes.ok) throw new Error("Failed to load outlets")

      const configData  = await configRes.json()
      const outletsData = await outletsRes.json()

      setConfig({
        hotelId:          configData.hotelId,
        hotelName:        configData.hotelName        ?? "XYLO Hotel",
        address:          configData.address          ?? "",
        city:             configData.city             ?? "",
        country:          configData.country          ?? "",
        phone:            configData.phone            ?? "",
        email:            configData.email            ?? "",
        totalRooms:       configData.totalRooms       ?? 450,
        totalFloors:      configData.totalFloors      ?? 4,
        roomNumberFormat: configData.roomNumberFormat ?? "{floor}{number}",
        currency:         configData.currency         ?? "USD",
        timezone:         configData.timezone         ?? "UTC",
        checkInTime:      configData.checkInTime      ?? "14:00",
        checkOutTime:     configData.checkOutTime     ?? "12:00",
        taxRate:          configData.taxRate,
        serviceCharge:    configData.serviceCharge,
        starRating:       configData.starRating,
        modules:          configData.modules          ?? {},
        outletKpiSettings: configData.outletKpiSettings ?? {
          trackBeverageCost: true, trackWaste: true,
          trackLaborCost: true, trackTableTurnover: true,
        },
      })

      setOutlets(outletsData.outlets ?? [])
    } catch (e: any) {
      showFeedback("error", e.message ?? "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Sync all outlet tables at once ──────────────────────────────────────────
  // Useful for first-time setup when outlets already have seat counts
  // but restaurant_tables rows haven't been created yet
  const [syncing, setSyncing] = useState(false)
  const handleSyncAllTables = async () => {
    setSyncing(true)
    const tableTypes = ["restaurant", "bar", "cafe"]
    const syncable   = outlets.filter(o => tableTypes.includes(o.type) && o.status === "active")

    if (syncable.length === 0) {
      showFeedback("error", "No active restaurant/bar/cafe outlets found to sync")
      setSyncing(false)
      return
    }

    let total = { created: 0, reactivated: 0, deactivated: 0 }
    const errors: string[] = []

    for (const outlet of syncable) {
      try {
        const res = await fetch("/api/restaurants/tables/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ outletId: outlet.id }),
        })
        const d = await res.json()
        if (res.ok) {
          total.created     += d.created     ?? 0
          total.reactivated += d.reactivated ?? 0
          total.deactivated += d.deactivated ?? 0
        } else {
          errors.push(`${outlet.name}: ${d.error ?? res.status}`)
        }
      } catch (e: any) {
        errors.push(`${outlet.name}: ${e.message}`)
      }
    }

    setSyncing(false)

    if (errors.length > 0) {
      showFeedback("error", `Errors: ${errors.join(" | ")}`)
    } else {
      showFeedback("success",
        total.created + total.reactivated + total.deactivated === 0
          ? "All tables already in sync — nothing to create"
          : `Tables synced — ${total.created} created, ${total.reactivated} reactivated, ${total.deactivated} deactivated`
      )
    }
  }

  // ── Feedback helper ──────────────────────────────────────────────────────────
  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── Save hotel config ────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch("/api/hotel/config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(config),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save")
      }
      showFeedback("success", "Hotel configuration saved")
    } catch (e: any) {
      showFeedback("error", e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Add new outlet (create in DB immediately) ────────────────────────────────
  const handleAddOutlet = async () => {
    try {
      const res = await fetch("/api/outlets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:  `New Outlet ${outlets.length + 1}`,
          type:  "restaurant",
          status: "active",
          twoSeatTables: 0, fourSeatTables: 0, sixSeatTables: 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to create outlet")
      }
      const { outlet } = await res.json()
      setOutlets(prev => [...prev, { ...outlet, _isNew: true }])
      showFeedback("success", `"${outlet.name}" created — edit the details below`)
    } catch (e: any) {
      showFeedback("error", e.message)
    }
  }

  // ── Update outlet field locally, save on blur ────────────────────────────────
  const updateOutletLocal = (id: string, field: keyof OutletRow, value: any) => {
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, [field]: value, _isDirty: true } : o))
  }

  const saveOutlet = async (outlet: OutletRow) => {
    if (!outlet._isDirty) return
    try {
      const res = await fetch(`/api/outlets/${outlet.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          outlet.name,
          type:          outlet.type,
          status:        outlet.status,
          openingTime:   outlet.openingTime,
          closingTime:   outlet.closingTime,
          twoSeatTables: outlet.twoSeatTables,
          fourSeatTables:outlet.fourSeatTables,
          sixSeatTables: outlet.sixSeatTables,
          capacity:      outlet.capacity,
          description:   outlet.description,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save outlet")
      }
      // Clear dirty flag
      setOutlets(prev => prev.map(o => o.id === outlet.id ? { ...o, _isDirty: false, _isNew: false } : o))

      // Sync restaurant_tables rows to match the new seat counts
      // This creates/deactivates actual table rows in the DB
      const tableTypes = ["restaurant", "bar", "cafe"]
      if (tableTypes.includes(outlet.type)) {
        const syncRes = await fetch("/api/restaurants/tables/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ outletId: outlet.id }),
        })
        if (syncRes.ok) {
          const syncData = await syncRes.json()
          if (syncData.created > 0 || syncData.reactivated > 0 || syncData.deactivated > 0) {
            showFeedback("success", syncData.message)
          }
        }
      }
    } catch (e: any) {
      showFeedback("error", `Could not save "${outlet.name}": ${e.message}`)
    }
  }

  // ── Delete outlet ────────────────────────────────────────────────────────────
  const handleDeleteOutlet = async () => {
    if (!outletToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/outlets/${outletToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to delete")
      }
      setOutlets(prev => prev.filter(o => o.id !== outletToDelete.id))
      showFeedback("success", `"${outletToDelete.name}" deactivated and hidden from dashboards`)
      setDeleteDialog(false)
      setOutletToDelete(null)
    } catch (e: any) {
      showFeedback("error", e.message)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-6 text-center text-[#8E939D]">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p>Failed to load hotel configuration.</p>
        <Button onClick={loadData} className="mt-4" variant="outline">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#8E939D]">Delete Outlet</AlertDialogTitle>
            <AlertDialogDescription className="text-[#8E939D]" asChild>
              <div>
                <p>
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-[#8E939D]">{outletToDelete?.name}</span>?
                </p>
                {outletToDelete && ((outletToDelete.tableCount ?? 0) > 0 || (outletToDelete.orderCount ?? 0) > 0) && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    This outlet has {outletToDelete.tableCount ?? 0} table(s) and {outletToDelete.orderCount ?? 0} order(s).
                    It will be <strong>deactivated</strong> (hidden from dashboards) — historical data is kept.
                  </div>
                )}
                {outletToDelete && outletToDelete.tableCount === 0 && outletToDelete.orderCount === 0 && (
                  <p className="mt-1 text-xs text-[#5C6270]">No tables or orders found. This outlet will be deactivated.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#00f2ff]/10 border-[#00f2ff]/20 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOutlet}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-[#8E939D]"
            >
              {deleting ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
            <Building2 className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
          </div>
          <div>
            <h1 className="text-[10px] font-bold tracking-[0.4em] text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.2)] uppercase">
              HOTEL SETTINGS COMMAND CENTER
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#5C6270] mt-1">
              {config.hotelId ? "DATABASE SYNCHRONIZED COMMAND CENTER" : "LEGACY CONFIGURATION MODE"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-[#00f2ff]/30 bg-[#00f2ff]/5 text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] hover:bg-[#00f2ff]/10 hover:shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all h-10 px-6"
          >
            <RefreshCw className="h-4 w-4 mr-2 animate-[spin_3s_linear_infinite]" />
            Reload
          </Button>
          <Button 
            onClick={handleSaveConfig} 
            disabled={saving} 
            className="bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all h-10 px-6"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "SYNCING..." : "COMMIT CHANGES"}
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-lg text-sm border",
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        )}>
          {feedback.type === "success"
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle   className="h-4 w-4 flex-shrink-0" />
          }
          {feedback.msg}
        </div>
      )}

      {/* ── Hotel Details ─────────────────────────────────────────────────────── */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Hotel Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Hotel Name</Label>
              <Input
                value={config.hotelName}
                onChange={e => setConfig({ ...config, hotelName: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={config.city ?? ""}
                onChange={e => setConfig({ ...config, city: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={config.country ?? ""}
                onChange={e => setConfig({ ...config, country: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={config.phone ?? ""}
                onChange={e => setConfig({ ...config, phone: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={config.email ?? ""}
                onChange={e => setConfig({ ...config, email: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <Label>Total Rooms</Label>
              <Input
                type="number"
                value={config.totalRooms}
                onChange={e => setConfig({ ...config, totalRooms: parseInt(e.target.value) || 0 })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Total Floors</Label>
              <Input
                type="number"
                value={config.totalFloors}
                onChange={e => setConfig({ ...config, totalFloors: parseInt(e.target.value) || 0 })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Check-in Time</Label>
              <Input
                type="time"
                value={config.checkInTime}
                onChange={e => setConfig({ ...config, checkInTime: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Check-out Time</Label>
              <Input
                type="time"
                value={config.checkOutTime}
                onChange={e => setConfig({ ...config, checkOutTime: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <Label>Currency</Label>
              <Input
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxRate ?? ""}
                onChange={e => setConfig({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
            <div>
              <Label>Service Charge (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.serviceCharge ?? ""}
                onChange={e => setConfig({ ...config, serviceCharge: parseFloat(e.target.value) || 0 })}
                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <Label>Room Number Format</Label>
            <Input
              value={config.roomNumberFormat}
              onChange={e => setConfig({ ...config, roomNumberFormat: e.target.value })}
              className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 font-mono"
            />
            <p className="text-xs text-[#5C6270] mt-1">
              Use {"{floor}"} and {"{number}"} — e.g. {"{floor}"}-{"{number}"} → 1-001
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Active Modules ────────────────────────────────────────────────────── */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Active Modules</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-xs text-[#5C6270] mb-4">
            Toggle which departments and features are visible in the dashboard for this hotel.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODULES.map(mod => {
              const active = config.modules[mod.key] ?? false
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => setConfig({
                    ...config,
                    modules: { ...config.modules, [mod.key]: !active }
                  })}
                  className={cn(
                    "px-3 py-3 rounded-lg border text-left transition-all text-sm group/btn",
                    active
                      ? "bg-[#00f2ff]/20 border-[#00f2ff]/60 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)] shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                      : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 hover:!bg-[#00f2ff]/10"
                  )}
                >
                  <span className="block font-medium">{mod.label}</span>
                  <span className="text-[11px] mt-0.5 block opacity-70">
                    {active ? "Enabled" : "Disabled"}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Outlets & Venues ──────────────────────────────────────────────────── */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10 border-b border-[#00f2ff]/10 pb-3 mb-2">
          <div>
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Outlets & Venues</CardTitle>
            <p className="text-xs text-[#5C6270] mt-1">
              Each outlet is saved to the database immediately. Changes to name/type auto-save on blur.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSyncAllTables}
              disabled={syncing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync Tables"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddOutlet}
              className="bg-emerald-600 hover:bg-emerald-700 text-[#8E939D]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Outlet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.25)] mb-4">
            ⚠ Deleting an outlet removes it from all dashboards. Active orders must be closed first.
          </p>

          <div className="space-y-3">
            {outlets.length === 0 ? (
              <div className="text-center py-12 text-[#5C6270] border border-dashed border-[#00f2ff]/20 rounded-lg">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">No outlets yet</p>
                <p className="text-xs mt-1">Click "Add Outlet" to create your first restaurant or bar</p>
              </div>
            ) : (
              outlets.map(outlet => (
                <div
                  key={outlet.id}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-[#00f2ff]/10 pb-6 mb-6 last:mb-0 last:pb-0 last:border-0 transition-all duration-300",
                    outlet._isNew   && "bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/30 -mx-4 w-[calc(100%+2rem)]",
                    outlet._isDirty && "bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 -mx-4 w-[calc(100%+2rem)]"
                  )}
                >
                  {/* Name + Type — col 1-3 */}
                  <div className="md:col-span-3 space-y-2">
                    <div>
                      <Label className="text-[11px] text-[#8E939D]">Name</Label>
                      <Input
                        value={outlet.name}
                        onChange={e => updateOutletLocal(outlet.id, "name", e.target.value)}
                        onBlur={() => saveOutlet(outlet)}
                        className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 text-sm"
                        placeholder="Outlet name"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-[#8E939D]">Type</Label>
                      <select
                        value={outlet.type}
                        onChange={e => {
                          updateOutletLocal(outlet.id, "type", e.target.value as OutletType)
                          // Save immediately on type change
                          setTimeout(() => saveOutlet({ ...outlet, type: e.target.value as OutletType, _isDirty: true }), 0)
                        }}
                        className="w-full text-sm bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 rounded-md text-slate-300 px-3 py-2 h-10 focus:outline-none focus:border-[#00f2ff]"
                      >
                        {OUTLET_TYPES.map(t => (
                          <option key={t.value} value={t.value} className="bg-[#0a0c10]">{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status + Hours — col 4-5 */}
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <Label className="text-[11px] text-[#8E939D]">Status</Label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = outlet.status === "active" ? "inactive" : "active"
                          updateOutletLocal(outlet.id, "status", next)
                          saveOutlet({ ...outlet, status: next, _isDirty: true })
                        }}
                        className={cn(
                          "w-full h-10 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest border transition-all duration-300",
                          outlet.status === "active"
                            ? "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/60 shadow-[0_0_15px_rgba(0,242,255,0.2)] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]"
                            : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30"
                        )}
                      >
                        {outlet.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-[#8E939D]">Opens</Label>
                        <Input
                          type="time"
                          value={outlet.openingTime ?? ""}
                          onChange={e => updateOutletLocal(outlet.id, "openingTime", e.target.value)}
                          onBlur={() => saveOutlet(outlet)}
                          className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#8E939D]">Closes</Label>
                        <Input
                          type="time"
                          value={outlet.closingTime ?? ""}
                          onChange={e => updateOutletLocal(outlet.id, "closingTime", e.target.value)}
                          onBlur={() => saveOutlet(outlet)}
                          className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table config — col 6-9 */}
                  <div className="md:col-span-4">
                    {["restaurant", "bar", "cafe"].includes(outlet.type) ? (
                      <div>
                        <Label className="text-xs text-[#8E939D] mb-1 block">Table Configuration</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "2-Seat", field: "twoSeatTables"  as keyof OutletRow },
                            { label: "4-Seat", field: "fourSeatTables" as keyof OutletRow },
                            { label: "6-Seat", field: "sixSeatTables"  as keyof OutletRow },
                          ].map(({ label, field }) => (
                            <div key={field}>
                              <Label className="text-[10px] text-[#5C6270]">{label}</Label>
                              <Input
                                type="number"
                                min={0}
                                value={(outlet[field] as number) ?? 0}
                                onChange={e => updateOutletLocal(outlet.id, field, parseInt(e.target.value) || 0)}
                                onBlur={() => saveOutlet(outlet)}
                                className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center h-full text-xs text-[#5C6270] pt-2">
                        {outlet.type === "room-service" && "Room service — no tables needed"}
                        {outlet.type === "banquet"      && "Banquet — event spaces configured separately"}
                      </div>
                    )}
                  </div>

                  {/* Actions + status indicator — col 10-12 */}
                  <div className="md:col-span-3 flex justify-end items-start gap-2 pt-1">
                    {outlet._isDirty && (
                      <span className="text-[10px] text-amber-400 self-center">unsaved</span>
                    )}
                    {outlet._isNew && (
                      <span className="text-[10px] text-emerald-400 self-center">new</span>
                    )}
                    <span className="text-[10px] text-slate-600 font-mono self-center">
                      {outlet.id.substring(0, 8)}…
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setOutletToDelete(outlet); setDeleteDialog(true) }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* KPI Settings */}
          <div className="mt-6 pt-6 border-t border-[#00f2ff]/20">
            <h4 className="text-sm font-semibold text-slate-300 mb-1">F&B KPI Tracking</h4>
            <p className="text-xs text-[#5C6270] mb-4">
              Choose which KPIs appear in the restaurant dashboard for this hotel.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KPI_OPTIONS.map(item => {
                const active = config.outletKpiSettings[item.key as keyof OutletKpiSettings]
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      outletKpiSettings: {
                        ...config.outletKpiSettings,
                        [item.key]: !active,
                      },
                    })}
                    className={cn(
                      "px-3 py-3 rounded-lg border text-left text-sm transition-all",
                      active
                        ? "bg-[#00f2ff]/20 border-[#00f2ff]/60 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)] shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                        : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 hover:!bg-[#00f2ff]/10"
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Preview ───────────────────────────────────────────────────────────── */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-[#00f2ff]/10 pb-3 mb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Preview</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Room Configuration</h3>
              <p className="text-sm text-[#8E939D]">
                {config.totalRooms} rooms across {config.totalFloors} floors ={" "}
                ~{Math.floor(config.totalRooms / (config.totalFloors || 1))} rooms per floor
              </p>
              <div className="mt-4 p-4 bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-lg group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-all duration-300">
                <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] mb-3 group-hover:text-[#00f2ff]/70 transition-colors">Sample room numbers:</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(floor => (
                    <div key={floor} className="text-center">
                      <div className="text-[8px] uppercase tracking-widest text-[#5C6270]">Floor {floor}</div>
                      <div className="text-xs font-mono font-bold text-slate-300 group-hover:text-[#00f2ff] transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">
                        {config.roomNumberFormat
                          .replace("{floor}", floor.toString())
                          .replace("{number}", "001")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Outlet Summary</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Outlets",  value: outlets.length,                                              color: "text-[#8E939D]" },
                  { label: "Active",         value: outlets.filter(o => o.status === "active").length,           color: "text-emerald-400" },
                  { label: "Restaurants",    value: outlets.filter(o => o.type === "restaurant").length,         color: "text-[#8E939D]" },
                  { label: "Bars / Cafés",   value: outlets.filter(o => ["bar","cafe"].includes(o.type)).length, color: "text-[#8E939D]" },
                  { label: "Room Service",   value: outlets.filter(o => o.type === "room-service").length,       color: "text-[#8E939D]" },
                  { label: "Banquet",        value: outlets.filter(o => o.type === "banquet").length,            color: "text-[#8E939D]" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-[#8E939D]">{row.label}:</span>
                    <span className={cn("font-medium", row.color)}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
