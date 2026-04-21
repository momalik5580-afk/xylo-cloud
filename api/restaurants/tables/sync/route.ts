// src/app/api/restaurants/tables/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value
    || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// POST /api/restaurants/tables/sync
// Called whenever outlet table counts change in settings.
// Creates missing table rows and deactivates removed ones.
// Body: { outletId }
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const { outletId } = await req.json()
    if (!outletId) return NextResponse.json({ error: 'outletId is required' }, { status: 400 })

    // Load outlet — verify it belongs to this hotel
    const outlet = await prisma.outlets.findFirst({
      where: { id: outletId, hotel_id: payload.hotel_id }
    })
    if (!outlet) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    // Only sync table-based outlets
    const tableTypes = ['restaurant', 'bar', 'cafe']
    if (!tableTypes.includes(outlet.type.toLowerCase())) {
      return NextResponse.json({
        message: `Outlet type "${outlet.type}" does not use tables — skipped`,
        created: 0, deactivated: 0,
      })
    }

    // Build desired table list from outlet seat counts
    // table_number must be globally unique — prefix with outlet code
    const prefix = outlet.code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)

    const desired: { tableNumber: string; capacity: number; section: string }[] = []

    for (let i = 1; i <= (outlet.two_seat_tables ?? 0); i++) {
      desired.push({ tableNumber: `${prefix}-2S${i}`, capacity: 2, section: '2-seat' })
    }
    for (let i = 1; i <= (outlet.four_seat_tables ?? 0); i++) {
      desired.push({ tableNumber: `${prefix}-4S${i}`, capacity: 4, section: '4-seat' })
    }
    for (let i = 1; i <= (outlet.six_seat_tables ?? 0); i++) {
      desired.push({ tableNumber: `${prefix}-6S${i}`, capacity: 6, section: '6-seat' })
    }

    // Load existing tables for this outlet (active + inactive)
    const existing = await prisma.restaurant_tables.findMany({
      where: { outlet_id: outletId },
      select: {
        id: true,
        table_number: true,
        is_active: true,
        status: true,
        current_order_id: true,
      }
    })

    const existingMap = new Map(existing.map(t => [t.table_number, t]))
    const desiredNumbers = new Set(desired.map(d => d.tableNumber))

    let created     = 0
    let reactivated = 0
    let deactivated = 0
    let skipped     = 0  // tables with active orders — cannot deactivate

    // Create or reactivate tables that should exist
    for (const d of desired) {
      const existing = existingMap.get(d.tableNumber)

      if (!existing) {
        // Use upsert to handle the global UNIQUE constraint on table_number
        await prisma.restaurant_tables.upsert({
          where:  { table_number: d.tableNumber },
          create: {
            table_number:  d.tableNumber,
            capacity:      d.capacity,
            min_capacity:  1,
            section:       d.section,
            status:        'AVAILABLE',
            is_active:     true,
            hotel_id:      payload.hotel_id,
            outlet_id:     outletId,
          },
          update: {
            outlet_id:  outletId,
            hotel_id:   payload.hotel_id,
            capacity:   d.capacity,
            section:    d.section,
            is_active:  true,
          }
        })
        created++
      } else if (!existing.is_active) {
        // Reactivate a previously deactivated table
        await prisma.restaurant_tables.update({
          where: { id: existing.id },
          data:  { is_active: true, status: 'AVAILABLE' }
        })
        reactivated++
      }
      // Already active — nothing to do
    }

    // Deactivate tables that no longer exist in desired counts
    for (const t of existing) {
      if (!desiredNumbers.has(t.table_number) && t.is_active) {
        // Don't deactivate if table has an active order
        if (t.current_order_id) {
          skipped++
          continue
        }
        await prisma.restaurant_tables.update({
          where: { id: t.id },
          data:  { is_active: false }
        })
        deactivated++
      }
    }

    return NextResponse.json({
      success: true,
      outletId,
      outletName: outlet.name,
      totalDesired: desired.length,
      created,
      reactivated,
      deactivated,
      skipped,
      message: `Synced ${outlet.name}: +${created} created, +${reactivated} reactivated, -${deactivated} deactivated${skipped > 0 ? `, ${skipped} skipped (active orders)` : ''}`,
    })
  } catch (e: any) {
    console.error('Table sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
