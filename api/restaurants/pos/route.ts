// src/app/api/restaurants/pos/route.ts
// POS: Create orders, charge to room, cash/card payments — FIXED
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const tableId     = searchParams.get('tableId')
  const outletId    = searchParams.get('outletId')
  const guestSearch = searchParams.get('guestSearch')

  try {
    if (guestSearch) {
      const reservations = await prisma.reservations.findMany({
        where: {
          hotel_id: payload.hotel_id,
          status:   'CHECKED_IN',
          guests: {
            OR: [
              { first_name: { contains: guestSearch, mode: 'insensitive' } },
              { last_name:  { contains: guestSearch, mode: 'insensitive' } },
            ]
          }
        },
        include: {
          guests: { select: { id: true, first_name: true, last_name: true, is_vip: true, loyalty_tier: true } },
          rooms:  { select: { room_number: true, floor: true } },
        },
        take: 8,
      })

      const results = reservations
        .filter(r => r.guests)
        .map(r => ({
          id:             r.guests!.id,
          name:           `${r.guests!.first_name} ${r.guests!.last_name}`,
          is_vip:         r.guests!.is_vip,
          loyalty_tier:   r.guests!.loyalty_tier,
          reservation_id: r.id,
          room_number:    r.rooms?.room_number ?? '',
          room_type:      '',
          floor:          r.rooms?.floor ?? 0,
        }))

      return NextResponse.json({ guests: results })
    }

    if (tableId) {
      const table = await prisma.restaurant_tables.findFirst({
        where: { id: tableId, hotel_id: payload.hotel_id },
      })
      if (!table?.current_order_id) return NextResponse.json({ order: null })

      const order = await prisma.fnb_orders.findUnique({
        where: { id: table.current_order_id },
        include: {
          fnb_order_items: {
            include: { menu_items: { select: { name: true, price: true } } }
          }
        }
      })
      return NextResponse.json({ order })
    }

    if (outletId) {
      const [categories, items] = await Promise.all([
        prisma.menu_categories.findMany({
          where:   { outlet_id: outletId },
          orderBy: { sort_order: 'asc' },
        }),
        prisma.menu_items.findMany({
          where:   { outlet_id: outletId, is_available: true },
          orderBy: [{ category_id: 'asc' }, { name: 'asc' }],
          select: {
            id: true, name: true, price: true,
            category_id: true, is_halal: true, is_vegetarian: true,
            is_vegan: true, popular: true, vip_only: true,
            description: true,
            menu_categories: { select: { name: true } }
          }
        })
      ])
      return NextResponse.json({ categories, items })
    }

    return NextResponse.json({ error: 'Provide outletId, tableId, or guestSearch' }, { status: 400 })
  } catch (e: any) {
    console.error('POS GET error:', e.message)
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
      outletId, tableId, guestId, reservationId,
      diningReservationId,   // restaurant_reservation.id — links order to dining booking
      paymentMethod,
      items,
      guestCount, specialRequests, notes,
      roomNumber,
    } = body

    if (!outletId)      return NextResponse.json({ error: 'outletId required' }, { status: 400 })
    if (!paymentMethod) return NextResponse.json({ error: 'paymentMethod required' }, { status: 400 })
    if (!items?.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

    if (paymentMethod === 'charge_to_room' && (!guestId || !reservationId)) {
      return NextResponse.json({ error: 'Guest and reservation required for room charge' }, { status: 400 })
    }

    const hotel = await prisma.hotels.findUnique({
      where:  { id: payload.hotel_id },
      select: { tax_rate: true, service_charge: true }
    })
    const taxRate     = Number(hotel?.tax_rate      ?? 14) / 100
    const serviceRate = Number(hotel?.service_charge ?? 12) / 100

    let subtotal = 0
    const orderItems = []
    for (const item of items) {
      if (!item.menuItemId) continue
      const lineTotal = Number(item.unitPrice) * item.quantity
      subtotal += lineTotal
      orderItems.push({
        menu_item_id: item.menuItemId,
        quantity:     item.quantity,
        unit_price:   item.unitPrice,
        total_price:  lineTotal,
        notes:        item.notes || null,
        status:       'PENDING',
      })
    }
    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'No valid items with menu IDs' }, { status: 400 })
    }

    const taxAmount     = subtotal * taxRate
    const serviceCharge = subtotal * serviceRate
    const totalAmount   = subtotal + taxAmount + serviceCharge

    const paymentMethodEnum: Record<string, string> = {
      'cash':           'CASH',
      'card':           'CREDIT_CARD',
      'charge_to_room': 'ROOM_CHARGE',
    }
    const paymentMethodValue = paymentMethodEnum[paymentMethod] ?? 'CASH'

    // Create FNB order
    const order = await prisma.fnb_orders.create({
      data: {
        table_id:         tableId       || null,
        guest_id:         guestId       || null,
        reservation_id:   reservationId || null,
        outlet_id:        outletId,
        hotel_id:         payload.hotel_id,
        type:             'DINE_IN',
        status:           'DELIVERED',
        subtotal,
        tax_amount:       taxAmount,
        service_charge:   serviceCharge,
        total_amount:     totalAmount,
        paid_amount:      paymentMethod !== 'charge_to_room' ? totalAmount : 0,
        payment_method:   paymentMethodValue as any,
        guest_count:      guestCount    || 1,
        special_requests: specialRequests || null,
        notes:            notes          || null,
        served_by_id:     null,
        billed_at:        new Date(),
        served_at:        new Date(),
        fnb_order_items: { create: orderItems },
      },
      include: { fnb_order_items: true }
    })

    // ── Charge to room folio (non-fatal if folio schema differs) ───────────
    let folioCharge = null
    if (paymentMethod === 'charge_to_room' && reservationId && guestId) {
      const itemDescriptions = items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
      try {
        folioCharge = await prisma.folio_charges.create({
          data: {
            reservation_id: reservationId,
            guest_id:       guestId,
            description:    `Restaurant charge - ${itemDescriptions}`,
            category:       'RESTAURANT',
            amount:         subtotal,
            quantity:       1,
            unit_price:     subtotal,
            tax_amount:     taxAmount,
            service_charge: serviceCharge,
            total_amount:   totalAmount,
            reference_id:   order.id,
            reference_type: 'fnb_order',
            posted_by_id:   null,
            hotel_id:       payload.hotel_id,
            charge_date:    new Date(),
          }
        })
      } catch (folioErr: any) {
        console.error('Folio charge failed (non-fatal):', folioErr.message)
      }
    }

    // ── Free the table ─────────────────────────────────────────────────────
    if (tableId) {
      try {
        await prisma.restaurant_tables.update({
          where: { id: tableId },
          data: {
            status:             'AVAILABLE',
            current_guests:     0,
            current_guest_name: null,
            current_order_id:   null,
            current_server_id:  null,
          }
        })
      } catch (tableErr: any) {
        console.error('Table free failed (non-fatal):', tableErr.message)
      }

      // Mark the dining reservation as completed
      try {
        if (diningReservationId) {
          // Update by specific ID — most accurate
          await prisma.restaurant_reservations.update({
            where: { id: diningReservationId },
            data:  { status: 'completed', left_at: new Date() }
          })
        } else {
          // Fallback: update by table if no specific ID sent
          await prisma.restaurant_reservations.updateMany({
            where: {
              table_id: tableId,
              hotel_id: payload.hotel_id,
              status:   { in: ['seated', 'SEATED', 'confirmed', 'CONFIRMED'] },
            },
            data: { status: 'completed', left_at: new Date() }
          })
        }
      } catch (_) { /* non-fatal */ }
    }

    broadcastToHotel(payload.hotel_id, {
      type: 'table_status',
      payload: {
        tableId,
        action:  'payment_complete',
        method:  paymentMethod,
        total:   totalAmount,
        orderId: order.id,
      }
    })

    return NextResponse.json({
      success:    true,
      order,
      folioCharge,
      receipt: {
        subtotal:       subtotal.toFixed(2),
        tax:            taxAmount.toFixed(2),
        serviceCharge:  serviceCharge.toFixed(2),
        total:          totalAmount.toFixed(2),
        paymentMethod,
        roomNumber:     roomNumber || null,
        chargedToFolio: !!folioCharge,
      }
    }, { status: 201 })
  } catch (e: any) {
    console.error('POS POST error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
