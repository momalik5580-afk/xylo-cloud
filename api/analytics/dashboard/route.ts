import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30'

    const now = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(range))

    // Get room statistics - use resort_id
    const totalRooms = await prisma.rooms.count({
      where: { hotel_id: RESORT_ID }
    })
    
    const occupiedRooms = await prisma.rooms.count({
      where: { 
        hotel_id: RESORT_ID,
        status: "OCCUPIED"
      }
    })

    // Get reservation statistics
    const reservations = await prisma.reservations.findMany({
      where: {
        created_at: { gte: startDate },
        hotel_id: RESORT_ID
      }
    })

    const totalReservations = reservations.length
    const checkedIn = reservations.filter(r => r.status === "CHECKED_IN").length
    const confirmed = reservations.filter(r => r.status === "CONFIRMED").length
    const cancelled = reservations.filter(r => r.status === "CANCELLED").length

    // Calculate revenue (check if you have a rate field)
    const totalRevenue = 0

    // Get work orders
    const workOrders = await prisma.work_orders.findMany({
      where: {
        hotel_id: RESORT_ID,
        created_at: { gte: startDate }
      }
    })

    const completedTasks = workOrders.filter(w => w.status === "COMPLETED").length
    const pendingTasks = workOrders.filter(w => w.status !== "COMPLETED").length

    // Get guest feedback
    let avgRating = 0
    try {
      const feedback = await prisma.guest_feedback.aggregate({
        where: {
          created_at: { gte: startDate },
          hotel_id: RESORT_ID
        },
        _avg: {
          overall_score: true
        }
      })
      avgRating = feedback._avg?.overall_score || 0
    } catch (e) {
      console.log("Guest feedback table not available")
    }

    return NextResponse.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: totalRooms - occupiedRooms,
        occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
      },
      reservations: {
        total: totalReservations,
        checkedIn,
        confirmed,
        cancelled,
        revenue: totalRevenue
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        total: workOrders.length
      },
      guestSatisfaction: {
        avgRating,
        totalReviews: 0
      },
      period: {
        start: startDate,
        end: now,
        range: parseInt(range)
      }
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}