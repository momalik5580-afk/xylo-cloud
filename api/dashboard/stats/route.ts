// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    // ── ROOMS ──────────────────────────────────────────────────────
    // Fix: Use hotel_id instead of resort field
    const allRooms = await prisma.rooms.findMany({
      where: { hotel_id: RESORT_ID }
    })
    const totalRooms    = allRooms.length
    const occupiedRooms = allRooms.filter(r => r.status === "OCCUPIED").length
    const vacantRooms   = allRooms.filter(r => r.status === "AVAILABLE").length
    const dirtyRooms    = allRooms.filter(r => r.status === "DIRTY").length
    const oooRooms      = allRooms.filter(r => r.status === "MAINTENANCE" || r.status === "OUT_OF_ORDER").length
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    // ── WORK ORDERS ────────────────────────────────────────────────
    const allWOs = await prisma.work_orders.findMany({
      where: { hotel_id: RESORT_ID }
    })
    const openWOs      = allWOs.filter(w => w.status === "OPEN" || w.status === "ASSIGNED" || w.status === "IN_PROGRESS").length
    const urgentWOs    = allWOs.filter(w => w.priority === "URGENT" && w.status !== "COMPLETED").length
    const completedWOs = allWOs.filter(w => w.status === "COMPLETED").length

    // ── USERS / STAFF ──────────────────────────────────────────────
    const totalStaff = await prisma.users.count({
      where: { hotel_id: RESORT_ID, is_active: true }
    })

    // ── DEPARTMENTS ────────────────────────────────────────────────
    const depts = await prisma.departments.findMany()
    const engDept = depts.find(d => d.code === "ENGINEERING")
    const hkDept  = depts.find(d => d.code === "HOUSEKEEPING")
    const kitDept = depts.find(d => d.code === "KITCHEN")
    const secDept = depts.find(d => d.code === "SECURITY")

    const engWOs = allWOs.filter(w => w.department_id === engDept?.id && w.status !== "COMPLETED")
    const hkWOs  = allWOs.filter(w => w.department_id === hkDept?.id  && w.status !== "COMPLETED")
    const kitWOs = allWOs.filter(w => w.department_id === kitDept?.id && w.status !== "COMPLETED")
    const secWOs = allWOs.filter(w => w.department_id === secDept?.id && w.status !== "COMPLETED")

    // ── RECENT WORK ORDERS ──────────────────────────────
    const recentWOs = await prisma.work_orders.findMany({
      where:   { hotel_id: RESORT_ID },
      orderBy: { created_at: "desc" },
      take:    10,
    })

    const recentTasks = recentWOs.map(wo => ({
      id:         `WO-${wo.id}`,
      title:      wo.description ?? wo.wo_number,
      status:     wo.status ?? "OPEN",
      priority:   wo.priority ?? "ROUTINE",
      created_at: wo.created_at?.toISOString() ?? new Date().toISOString(),
      departments: { name: depts.find(d => d.id === wo.department_id)?.name ?? "General" },
      assignedTo:  null,
    }))

    // ── FLOOR BREAKDOWN ────────────────────────────────────────────
    const floors = Array.from(new Set(allRooms.map(r => r.floor).filter(Boolean))).sort()
    const floorStats = floors.slice(0, 5).map(floor => ({
      floor,
      total:    allRooms.filter(r => r.floor === floor).length,
      occupied: allRooms.filter(r => r.floor === floor && r.status === "OCCUPIED").length,
      vacant:   allRooms.filter(r => r.floor === floor && r.status === "AVAILABLE").length,
      dirty:    allRooms.filter(r => r.floor === floor && r.status === "DIRTY").length,
    }))

    return NextResponse.json({
      occupancyRate,
      adr:          0,
      revenue:      0,
      activeAlerts: urgentWOs,
      staffOnDuty:  totalStaff,

      rooms: {
        total:    totalRooms,
        occupied: occupiedRooms,
        vacant:   vacantRooms,
        dirty:    dirtyRooms,
        ooo:      oooRooms,
        occupancyRate,
        floorStats,
      },

      recentTasks,

      departments: [
        {
          id: "1", code: "HK", name: "Housekeeping",
          stats: { openWorkOrders: hkWOs.length, criticalIssues: hkWOs.filter(w => w.priority === "URGENT").length, activeTasks: hkWOs.length, partsStock: 0 }
        },
        {
          id: "2", code: "ENG", name: "Engineering",
          stats: { openWorkOrders: engWOs.length, criticalIssues: engWOs.filter(w => w.priority === "URGENT").length, activeTasks: engWOs.length, partsStock: 0 }
        },
        {
          id: "3", code: "FNB", name: "F&B",
          stats: { openWorkOrders: kitWOs.length, criticalIssues: kitWOs.filter(w => w.priority === "URGENT").length, activeTasks: kitWOs.length, partsStock: 0 }
        },
        {
          id: "4", code: "SEC", name: "Security",
          stats: { openWorkOrders: secWOs.length, criticalIssues: secWOs.filter(w => w.priority === "URGENT").length, activeTasks: secWOs.length, partsStock: 0 }
        },
      ],

      inventoryAlerts: [],
      vipArrivals:     { inHouse: 0, arriving: 0, departing: 0, total: 0 },
      guestSentiment:  { rating: 0, totalReviews: 0, trend: "up", trendValue: 0 },

      stats: {
        attentionNeeded: urgentWOs,
        onTrack:         completedWOs,
        critical:        urgentWOs,
        normal:          openWOs,
        several:         0,
      }
    })

  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}