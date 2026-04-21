import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get task counts by status
    const statusCounts = await prisma.tasks.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    })

    const status = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>)

    // Get task counts by priority
    const priorityCounts = await prisma.tasks.groupBy({
      by: ["priority"],
      _count: {
        priority: true,
      },
    })

    const priority = priorityCounts.reduce((acc, item) => {
      acc[item.priority] = item._count.priority
      return acc
    }, {} as Record<string, number>)

    // Get 7-day trend
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM tasks
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const completedDaily = await prisma.$queryRaw`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as count
      FROM tasks
      WHERE status = 'CLOSED' 
        AND updated_at >= ${sevenDaysAgo}
      GROUP BY DATE(updated_at)
      ORDER BY date ASC
    `

    // Format trend data
    const labels: string[] = []
    const created: number[] = []
    const completed: number[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const shortLabel = date.toLocaleDateString("en-US", { weekday: "short" })

      labels.push(shortLabel)

      const createdCount = (dailyStats as any[]).find(
        (d) => d.date.toISOString().split("T")[0] === dateStr
      )?.count || 0

      const completedCount = (completedDaily as any[]).find(
        (d) => d.date.toISOString().split("T")[0] === dateStr
      )?.count || 0

      created.push(Number(createdCount))
      completed.push(Number(completedCount))
    }

    return NextResponse.json({
      status,
      priority,
      trend: {
        labels,
        created,
        completed,
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}