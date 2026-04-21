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
      <Card className="border border-slate-800/60 bg-slate-900/80 flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
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
  const trendColor = s.trend === "up" ? "text-emerald-400" : s.trend === "down" ? "text-red-400" : "text-slate-400"

  return (
    <Card className="border border-slate-800/60 bg-slate-900/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#8E939D] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Guest Sentiment
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
              <span className="text-3xl font-bold text-[#8E939D]">{s.rating || "—"}</span>
              <span className="text-sm text-slate-500">/5</span>
            </div>
            {s.trendValue > 0 && (
              <div className="flex items-center gap-1">
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
                <span className={cn("text-sm font-medium", trendColor)}>
                  {s.trend === "up" ? "+" : "-"}{s.trendValue}%
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500">{s.totalReviews} reviews</span>
        </div>

        {/* Score bars */}
        {(s.scores.service > 0 || s.scores.cleanliness > 0 || s.scores.food > 0) && (
          <div className="space-y-2">
            {[
              { label: "Service",     val: s.scores.service,     color: "#10b981" },
              { label: "Cleanliness", val: s.scores.cleanliness, color: "#3b82f6" },
              { label: "Food",        val: s.scores.food,        color: "#f59e0b" },
            ].map((sc) => (
              <div key={sc.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20">{sc.label}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(sc.val / 5) * 100}%`, backgroundColor: sc.color }} />
                </div>
                <span className="text-xs font-medium text-slate-300 w-6">{sc.val || "—"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Keywords */}
        {(s.keywords.positive.length > 0 || s.keywords.negative.length > 0) && (
          <div>
            <h4 className="text-xs font-medium text-slate-400 mb-2">Keyword Clusters</h4>
            <div className="flex flex-wrap gap-1.5">
              {s.keywords.positive.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{kw}</Badge>
              ))}
              {s.keywords.negative.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{kw}</Badge>
              ))}
            </div>
          </div>
        )}

        {s.totalReviews === 0 && (
          <div className="p-3 rounded-lg bg-slate-800/40 text-center">
            <p className="text-xs text-slate-500">No guest feedback yet</p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
