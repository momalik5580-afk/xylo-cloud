import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // FIXED: departments (plural) instead of department
    const departments = await prisma.departments.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
            work_orders: true,  // FIXED: snake_case
            inventory_items: true,  // FIXED: snake_case (not "inventory")
            incidents: true,
          },
        },
      },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}