// src/app/api/restaurants/kds/route.ts
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
  const stationId   = searchParams.get('stationId')
  const outletId    = searchParams.get('outletId')    // filter by restaurant outlet
  const statusParam = searchParams.get('status') ?? 'pending,in_progress'
  const statuses    = statusParam.split(',').map(s => s.trim())

  const where: any = {
    hotel_id: payload.hotel_id,
    status:   { in: statuses },
  }
  if (stationId) where.station_id = stationId

  // Filter by outlet: kitchen orders linked to fnb_orders of this outlet
  // OR room service orders directed to this outlet (source = outlet name)
  if (outletId) {
    const outlet = await prisma.outlets.findFirst({
      where: { id: outletId, hotel_id: payload.hotel_id },
      select: { name: true }
    })
    if (outlet) {
      where.OR = [
        // Orders linked to fnb_orders from this outlet
        {
          fnb_order_id: {
            in: await prisma.fnb_orders.findMany({
              where: { outlet_id: outletId, hotel_id: payload.hotel_id },
              select: { id: true }
            }).then(rows => rows.map(r => r.id))
          }
        },
        // Room service orders directed to this outlet by source name
        { source: outlet.name, source_type: 'ROOM_SERVICE' },
      ]
    }
  }

  try {
    const [rawOrders, stations] = await Promise.all([
      prisma.kitchen_orders.findMany({
        where,
        orderBy: [
          // VIP and high priority first
          { is_vip: 'desc' },
          { priority: 'desc' },
          { order_time: 'asc' },
        ],
        include: {
          kitchen_order_items: { orderBy: { sort_order: 'asc' } },
          kitchen_stations:    { select: { id: true, name: true, station_type: true, status: true } },
          users:               { select: { first_name: true, last_name: true } },
        }
      }),
      prisma.kitchen_stations.findMany({
        where:   outletId
          ? { hotel_id: payload.hotel_id, outlet_id: outletId }
          : { hotel_id: payload.hotel_id },
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, station_type: true,
          capacity: true, current_load: true,
          staff_required: true, staff_assigned: true,
          status: true, outlet_id: true,
        }
      })
    ])

    const now = Date.now()
    const orders = rawOrders.map(o => {
      const elapsedMin = Math.floor((now - new Date(o.order_time).getTime()) / 60000)
      return {
        id:                  o.id,
        ticket_number:       o.ticket_number,
        fnb_order_id:        o.fnb_order_id,
        source:              o.source,
        source_type:         o.source_type,
        guest_name:          o.guest_name,
        guest_id:            o.guest_id,
        room_number:         o.room_number,
        is_vip:              o.is_vip         ?? false,
        vip_level:           o.vip_level,
        priority:            o.priority,
        status:              o.status,
        order_time:          o.order_time,
        started_at:          o.started_at,
        completed_at:        o.completed_at,
        estimated_time:      o.estimated_time,
        allergy:             o.allergy         ?? [],
        notes:               o.notes,
        chef_assigned_name:  o.chef_assigned_name,
        kitchen_stations:    o.kitchen_stations,
        kitchen_order_items: o.kitchen_order_items.map(i => ({
          id:                   i.id,
          name:                 i.name,
          quantity:             i.quantity,
          station_type:         i.station_type,
          prep_time:            i.prep_time,
          special_instructions: i.special_instructions,
          status:               i.status,
        })),
        chef_name:       o.users ? `${o.users.first_name} ${o.users.last_name}` : null,
        elapsed_minutes: elapsedMin,
        is_urgent:       elapsedMin > 20 && o.status !== 'completed',
        is_late:         elapsedMin > 30 && o.status !== 'completed',
        // Flag so KDS can show a delivery badge
        is_room_service: o.source_type === 'ROOM_SERVICE',
      }
    })

    const summary = {
      pending:      orders.filter(o => o.status === 'pending').length,
      in_progress:  orders.filter(o => o.status === 'in_progress').length,
      urgent:       orders.filter(o => o.is_urgent).length,
      room_service: orders.filter(o => o.is_room_service).length,
      avgWait:      orders.length
        ? Math.round(orders.reduce((s, o) => s + o.elapsed_minutes, 0) / orders.length)
        : 0,
    }

    return NextResponse.json({ orders, stations, summary })
  } catch (e: any) {
    console.error('KDS GET error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const { fnbOrderId, source, sourceType, guestName, guestId, roomNumber, isVip, priority, stationId, notes, allergy, items, estimatedTime } = body

    if (!guestName) return NextResponse.json({ error: 'guestName is required' }, { status: 400 })

    const ticketCount  = await prisma.kitchen_orders.count({ where: { hotel_id: payload.hotel_id } })
    const ticketNumber = `TICKET-${String(ticketCount + 1).padStart(6, '0')}`

    const order = await prisma.kitchen_orders.create({
      data: {
        fnb_order_id:   fnbOrderId    || null,
        ticket_number:  ticketNumber,
        source:         source        || 'restaurant',
        source_type:    sourceType    || 'DINE_IN',
        guest_name:     guestName,
        guest_id:       guestId       || null,
        room_number:    roomNumber    || null,
        is_vip:         isVip         || false,
        priority:       priority      || 'normal',
        station_id:     stationId     || null,
        notes:          notes         || null,
        allergy:        allergy       || [],
        estimated_time: estimatedTime || null,
        status:         'pending',
        hotel_id:       payload.hotel_id,
        kitchen_order_items: items?.length ? {
          create: items.map((item: any, idx: number) => ({
            menu_item_id:         item.menuItemId          || null,
            name:                 item.name,
            quantity:             item.quantity             || 1,
            station_type:         item.stationType          || 'general',
            prep_time:            item.prepTime             || null,
            special_instructions: item.specialInstructions  || null,
            status:               'pending',
            sort_order:           idx,
          }))
        } : undefined,
      },
      include: { kitchen_order_items: true }
    })

    broadcastToHotel(payload.hotel_id, {
      type:    'kitchen_order',
      payload: { action: 'created', orderId: order.id, ticketNumber, priority, guestName }
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (e: any) {
    console.error('KDS POST error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
