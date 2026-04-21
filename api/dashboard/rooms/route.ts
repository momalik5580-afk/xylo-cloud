import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    // Get rooms with resort_id
    const rooms = await prisma.rooms.findMany({
      where: { 
        hotel_id: RESORT_ID
      },
      orderBy: { room_number: "asc" }
    })

    // Get active reservations
    const activeReservations = await prisma.reservations.findMany({
      where: {
        hotel_id: RESORT_ID,
        status: "CHECKED_IN"
      }
    })

    // Map reservations to rooms
    const roomData = rooms.map(room => {
      const activeReservation = activeReservations.find(
        r => r.room_id === room.id
      )
      
      return {
        id: room.id,
        number: room.room_number,
        floor: room.floor,
        type: room.type,
        status: room.status,
        guest: activeReservation ? `Guest ${activeReservation.guest_id}` : null,
        checkOut: null
      }
    })

    return NextResponse.json({ rooms: roomData })
  } catch (error) {
    console.error("Rooms API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}