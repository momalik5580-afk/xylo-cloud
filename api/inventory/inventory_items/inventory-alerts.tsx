"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, AlertTriangle, AlertOctagon, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryItem {
  id: string
  sku: string
  name: string
  department?: { name: string }
  alertStatus: "LOW_STOCK" | "CRITICAL" | "OUT_OF_STOCK"
  quantity: number
  minimumQuantity: number
}

const statusConfig = {
  LOW_STOCK:    { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10",  border: "border-amber-500/20", label: "Low Stock" },
  CRITICAL:     { icon: AlertOctagon,  color: "text-red-400",   bg: "bg-red-500/10",    border: "border-red-500/20",   label: "Critical"  },
  OUT_OF_STOCK: { icon: AlertOctagon,  color: "text-red-500",   bg: "bg-red-500/20",    border: "border-red-500/30",   label: "Out of Stock" },
}

export function InventoryAlerts() {
  const [alerts,  setAlerts]  = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/inventory")
        const json = await res.json()
        if (json.inventoryAlerts) setAlerts(json.inventoryAlerts)
      } catch (e) {
        console.error("InventoryAlerts:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  return (
    <Card className="border border-slate-800/60 bg-slate-900/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#8E939D]">Key Inventory Alerts</CardTitle>
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            : <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">{alerts.length} Alerts</Badge>
          }
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 p-4 pt-0">
            {!loading && alerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No inventory alerts</p>
            )}
            {alerts.map((item) => {
              const cfg  = statusConfig[item.alertStatus] ?? statusConfig.LOW_STOCK
              const Icon = cfg.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-lg",
                    cfg.bg, cfg.border
                  )}
                >
                  <div className={cn("p-2 rounded-lg bg-slate-950/30", cfg.color)}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#8E939D] truncate">{item.name}</p>
                      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.color)} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{item.department?.name ?? "—"}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className={cn("text-xs font-medium", cfg.color)}>
                        {item.quantity} / {item.minimumQuantity} {cfg.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
