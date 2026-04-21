import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/gym/guests?search=name — returns guests with their current or upcoming room
// Includes CHECKED_IN + CONFIRMED reservations (not just CHECKED_IN)
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()

  if (!search || search.length < 2) return NextResponse.json({ guests: [] })

  const where: any = {
    OR: [
      { first_name: { contains: search, mode: 'insensitive' } },
      { last_name:  { contains: search, mode: 'insensitive' } },
      { email:      { contains: search, mode: 'insensitive' } },
    ],
  }

  // Also support searching by room number
  const roomSearch = await prisma.reservations.findMany({
    where: {
      rooms: { room_number: { contains: search, mode: 'insensitive' } },
      status: { in: ['CHECKED_IN', 'CONFIRMED'] },
    },
    include: { guests: true, rooms: { select: { room_number: true } } },
    take: 5,
  })

  const byName = await prisma.guests.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 8,
    include: {
      reservations: {
        where: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
        include: { rooms: { select: { room_number: true } } },
        orderBy: { check_in_date: 'asc' },
        take: 1,
      },
    },
  })

  // Merge results — room search results take priority
  const roomGuestIds = new Set(roomSearch.map((r: any) => r.guest_id).filter(Boolean))
  const roomGuests = roomSearch
    .filter((r: any) => r.guests)
    .map((r: any) => ({
      id: r.guests.id,
      first_name: r.guests.first_name,
      last_name: r.guests.last_name,
      email: r.guests.email,
      room_number: r.rooms?.room_number ?? null,
      reservation_status: r.status,
    }))

  const nameGuests = byName
    .filter((g: any) => !roomGuestIds.has(g.id))
    .map((g: any) => ({
      id: g.id,
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      room_number: g.reservations?.[0]?.rooms?.room_number ?? null,
      reservation_status: g.reservations?.[0]?.status ?? null,
    }))

  return NextResponse.json({ guests: [...roomGuests, ...nameGuests].slice(0, 8) })
}
