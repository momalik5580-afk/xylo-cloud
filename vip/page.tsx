"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store"
import { VIPDashboard } from "@/components/vip/vip-dashboard"
import { Crown, RefreshCw } from "lucide-react"

export default function VIPPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <main className="flex-1 flex flex-col overflow-hidden p-5 gap-4 min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Crown className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#8E939D]">VIP Guest Dashboard</h1>
            <p className="text-xs text-slate-400">
              Personalized service tracking · Concierge management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Full VIP Dashboard — fills remaining space */}
      <div className="flex-1 min-h-0">
        <VIPDashboard />
      </div>
    </main>
  )
}
