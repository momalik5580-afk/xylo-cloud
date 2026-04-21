import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "full"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Fetch data based on report type
    let reportData: any = {}

    switch (type) {
      case "tasks":
        reportData = await prisma.tasks.findMany({
          where: {
            created_at: { 
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          },
          include: {
            departments: true, // FIXED: Use plural relation name
            users_tasks_assigned_to_idTousers: {  // FIXED: Use explicit Prisma relation name
              select: { 
                first_name: true, 
                last_name: true,  
                email: true 
              },
            },
          },
          orderBy: { created_at: "desc" }, 
        })
        break

      case "inventory":
        reportData = await prisma.inventory_items.findMany({
          include: { departments: true },
          orderBy: { alert_status: "asc" }, 
        })
        break

      case "staff":
        reportData = await prisma.users.findMany({
          where: { is_active: true }, 
          include: {
            departments_users_department_idTodepartments: true, // FIXED: Explicit Prisma relation
            roles: true, // FIXED: Use plural relation name
            _count: {
              select: { 
                tasks_tasks_assigned_to_idTousers: true  // FIXED: Explicit relation for assigned tasks
              },
            },
          },
        })
        break

      default:
        // Full report summary
        const [tasks, users, departments, inventory] = await Promise.all([
          prisma.tasks.count(),
          prisma.users.count({ where: { is_active: true } }), 
          prisma.departments.count(), 
          prisma.inventory_items.count(), 
        ])

        reportData = {
          summary: { tasks, users, departments, inventory },
          generatedAt: new Date().toISOString(),
        }
    }

    // For now, return JSON. In production, you'd generate a PDF here.
    return NextResponse.json(reportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="report-${type}.json"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}