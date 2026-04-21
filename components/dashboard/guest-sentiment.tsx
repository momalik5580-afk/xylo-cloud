"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Star, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sentiment {
  rating: number
  trend: "up" | "down" | "flat"
  trendValue: number
  totalReviews: number
  keywords: { positive: string[]; negative: string[] }
  scores: { service: number; cleanliness: number; food: number }
}

export function GuestSentiment() {
  const [data,    setData]    = useState<Sentiment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard/sentiment")
        const json = await res.json()
        if (!json.error) setData(json)
      } catch (e) {
        console.error("GuestSentiment:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 120_000)
    return () => clearInterval(iv)
  }, [])

  if (loading) {
    return (
      <Card className="border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden flex items-center justify-center h-48">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <Loader2 className="h-5 w-5 animate-spin text-[#5C6270] relative z-10" />
      </Card>
    )
  }

  // Fallback if no reviews yet
  const s = data ?? {
    rating: 0, trend: "flat" as const, trendValue: 0, totalReviews: 0,
    keywords: { positive: [], negative: [] },
    scores: { service: 0, cleanliness: 0, food: 0 },
  }

  const TrendIcon = s.trend === "up" ? TrendingUp : s.trend === "down" ? TrendingDown : Minus
  const trendColor = s.trend === "up" ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]" : s.trend === "down" ? "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]" : "text-[#8E939D]"

  return (
    <Card className="border border-[#00f2ff]/15 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group cursor-default relative overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)] flex items-center gap-2 group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">
            <Sparkles className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
            Guest Sentiment
          </CardTitle>
          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)] drop-shadow-[0_0_8px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between relative z-10">

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-8 w-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
              <span className="text-3xl font-bold text-[#8E939D] drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{s.rating || "—"}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C6270] mt-3">/5</span>
            </div>
            {s.trendValue > 0 && (
              <div className="flex items-center gap-1 bg-[#0a0c10] border border-[#00f2ff]/15 px-2 py-1 rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:border-[#00f2ff]/30 hover:shadow-[0_0_10px_rgba(0,242,255,0.2)] transition-all">
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
                <span className={cn("text-[10px] uppercase font-bold tracking-widest", trendColor)}>
                  {s.trend === "up" ? "+" : "-"}{s.trendValue}%
                </span>
              </div>
            )}
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{s.totalReviews} REVIEWS</span>
        </div>

        {/* Score bars */}
        {(s.scores.service > 0 || s.scores.cleanliness > 0 || s.scores.food > 0) && (
          <div className="space-y-3">
            {[
              { label: "SERVICE",     val: s.scores.service,     color: "#0ea5e9", shadow: "0 0 10px rgba(14,165,233,0.8)", textClass: "text-[#0ea5e9] drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]" },
              { label: "CLEANLINESS", val: s.scores.cleanliness, color: "#00f2ff", shadow: "0 0 10px rgba(0,242,255,0.8)", textClass: "text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" },
              { label: "FOOD",        val: s.scores.food,        color: "#f59e0b", shadow: "0 0 10px rgba(245,158,11,0.8)", textClass: "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" },
            ].map((sc) => (
              <div key={sc.label} className="flex items-center gap-3 group p-2 rounded-lg bg-[#0a0c10] border border-[#00f2ff]/15 group-hover:bg-[#00f2ff]/5 group-hover:border-[#00f2ff]/30 transition-colors shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                <span className={`text-[9px] font-bold uppercase tracking-widest w-24 group-hover:text-[#00f2ff] transition-colors text-[#5C6270]`}>{sc.label}</span>
                <div className="flex-1 h-1.5 bg-[#0a0c10] border border-[#00f2ff]/15 rounded-full overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(sc.val / 5) * 100}%`, backgroundColor: sc.color, boxShadow: sc.shadow }} />
                </div>
                <span className={`text-[9px] font-bold tracking-widest w-6 text-right ${sc.textClass}`}>{sc.val || "—"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Keywords */}
        {(s.keywords.positive.length > 0 || s.keywords.negative.length > 0) && (
          <div className="pt-3 border-t border-[#00f2ff]/10">
            <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] mb-3 group-hover:text-[#00f2ff] transition-colors">KEYWORD CLUSTERS</h4>
            <div className="flex flex-wrap gap-2">
              {s.keywords.positive.map((kw) => (
                <Badge key={kw} variant="outline" className="text-[8px] tracking-widest uppercase font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)] hover:shadow-[0_0_12px_rgba(52,211,153,0.5)] hover:bg-emerald-500/20 transition-all cursor-default drop-shadow-[0_0_5px_rgba(52,211,153,0.2)]">{kw}</Badge>
              ))}
              {s.keywords.negative.map((kw) => (
                <Badge key={kw} variant="outline" className="text-[8px] tracking-widest uppercase font-bold bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(248,113,113,0.2)] hover:shadow-[0_0_12px_rgba(248,113,113,0.5)] hover:bg-red-500/20 transition-all cursor-default drop-shadow-[0_0_5px_rgba(248,113,113,0.2)]">{kw}</Badge>
              ))}
            </div>
          </div>
        )}

        {s.totalReviews === 0 && (
          <div className="p-4 rounded-lg bg-[#0a0c10] border border-[#00f2ff]/10 border-dashed text-center shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] hover:border-[#00f2ff]/30 hover:shadow-[0_0_10px_rgba(0,242,255,0.1)] transition-all">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">NO GUEST FEEDBACK YET</p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
