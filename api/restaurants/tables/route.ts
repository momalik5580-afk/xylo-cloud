// src/app/api/restaurants/tables/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value
    || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const outletId = searchParams.get('outletId')

  const where: any = { hotel_id: payload.hotel_id, is_active: true }
  if (outletId) where.outlet_id = outletId

  try {
    // Step 1: Get tables
    const tables = await prisma.restaurant_tables.findMany({
      where,
      orderBy: [{ section: 'asc' }, { table_number: 'asc' }],
      include: {
        outlets: { select: { id: true, name: true, type: true } },
        users:   { select: { first_name: true, last_name: true } },
      }
    })

    // Step 1b: Fetch active restaurant reservations for these tables
    // This is what links a table to a dining guest so POS can auto-fill
    const tableIds = tables.map(t => t.id)
    let restResMap = new Map<string, any>()

    if (tableIds.length > 0) {
      const activeRestRes = await prisma.restaurant_reservations.findMany({
        where: {
          table_id: { in: tableIds },
          status:   { in: ['confirmed', 'CONFIRMED', 'seated', 'SEATED', 'reserved', 'RESERVED'] },
        },
        include: {
          guests: {
            select: {
              id: true, first_name: true, last_name: true,
              is_vip: true, loyalty_tier: true,
            }
          }
        },
        orderBy: { reservation_date: 'asc' },
      })

      // Map table_id → most relevant reservation (seated wins over confirmed)
      for (const r of activeRestRes) {
        if (!r.table_id) continue
        const existing = restResMap.get(r.table_id)
        const priority = (s: string) => ['seated', 'SEATED'].includes(s) ? 2 : 1
        if (!existing || priority(r.status) > priority(existing.status)) {
          restResMap.set(r.table_id, r)
        }
      }

      // For reservations linked to hotel guests, fetch their active hotel reservation
      // so POS can do room charge with the correct hotel reservation_id
      const guestIds = [...restResMap.values()]
        .map(r => r.guest_id)
        .filter(Boolean) as string[]

      if (guestIds.length > 0) {
        const hotelReservations = await prisma.reservations.findMany({
          where: {
            guest_id: { in: guestIds },
            hotel_id: payload.hotel_id,
            status:   'CHECKED_IN',
          },
          include: {
            rooms: { select: { room_number: true, type: true, floor: true } }
          }
        })
        const hotelResMap = new Map(hotelReservations.map(r => [r.guest_id, r]))

        // Attach hotel reservation to each restaurant reservation
        for (const [tableId, rr] of restResMap.entries()) {
          if (rr.guest_id) {
            restResMap.set(tableId, {
              ...rr,
              hotel_reservation: hotelResMap.get(rr.guest_id) ?? null,
            })
          }
        }
      }
    }

    // Step 2: Get FNB orders for occupied tables
    const orderIds = tables.map(t => t.current_order_id).filter(Boolean) as string[]
    const ordersMap = new Map<string, any>()

    if (orderIds.length > 0) {
      const orders = await prisma.fnb_orders.findMany({
        where: { id: { in: orderIds } },
        include: {
          reservations: {
            include: {
              rooms: { select: { room_number: true, type: true, floor: true } }
            }
          },
          fnb_order_items: {
            include: {
              menu_items: { select: { name: true, price: true } }
            }
          }
        }
      })

      const guestIds2 = orders.map(o => o.guest_id).filter(Boolean) as string[]
      const guestsMap = new Map<string, any>()

      if (guestIds2.length > 0) {
        const guests = await prisma.guests.findMany({
          where: { id: { in: guestIds2 } },
          select: {
            id: true, first_name: true, last_name: true,
            phone: true, email: true, is_vip: true,
            loyalty_tier: true, nationality: true,
          }
        })
        guests.forEach(g => guestsMap.set(g.id, g))
      }

      orders.forEach(o => ordersMap.set(o.id, { ...o, guestProfile: guestsMap.get(o.guest_id ?? '') ?? null }))
    }

    // Shape response
    const shaped = tables.map(t => {
      const order   = t.current_order_id ? ordersMap.get(t.current_order_id) : null
      const guest   = order?.guestProfile ?? null
      const room    = order?.reservations?.rooms ?? null
      const restRes = restResMap.get(t.id) ?? null

      return {
        id:                 t.id,
        table_number:       t.table_number,
        section:            t.section,
        capacity:           t.capacity,
        min_capacity:       t.min_capacity,
        status:             t.status,
        current_guests:     t.current_guests     ?? 0,
        current_guest_name: t.current_guest_name ?? null,
        current_order_id:   t.current_order_id   ?? null,
        outlet_id:          t.outlet_id,
        outlets:            t.outlets,
        server: t.users ? { name: `${t.users.first_name} ${t.users.last_name}` } : null,

        // Active restaurant reservation for this table (used by POS to auto-link)
        reservation: restRes ? {
          id:           restRes.id,
          guest_name:   restRes.guest_name,
          party_size:   restRes.party_size,
          status:       restRes.status,
          occasion:     restRes.occasion,
          special_requests: restRes.special_requests,
          // The hotel guest profile (if linked)
          guest: restRes.guests ? {
            id:           restRes.guests.id,
            name:         `${restRes.guests.first_name} ${restRes.guests.last_name}`,
            is_vip:       restRes.guests.is_vip,
            loyalty_tier: restRes.guests.loyalty_tier,
          } : null,
          // The hotel room reservation (needed for room charge in POS)
          hotel_reservation: restRes.hotel_reservation ? {
            id:          restRes.hotel_reservation.id,
            room_number: restRes.hotel_reservation.rooms?.room_number ?? null,
            room_type:   restRes.hotel_reservation.rooms?.type        ?? null,
          } : null,
        } : null,

        order: order ? {
          id:               order.id,
          order_number:     order.order_number,
          status:           order.status,
          type:             order.type,
          total_amount:     Number(order.total_amount),
          guest_count:      order.guest_count,
          placed_at:        order.placed_at,
          special_requests: order.special_requests,
          items: (order.fnb_order_items ?? []).map((i: any) => ({
            name:     i.menu_items?.name ?? 'Unknown',
            price:    Number(i.menu_items?.price ?? 0),
            quantity: i.quantity,
          })),
        } : null,
        guest: guest ? {
          id:           guest.id,
          name:         `${guest.first_name} ${guest.last_name}`,
          phone:        guest.phone,
          email:        guest.email,
          is_vip:       guest.is_vip,
          loyalty_tier: guest.loyalty_tier,
          nationality:  guest.nationality,
        } : null,
        room: room ? {
          number: room.room_number,
          type:   room.type,
          floor:  room.floor,
        } : null,
      }
    })

    return NextResponse.json({ tables: shaped })
  } catch (e: any) {
    console.error('GET /api/restaurants/tables error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const { tableId, status, currentGuests, currentGuestName, currentServerId } = await req.json()
    if (!tableId) return NextResponse.json({ error: 'tableId required' }, { status: 400 })

    const existing = await prisma.restaurant_tables.findFirst({
      where: { id: tableId, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const table = await prisma.restaurant_tables.update({
      where: { id: tableId },
      data: {
        ...(status           != null && { status }),
        ...(currentGuests    != null && { current_guests: currentGuests }),
        ...(currentGuestName != null && { current_guest_name: currentGuestName }),
        ...(currentServerId  != null && { current_server_id: currentServerId }),
        ...(status === 'AVAILABLE' && {
          current_guests: 0, current_guest_name: null,
          current_order_id: null, current_server_id: null,
        }),
      },
      include: { outlets: { select: { id: true, name: true } } }
    })

    broadcastToHotel(payload.hotel_id, {
      type: 'table_status',
      payload: {
        tableId: table.id, tableNumber: table.table_number,
        outletId: table.outlet_id, oldStatus: existing.status,
        newStatus: status, updatedAt: new Date().toISOString(),
      }
    })

    return NextResponse.json({ table })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
