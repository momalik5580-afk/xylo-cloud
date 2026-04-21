// src/app/api/outlets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value
    || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// DB stores mixed case (e.g. 'RESTAURANT' from old data) — always normalise to lowercase
function normalizeType(type: string): string {
  return (type ?? 'restaurant').toLowerCase()
}

// Map DB snake_case → camelCase for frontend
// restaurants-content.tsx and use-hotel-config.ts both expect camelCase
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
    // camelCase — matches OutletConfig interface in use-hotel-config.ts
    openingTime:    o.opening_time  ?? null,
    closingTime:    o.closing_time  ?? null,
    twoSeatTables:  o.two_seat_tables  ?? 0,
    fourSeatTables: o.four_seat_tables ?? 0,
    sixSeatTables:  o.six_seat_tables  ?? 0,
    // usage counts from related tables (useful for UI warnings before delete)
    tableCount:     o._count?.restaurant_tables ?? 0,
    orderCount:     o._count?.fnb_orders        ?? 0,
  }
}

// GET /api/outlets
// Returns all active outlets for the logged-in user's hotel
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned to this user' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const type      = searchParams.get('type')
  const allActive = searchParams.get('all') // pass ?all=1 to include inactive

  const where: any = { hotel_id: payload.hotel_id }
  if (!allActive) where.is_active = true   // default: only active outlets
  if (type)       where.type = type

  try {
    const rows = await prisma.outlets.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: {
        _count: {
          select: {
            restaurant_tables: true,
            fnb_orders:        true,
          }
        }
      }
    })
    return NextResponse.json({ outlets: rows.map(mapOutlet) })
  } catch (e: any) {
    console.error('GET /api/outlets error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/outlets
// Create a new outlet for this hotel
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned to this user' }, { status: 400 })

  try {
    const body = await req.json()
    const {
      name, type, status,
      openingTime, closingTime,
      twoSeatTables, fourSeatTables, sixSeatTables,
      capacity, description,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!type)         return NextResponse.json({ error: 'type is required' }, { status: 400 })

    // Validate time format HH:MM before hitting the DB trigger
    // (validate_outlet trigger will also reject bad formats, but nicer to catch here)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (openingTime && !timeRegex.test(openingTime))
      return NextResponse.json({ error: 'openingTime must be HH:MM format (e.g. 08:00)' }, { status: 400 })
    if (closingTime && !timeRegex.test(closingTime))
      return NextResponse.json({ error: 'closingTime must be HH:MM format (e.g. 23:00)' }, { status: 400 })

    // Generate URL-safe code from name
    const baseCode = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)

    // Ensure unique code per hotel
    const existing = await prisma.outlets.findFirst({
      where: { code: baseCode, hotel_id: payload.hotel_id }
    })
    const finalCode = existing ? `${baseCode}-${Date.now()}` : baseCode

    const outlet = await prisma.outlets.create({
      data: {
        name:             name.trim(),
        code:             finalCode,
        type:             normalizeType(type),
        status:           status          ?? 'active',
        is_active:        true,
        hotel_id:         payload.hotel_id,
        opening_time:     openingTime     ?? null,
        closing_time:     closingTime     ?? null,
        two_seat_tables:  twoSeatTables   ?? 0,
        four_seat_tables: fourSeatTables  ?? 0,
        six_seat_tables:  sixSeatTables   ?? 0,
        capacity:         capacity        ?? null,
        description:      description     ?? null,
      }
    })

    return NextResponse.json({ outlet: mapOutlet(outlet) }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/outlets error:', e)
    // Surface DB trigger errors clearly (validate_outlet raises exceptions)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
