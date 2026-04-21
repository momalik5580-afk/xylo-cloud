// src/app/api/outlets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value
    || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

function normalizeType(type: string): string {
  return (type ?? 'restaurant').toLowerCase()
}

function mapOutlet(o: any) {
  return {
    id:             o.id,
    name:           o.name,
    code:           o.code,
    type:           normalizeType(o.type),
    status:         o.status      ?? 'active',
    is_active:      o.is_active   ?? true,
    description:    o.description ?? null,
    capacity:       o.capacity    ?? null,
    openingTime:    o.opening_time  ?? null,
    closingTime:    o.closing_time  ?? null,
    twoSeatTables:  o.two_seat_tables  ?? 0,
    fourSeatTables: o.four_seat_tables ?? 0,
    sixSeatTables:  o.six_seat_tables  ?? 0,
  }
}

// PATCH /api/outlets/[id]
// Update an outlet — only if it belongs to this hotel
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    // Ownership check — outlet must belong to this hotel
    const existing = await prisma.outlets.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    const body = await req.json()
    const {
      name, type, status,
      openingTime, closingTime,
      twoSeatTables, fourSeatTables, sixSeatTables,
      capacity, description,
    } = body

    // Validate time format before hitting the DB trigger
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (openingTime && !timeRegex.test(openingTime))
      return NextResponse.json({ error: 'openingTime must be HH:MM format' }, { status: 400 })
    if (closingTime && !timeRegex.test(closingTime))
      return NextResponse.json({ error: 'closingTime must be HH:MM format' }, { status: 400 })

    const outlet = await prisma.outlets.update({
      where: { id: params.id },
      data: {
        ...(name           != null && { name: name.trim() }),
        ...(type           != null && { type: normalizeType(type) }),
        ...(status         != null && { status }),
        ...(openingTime    != null && { opening_time:     openingTime }),
        ...(closingTime    != null && { closing_time:     closingTime }),
        ...(twoSeatTables  != null && { two_seat_tables:  twoSeatTables }),
        ...(fourSeatTables != null && { four_seat_tables: fourSeatTables }),
        ...(sixSeatTables  != null && { six_seat_tables:  sixSeatTables }),
        ...(capacity       != null && { capacity }),
        ...(description    != null && { description }),
        // updated_at is handled automatically by trigger_outlets_timestamp trigger
      }
    })

    return NextResponse.json({ outlet: mapOutlet(outlet) })
  } catch (e: any) {
    console.error('PATCH /api/outlets/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/outlets/[id]
// Soft-delete (set is_active = false) — safe because 5 tables have FK references to outlets:
//   fnb_orders         → NO ACTION  (cannot hard delete if orders exist)
//   restaurant_tables  → NO ACTION  (cannot hard delete if tables exist)
//   menu_categories    → NO ACTION  (cannot hard delete if categories exist)
//   menu_items         → NO ACTION  (cannot hard delete if items exist)
//   kitchen_stations   → ON DELETE SET NULL (safe)
//   staff_performance  → ON DELETE SET NULL (safe)
//
// Soft delete keeps all historical data intact and avoids FK violations.
// Use ?hard=true only when outlet has no related data (enforced by pre-check below).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    // Ownership check
    const existing = await prisma.outlets.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Check all FK-blocked tables before attempting hard delete
      const [orders, tables, categories, items] = await Promise.all([
        prisma.fnb_orders.count({ where: { outlet_id: params.id } }),
        prisma.restaurant_tables.count({ where: { outlet_id: params.id } }),
        prisma.menu_categories.count({ where: { outlet_id: params.id } }),
        prisma.menu_items.count({ where: { outlet_id: params.id } }),
      ])

      const blockers: string[] = []
      if (orders    > 0) blockers.push(`${orders} order(s)`)
      if (tables    > 0) blockers.push(`${tables} table(s)`)
      if (categories > 0) blockers.push(`${categories} menu category/categories`)
      if (items     > 0) blockers.push(`${items} menu item(s)`)

      if (blockers.length > 0) {
        return NextResponse.json({
          error: `Cannot permanently delete — outlet has: ${blockers.join(', ')}. Use soft delete instead.`,
          blockers: { orders, tables, categories, items },
        }, { status: 409 })
      }

      await prisma.outlets.delete({ where: { id: params.id } })
      return NextResponse.json({ success: true, deleted: 'permanent' })
    }

    // Default: soft delete — sets is_active = false, keeps all data
    await prisma.outlets.update({
      where: { id: params.id },
      data:  { is_active: false, status: 'inactive' }
    })

    return NextResponse.json({ success: true, deleted: 'soft' })
  } catch (e: any) {
    console.error('DELETE /api/outlets/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
