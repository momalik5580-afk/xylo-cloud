import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get feedback with resort_id
    let feedback = []
    try {
      feedback = await prisma.guest_feedback.findMany({
        where: { 
          overall_score: { not: null },
          hotel_id: RESORT_ID
        },
        orderBy: { created_at: "desc" },
        take: 200,
      })
    } catch (e) {
      console.log("Guest feedback table not available yet")
      return NextResponse.json({
        rating: 0,
        trend: "up",
        trendValue: 0,
        totalReviews: 0,
        keywords: { positive: [], negative: [] },
        scores: { service: 0, cleanliness: 0, food: 0 }
      })
    }

    const recent = feedback.filter(
      (f) => f.created_at && new Date(f.created_at) >= thirtyDaysAgo
    )
    const prev = feedback.filter(
      (f) => f.created_at && new Date(f.created_at) < thirtyDaysAgo
    )

    const avg = (arr: typeof feedback) => {
      const valid = arr.filter((f) => f.overall_score !== null)
      if (!valid.length) return 0
      return valid.reduce((s, f) => s + (f.overall_score ?? 0), 0) / valid.length
    }

    const currentRating = avg(recent.length ? recent : feedback)
    const prevRating = avg(prev)

    const trendValue = prevRating
      ? parseFloat((((currentRating - prevRating) / prevRating) * 100).toFixed(1))
      : 0

    // Keyword analysis
    const positiveWords = ["excellent", "great", "good", "clean", "staff", "service", "comfortable", "amazing", "perfect"]
    const negativeWords = ["slow", "wait", "noise", "dirty", "cold", "bad", "disappointing", "broken"]

    const wordFreq: Record<string, number> = {}
    feedback.forEach((f) => {
      if (!f.comment) return
      const lower = f.comment.toLowerCase()
      ;[...positiveWords, ...negativeWords].forEach((w) => {
        if (lower.includes(w)) wordFreq[w] = (wordFreq[w] || 0) + 1
      })
    })

    const topPositive = positiveWords
      .filter((w) => wordFreq[w])
      .sort((a, b) => (wordFreq[b] || 0) - (wordFreq[a] || 0))
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))

    const topNegative = negativeWords
      .filter((w) => wordFreq[w])
      .sort((a, b) => (wordFreq[b] || 0) - (wordFreq[a] || 0))
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))

    // Score breakdown
    const serviceAvg = feedback.filter(f => f.service_score !== null).reduce((s, f) => s + (f.service_score ?? 0), 0) / 
                      (feedback.filter(f => f.service_score !== null).length || 1)
    const cleanAvg = feedback.filter(f => f.cleanliness_score !== null).reduce((s, f) => s + (f.cleanliness_score ?? 0), 0) / 
                     (feedback.filter(f => f.cleanliness_score !== null).length || 1)
    const foodAvg = feedback.filter(f => f.food_score !== null).reduce((s, f) => s + (f.food_score ?? 0), 0) / 
                    (feedback.filter(f => f.food_score !== null).length || 1)

    return NextResponse.json({
      rating: parseFloat(currentRating.toFixed(1)),
      trend: trendValue >= 0 ? "up" : "down",
      trendValue: Math.abs(trendValue),
      totalReviews: feedback.length,
      keywords: { positive: topPositive, negative: topNegative },
      scores: {
        service: parseFloat(serviceAvg.toFixed(1)),
        cleanliness: parseFloat(cleanAvg.toFixed(1)),
        food: parseFloat(foodAvg.toFixed(1)),
      },
    })
  } catch (error) {
    console.error("Sentiment error:", error)
    return NextResponse.json(
      { error: "Failed to fetch sentiment" },
      { status: 500 }
    )
  }
}