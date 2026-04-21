// src/app/api/fnb/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/fnb/orders?status=PENDING&outletId=xxx&today=true
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const outletId = searchParams.get('outletId')
  const today    = searchParams.get('today') === 'true'
  const active   = searchParams.get('active') === 'true'
  const page     = parseInt(searchParams.get('page')  || '1')
  const limit    = parseInt(searchParams.get('limit') || '30')

  const where: any = { hotel_id: payload.hotel_id }
  if (status)   where.status    = status
  if (outletId) where.outlet_id = outletId
  if (today)    where.placed_at = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  if (active)   where.status    = { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] }

  const [orders, total] = await Promise.all([
    prisma.fnb_orders.findMany({
      where,
      orderBy: { placed_at: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        fnb_order_items: {
          include: { menu_items: { select: { name: true, price: true } } },
        },
        restaurant_tables_fnb_orders_table_idTorestaurant_tables: {
          select: { table_number: true, section: true }
        },
        users:   { select: { first_name: true, last_name: true } },
        outlets: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.fnb_orders.count({ where }),
  ])

  // Summary counts for this hotel today
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
  const [pending, preparing, ready, delivered, todayRevenue] = await Promise.all([
    prisma.fnb_orders.count({ where: { hotel_id: payload.hotel_id, status: 'PENDING' } }),
    prisma.fnb_orders.count({ where: { hotel_id: payload.hotel_id, status: 'PREPARING' } }),
    prisma.fnb_orders.count({ where: { hotel_id: payload.hotel_id, status: 'READY' } }),
    prisma.fnb_orders.count({ where: { hotel_id: payload.hotel_id, status: 'DELIVERED' } }),
    prisma.fnb_orders.aggregate({
      where:   { hotel_id: payload.hotel_id, placed_at: { gte: todayStart } },
      _sum:    { total_amount: true },
      _count:  { id: true },
      _avg:    { total_amount: true },
    }),
  ])

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    summary: {
      pending, preparing, ready, delivered,
      todayRevenue:  Number(todayRevenue._sum.total_amount ?? 0),
      todayOrders:   todayRevenue._count.id,
      todayAvgCheck: Number(todayRevenue._avg.total_amount ?? 0),
    }
  })
}

// POST /api/fnb/orders — place new order
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const { tableId, guestId, reservationId, outletId, type, items, guestCount, specialRequests, notes } = body

    if (!items?.length) return NextResponse.json({ error: 'items are required' }, { status: 400 })
    if (!outletId)      return NextResponse.json({ error: 'outletId is required' }, { status: 400 })

    // Verify outlet belongs to this hotel
    const outlet = await prisma.outlets.findFirst({
      where: { id: outletId, hotel_id: payload.hotel_id }
    })
    if (!outlet) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await prisma.menu_items.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem) continue
      const totalPrice = Number(menuItem.price) * item.quantity
      subtotal += totalPrice
      orderItems.push({
        menu_item_id:  item.menuItemId,
        quantity:      item.quantity,
        unit_price:    menuItem.price,
        total_price:   totalPrice,
        notes:         item.notes         || null,
        modifications: item.modifications || null,
        status:        'PENDING',
      })
    }

    // Use hotel tax/service charge from hotels table if available, else defaults
    const hotelData = await prisma.hotels.findUnique({
      where: { id: payload.hotel_id },
      select: { tax_rate: true, service_charge: true }
    })
    const taxRate      = Number(hotelData?.tax_rate      ?? 14) / 100
    const serviceRate  = Number(hotelData?.service_charge ?? 12) / 100
    const taxAmount    = subtotal * taxRate
    const serviceCharge = subtotal * serviceRate
    const totalAmount  = subtotal + taxAmount + serviceCharge

    const order = await prisma.fnb_orders.create({
      data: {
        table_id:         tableId         || null,
        guest_id:         guestId         || null,
        reservation_id:   reservationId   || null,
        outlet_id:        outletId,
        hotel_id:         payload.hotel_id,
        type:             type            || 'DINE_IN',
        status:           'PENDING',
        subtotal,
        tax_amount:       taxAmount,
        service_charge:   serviceCharge,
        total_amount:     totalAmount,
        guest_count:      guestCount      || 1,
        special_requests: specialRequests || null,
        notes:            notes           || null,
        served_by_id:     payload.userId,
        fnb_order_items: { create: orderItems as any },
      },
      include: {
        fnb_order_items: { include: { menu_items: { select: { name: true } } } },
        restaurant_tables_fnb_orders_table_idTorestaurant_tables: { select: { table_number: true } },
        outlets: { select: { name: true } },
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
