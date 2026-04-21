// src/app/api/roomservice/orders/route.ts
// Room service orders — food delivery to rooms
// Flow: room_service_order → fnb_order (ROOM_SERVICE) → kitchen_order (KDS) → delivery
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// vip_level constraint: only 'platinum'|'gold'|'silver'|null allowed
const VIP_MAP: Record<string, string> = {
  PLATINUM: 'platinum', GOLD: 'gold', SILVER: 'silver',
  platinum: 'platinum', gold: 'gold', silver: 'silver',
}

export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page   = parseInt(searchParams.get('page')  || '1')
  const limit  = parseInt(searchParams.get('limit') || '50')

  const where: any = { hotel_id: payload.hotel_id }
  if (status) where.status = status

  try {
    const [orders, total] = await Promise.all([
      prisma.room_service_orders.findMany({
        where,
        orderBy: { placed_at: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          room_service_order_items: {
            include: { menu_items: { select: { name: true, price: true } } },
          },
          users_room_service_orders_delivery_staff_idTousers: {
            select: { first_name: true, last_name: true }
          },
        },
      }),
      prisma.room_service_orders.count({ where }),
    ])

    const [pending, preparing, confirmed, ready, delivered] = await Promise.all([
      prisma.room_service_orders.count({ where: { hotel_id: payload.hotel_id, status: 'PENDING'   } }),
      prisma.room_service_orders.count({ where: { hotel_id: payload.hotel_id, status: 'PREPARING' } }),
      prisma.room_service_orders.count({ where: { hotel_id: payload.hotel_id, status: 'CONFIRMED' } }),
      prisma.room_service_orders.count({ where: { hotel_id: payload.hotel_id, status: 'READY'     } }),
      prisma.room_service_orders.count({ where: { hotel_id: payload.hotel_id, status: 'DELIVERED' } }),
    ])

    return NextResponse.json({
      orders, total, page, limit,
      pages: Math.ceil(total / limit),
      summary: { pending, preparing, confirmed, ready, delivered }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const {
      roomId, room_number, guestId, reservationId,
      items, specialRequests, deliveryNotes, paymentMethod,
      outletId,  // which restaurant is fulfilling this
    } = body

    if (!room_number) return NextResponse.json({ error: 'room_number required' }, { status: 400 })
    if (!items?.length) return NextResponse.json({ error: 'items required' }, { status: 400 })
    if (!outletId) return NextResponse.json({ error: 'outletId required — select a restaurant' }, { status: 400 })

    // Verify outlet belongs to this hotel
    const outlet = await prisma.outlets.findFirst({
      where: { id: outletId, hotel_id: payload.hotel_id }
    })
    if (!outlet) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    // Hotel tax rates
    const hotel = await prisma.hotels.findUnique({
      where: { id: payload.hotel_id },
      select: { tax_rate: true, service_charge: true }
    })
    const taxRate = Number(hotel?.tax_rate ?? 5) / 100

    // Resolve menu items and build order items
    let subtotal = 0
    const resolvedItems: { menuItem: any; quantity: number; notes: string | null }[] = []
    for (const item of items) {
      const menuItem = await prisma.menu_items.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem) continue
      const lineTotal = Number(menuItem.price) * item.quantity
      subtotal += lineTotal
      resolvedItems.push({ menuItem, quantity: item.quantity, notes: item.notes || null })
    }
    if (resolvedItems.length === 0) return NextResponse.json({ error: 'No valid menu items' }, { status: 400 })

    const deliveryFee  = 15
    const taxAmount    = subtotal * taxRate
    const totalAmount  = subtotal + deliveryFee + taxAmount

    // VIP info
    let isVip    = false
    let vipLevel: string | null = null
    let guestName = `Room ${room_number}`
    if (guestId) {
      const guest = await prisma.guests.findUnique({
        where: { id: guestId },
        select: { is_vip: true, loyalty_tier: true, first_name: true, last_name: true }
      })
      if (guest) {
        isVip     = guest.is_vip ?? false
        vipLevel  = guest.loyalty_tier ? (VIP_MAP[guest.loyalty_tier] ?? null) : null
        guestName = `${guest.first_name} ${guest.last_name}`
      }
    }

    // Payment method enum mapping
    const PAY_MAP: Record<string, string> = {
      ROOM_CHARGE: 'ROOM_CHARGE', room_charge: 'ROOM_CHARGE',
      CASH: 'CASH', cash: 'CASH',
      CREDIT_CARD: 'CREDIT_CARD', card: 'CREDIT_CARD',
    }
    const payEnum = PAY_MAP[paymentMethod ?? 'ROOM_CHARGE'] ?? 'ROOM_CHARGE'

    // ── Step 1: Create fnb_order (type ROOM_SERVICE) on the restaurant outlet ──
    // This is what the kitchen sees on their KDS
    const fnbOrder = await prisma.fnb_orders.create({
      data: {
        outlet_id:        outletId,
        hotel_id:         payload.hotel_id,
        guest_id:         guestId          || null,
        reservation_id:   reservationId    || null,
        type:             'ROOM_SERVICE',
        status:           'PENDING',
        subtotal,
        tax_amount:       taxAmount,
        service_charge:   0,           // no service charge for room service
        total_amount:     totalAmount,
        paid_amount:      0,
        payment_method:   payEnum as any,
        guest_count:      1,
        special_requests: specialRequests  || null,
        notes:            `Room Service → Room ${room_number}`,
        served_by_id:     null,
        placed_at:        new Date(),
        fnb_order_items: {
          create: resolvedItems.map(r => ({
            menu_item_id: r.menuItem.id,
            quantity:     r.quantity,
            unit_price:   r.menuItem.price,
            total_price:  Number(r.menuItem.price) * r.quantity,
            notes:        r.notes,
            status:       'PENDING',
          }))
        }
      }
    })

    // ── Step 2: Create kitchen_order ticket so it appears on the restaurant KDS ──
    const ticketCount  = await prisma.kitchen_orders.count({ where: { hotel_id: payload.hotel_id } })
    const ticketNumber = `RS-${String(ticketCount + 1).padStart(5, '0')}`

    const kitchenOrder = await prisma.kitchen_orders.create({
      data: {
        fnb_order_id:   fnbOrder.id,
        ticket_number:  ticketNumber,
        source:         outlet.name,
        source_type:    'ROOM_SERVICE',
        guest_name:     guestName,
        guest_id:       guestId    || null,
        room_number,
        is_vip:         isVip,
        vip_level:      vipLevel,
        priority:       isVip ? 'high' : 'medium',
        notes:          specialRequests || null,
        allergy:        [],
        status:         'pending',
        hotel_id:       payload.hotel_id,
        kitchen_order_items: {
          create: resolvedItems.map((r, idx) => ({
            menu_item_id:         r.menuItem.id,
            name:                 r.menuItem.name,
            quantity:             r.quantity,
            station_type:         'general',
            prep_time:            r.menuItem.preparation_time ?? null,
            special_instructions: r.notes,
            status:               'pending',
            sort_order:           idx,
          }))
        }
      }
    })

    // ── Step 3: Create room_service_order linked to fnb_order ──
    const rsOrder = await prisma.room_service_orders.create({
      data: {
        room_id:          roomId          || null,
        room_number,
        guest_id:         guestId         || null,
        reservation_id:   reservationId   || null,
        status:           'PENDING',
        subtotal,
        delivery_fee:     deliveryFee,
        tax_amount:       taxAmount,
        total_amount:     totalAmount,
        payment_method:   payEnum as any,
        special_requests: specialRequests || null,
        delivery_notes:   deliveryNotes   || null,
        is_vip:           isVip,
        vip_level:        vipLevel,
        hotel_id:         payload.hotel_id,
        // Embed fnb_order_id in delivery_notes for KDS→RS sync
        // Format: "fnb:<id>" so we can extract it precisely
        delivery_notes: `fnb:${fnbOrder.id}`,
        room_service_order_items: {
          create: resolvedItems.map(r => ({
            menu_item_id: r.menuItem.id,
            quantity:     r.quantity,
            unit_price:   r.menuItem.price,
            total_price:  Number(r.menuItem.price) * r.quantity,
            notes:        r.notes,
          }))
        }
      },
      include: {
        room_service_order_items: {
          include: { menu_items: { select: { name: true } } }
        }
      }
    })

    // Broadcast to both room service and kitchen
    broadcastToHotel(payload.hotel_id, {
      type: 'room_service',
      payload: {
        action:        'new_order',
        rsOrderId:     rsOrder.id,
        fnbOrderId:    fnbOrder.id,
        kitchenTicket: ticketNumber,
        roomNumber:    room_number,
        outletId,
        outletName:    outlet.name,
        isVip,
        guestName,
      }
    })

    broadcastToHotel(payload.hotel_id, {
      type:    'kitchen_order',
      payload: {
        action:       'created',
        orderId:      kitchenOrder.id,
        ticketNumber,
        priority:     kitchenOrder.priority,
        guestName,
        sourceType:   'ROOM_SERVICE',
        roomNumber:   room_number,
      }
    })

    return NextResponse.json({
      order:         rsOrder,
      fnbOrderId:    fnbOrder.id,
      kitchenTicket: ticketNumber,
      outletName:    outlet.name,
    }, { status: 201 })
  } catch (e: any) {
    console.error('Room service POST error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
