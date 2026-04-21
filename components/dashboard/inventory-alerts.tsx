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
  LOW_STOCK:    { icon: AlertTriangle, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]", bg: "bg-amber-500/5",  border: "border-amber-500/20", label: "LOW STOCK", shadow: "shadow-[inset_0_0_10px_rgba(251,191,36,0.05)]" },
  CRITICAL:     { icon: AlertOctagon,  color: "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]",   bg: "bg-red-500/5",    border: "border-red-500/30",   label: "CRITICAL", shadow: "shadow-[inset_0_0_10px_rgba(248,113,113,0.1)]"  },
  OUT_OF_STOCK: { icon: AlertOctagon,  color: "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",   bg: "bg-red-500/10",    border: "border-red-500/40",   label: "OUT OF STOCK", shadow: "shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]" },
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
    <Card className="border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] h-full flex flex-col relative overflow-hidden group hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Key Inventory Alerts</CardTitle>
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin text-[#00f2ff]/40" />
            : <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">{alerts.length} ALERTS</Badge>
          }
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 relative z-10">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4 pt-0">
            {!loading && alerts.length === 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] text-center py-4">NO INVENTORY ALERTS</p>
            )}
            {alerts.map((item) => {
              const cfg  = statusConfig[item.alertStatus] ?? statusConfig.LOW_STOCK
              const Icon = cfg.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group/item flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300",
                    "bg-[#00f2ff]/5 border-[#00f2ff]/15 shadow-[0_4px_10px_rgba(0,0,0,0.5)]",
                    "group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 group-hover:shadow-[0_4px_10px_rgba(0,0,0,0.5)]",
                    "hover:!border-[#00f2ff]/50 hover:!shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  )}
                >
                  <div className={cn("p-2 rounded-md bg-[#0a0c10] border border-[#00f2ff]/15 shadow-[0_4px_10px_rgba(0,0,0,0.5)]", cfg.color)}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold tracking-wide text-[#8E939D] truncate group-hover:text-[#00f2ff]/70 group-hover/item:text-[#00f2ff] transition-colors">{item.name}</p>
                      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0 animate-pulse", cfg.color)} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{item.department?.name ?? "—"}</span>
                      <span className="text-[9px] text-[#5C6270]">/</span>
                      <span className={cn("text-[8px] font-bold uppercase tracking-widest", cfg.color)}>
                        {item.quantity} / {item.minimumQuantity} {cfg.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#5C6270] group-hover/item:text-[#00f2ff] transition-colors" />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
