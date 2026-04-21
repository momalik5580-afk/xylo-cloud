// app/api/frontdesk/rooms/route.ts

import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== ROOMS API CALLED ===")
    console.log("RESORT_ID:", RESORT_ID)
    
    // Check if prisma is connected
    const roomCount = await prisma.rooms.count()
    console.log("Total rooms in database:", roomCount)
    
    // Count with resort filter
    const filteredCount = await prisma.rooms.count({
      where: { resort: RESORT_ID }
    })
    console.log("Rooms with resort = XYLO_HRG:", filteredCount)
    
    // Get all rooms without filter first
    const allRooms = await prisma.rooms.findMany({
      take: 5 // Just get 5 for testing
    })
    console.log("Sample rooms:", JSON.stringify(allRooms, null, 2))
    
    // Now get filtered rooms
    const rooms = await prisma.rooms.findMany({
      where: {
        resort: RESORT_ID
      },
      select: {
        room_number: true,
        room_type: true,
        floor: true,
        room_status: true,
        front_office_status: true,
        active_yn: true,
        resort: true
      }
    })
    
    console.log("Filtered rooms found:", rooms.length)
    
    // Format for frontend
    const formattedRooms = rooms.map(room => ({
      id: room.room_number,
      room_number: room.room_number,
      floor: room.floor ? parseInt(room.floor) : 1,
      status: room.front_office_status || room.room_status || "AVAILABLE",
      type: room.room_type,
      reservations: []
    }))

    return NextResponse.json({ 
      rooms: formattedRooms,
      debug: {
        totalRooms: roomCount,
        filteredCount: filteredCount,
        resortId: RESORT_ID,
        sampleRoom: rooms[0] || null
      }
    })
  } catch (error) {
    console.error("ERROR:", error)
    return NextResponse.json({ 
      error: "Failed", 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}