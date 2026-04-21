import { NextResponse } from "next/server"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function GET() {
  try {
    // Get reservations with resort_id
    const reservations = await prisma.reservations.findMany({
      where: {
        hotel_id: RESORT_ID,
        status: {
          in: ["CHECKED_IN", "CONFIRMED", "CHECKED_OUT"]
        }
      },
      orderBy: { created_at: "asc" },
      take: 20,
    })

    // Format the response
    const formatted = reservations.map((r) => ({
      id: r.id,
      status: r.status,
      check_in_date: r.created_at,
      check_out_date: null,
      actual_check_out: null,
      special_requests: r.notes || null,
      guest: {
        id: r.guest_id,
        first_name: `Guest ${r.guest_id}`,
        last_name: "",
        is_vip: false,
        loyalty_tier: null,
        nationality: null,
      },
      room: {
        room_number: null,
        floor: null,
        type: null,
      },
    }))

    return NextResponse.json({ vips: formatted, reservations: formatted })
  } catch (error) {
    console.error("VIP API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch VIP guests" },
      { status: 500 }
    )
  }
}