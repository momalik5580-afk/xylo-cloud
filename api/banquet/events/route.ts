import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all banquet events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const roomId = searchParams.get("roomId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (status) where.status = status
    if (roomId) where.banquet_room_id = roomId
    if (startDate && endDate) {
      where.start_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const events = await prisma.event_bookings.findMany({
      where,
      include: {
        banquet_rooms: true,  // Fixed: was banquetRoom
        event_add_ons: true,  // Fixed: was eventAddOns
      },
      orderBy: { start_date: "asc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching banquet events:", error)
    return NextResponse.json(
      { error: "Failed to fetch banquet events" },
      { status: 500 }
    )
  }
}

// POST create new banquet event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      banquet_room_id,
      guest_id,
      organizer_name,
      organizer_email,
      organizer_phone,
      company,
      event_name,
      event_type,
      setup,
      guest_count,
      start_date,
      end_date,
      setup_time,
      teardown_time,
      meal_plan,
      menu_selection,
      av_requirements,
      decor_requirements,
      total_amount,
      deposit_amount,
      notes,
      event_add_ons,
      hotel_id,
    } = body

    // Validate required fields
    if (!banquet_room_id || !organizer_name || !event_name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const event = await prisma.event_bookings.create({
      data: {
        banquet_room_id,
        guest_id: guest_id || null,
        organizer_name,
        organizer_email: organizer_email || null,
        organizer_phone: organizer_phone || null,
        company: company || null,
        event_name,
        event_type: event_type || null,
        setup: setup || null,
        guest_count: guest_count || null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        setup_time: setup_time ? new Date(setup_time) : null,
        teardown_time: teardown_time ? new Date(teardown_time) : null,
        meal_plan: meal_plan || null,
        menu_selection: menu_selection || null,
        av_requirements: av_requirements || null,
        decor_requirements: decor_requirements || null,
        total_amount: total_amount ? parseFloat(total_amount) : null,
        deposit_amount: deposit_amount ? parseFloat(deposit_amount) : null,
        deposit_paid: false,
        notes: notes || null,
        contract_signed: false,
        hotel_id: hotel_id || null,
        created_by_id: null, // Add if you have user session
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        banquet_rooms: true,  // Fixed: was banquetRoom
        event_add_ons: true,  // Fixed: was eventAddOns
      },
    })

    // Create add-ons if provided
    if (event_add_ons && event_add_ons.length > 0) {
      await prisma.event_add_ons.createMany({
        data: event_add_ons.map((addon: any) => ({
          event_id: event.id,
          name: addon.name,
          quantity: addon.quantity || 1,
          unit_price: parseFloat(addon.unit_price),
          total: parseFloat(addon.total),
          notes: addon.notes || null,
        })),
      })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Error creating banquet event:", error)
    return NextResponse.json(
      { error: "Failed to create banquet event" },
      { status: 500 }
    )
  }
}