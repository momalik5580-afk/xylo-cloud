import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    // Get total rooms - use resort_id
    const totalRooms = await prisma.rooms.count({
      where: { hotel_id: RESORT_ID }
    })
    
    // Get occupied rooms
    const occupiedRooms = await prisma.rooms.count({
      where: { 
        hotel_id: RESORT_ID,
        status: "OCCUPIED"
      }
    })

    // Available rooms
    const availableRooms = await prisma.rooms.count({
      where: { 
        hotel_id: RESORT_ID,
        status: "AVAILABLE"
      }
    })

    // Dirty rooms
    const dirtyRooms = await prisma.rooms.count({
      where: { 
        hotel_id: RESORT_ID,
        status: "DIRTY"
      }
    })

    // Maintenance rooms
    const maintenanceRooms = await prisma.rooms.count({
      where: { 
        hotel_id: RESORT_ID,
        status: { in: ["MAINTENANCE", "OUT_OF_ORDER"] }
      }
    })

    // Occupancy rate
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    // VIP guests
    const vipGuests = await prisma.reservations.count({
      where: {
        hotel_id: RESORT_ID,
        status: "CHECKED_IN"
      }
    })

    // Get work orders for tasks
    const pendingTasks = await prisma.work_orders.count({
      where: {
        hotel_id: RESORT_ID,
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] }
      }
    })

    // Get incidents
    let criticalIncidents = 0
    try {
      criticalIncidents = await prisma.incidents.count({
        where: {
          hotel_id: RESORT_ID,
          status: "OPEN"
        }
      })
    } catch (e) {
      console.log("Incidents table not available")
    }

    return NextResponse.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        dirty: dirtyRooms,
        maintenance: maintenanceRooms,
        occupancyRate
      },
      revenue: {
        today: 0,
        monthly: 0,
        adr: 0,
        revpar: 0
      },
      operations: {
        pendingTasks,
        criticalIncidents,
        vipGuests
      }
    })
  } catch (error) {
    console.error("KPI stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch KPI stats" },
      { status: 500 }
    )
  }
}