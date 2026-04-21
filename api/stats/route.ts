import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      attentionNeeded,
      onTrack,
      critical,
      normal,
      several,
    ] = await Promise.all([
      // Attention Needed: High/Critical priority tasks that are open or in progress
      prisma.tasks.count({  // FIXED: tasks (plural)
        where: {
          priority: { in: ["HIGH", "CRITICAL"] },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      // On Track: In progress tasks that haven't breached SLA
      prisma.tasks.count({  // FIXED: tasks (plural)
        where: {
          status: "IN_PROGRESS",
          sla_breached: false,  // FIXED: snake_case
        },
      }),
      // Critical: Urgent tasks or SLA breached
      prisma.tasks.count({  // FIXED: tasks (plural)
        where: {
          OR: [
            { sla_breached: true },  // FIXED: snake_case
            { status: "URGENT" },
          ],
        },
      }),
      // Normal: Low/Medium priority open tasks
      prisma.tasks.count({  // FIXED: tasks (plural)
        where: {
          priority: { in: ["LOW", "MEDIUM"] },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      // Several: Ready tasks
      prisma.tasks.count({  // FIXED: tasks (plural)
        where: { status: "READY" },
      }),
    ])

    return NextResponse.json({
      stats: {
        attentionNeeded,
        onTrack,
        critical,
        normal,
        several,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}