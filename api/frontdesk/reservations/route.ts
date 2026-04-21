import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/frontdesk/reservations?status=CHECKED_IN&date=today&search=name
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const date   = searchParams.get('date')
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '20')

  const where: any = {}

  if (status) where.status = status
  if (search) {
    where.OR = [
      { confirmation_no: { contains: search, mode: 'insensitive' } },
      { guest: { first_name: { contains: search, mode: 'insensitive' } } },
      { guest: { last_name:  { contains: search, mode: 'insensitive' } } },
      { guest: { email:      { contains: search, mode: 'insensitive' } } },
      { room:  { room_number:{ contains: search, mode: 'insensitive' } } },
    ]
  }
  if (date === 'today') {
    const start = new Date(); start.setHours(0,0,0,0)
    const end   = new Date(); end.setHours(23,59,59,999)
    where.check_in_date = { gte: start, lte: end }
  } else if (date === 'tomorrow') {
    const start = new Date(); start.setDate(start.getDate()+1); start.setHours(0,0,0,0)
    const end   = new Date(); end.setDate(end.getDate()+1);     end.setHours(23,59,59,999)
    where.check_in_date = { gte: start, lte: end }
  } else if (date === 'departures') {
    const start = new Date(); start.setHours(0,0,0,0)
    const end   = new Date(); end.setHours(23,59,59,999)
    where.check_out_date = { gte: start, lte: end }
    where.status = 'CHECKED_IN'
  }

  const [reservations, total] = await Promise.all([
    prisma.reservations.findMany({
      where,
      include: {
        guests: { select: { id:true, first_name:true, last_name:true, email:true, phone:true, is_vip:true, loyalty_tier:true, nationality:true } },
        rooms:  { select: { id:true, room_number:true, floor:true, type:true, status:true, bed_type:true } },
      },
      orderBy: { check_in_date: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservations.count({ where }),
  ])

  return NextResponse.json({ reservations, total, page, limit, pages: Math.ceil(total / limit) })
}

// POST /api/frontdesk/reservations — create reservation
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { guestId, roomId, checkInDate, checkOutDate, adults, children, roomRate, channel, specialRequests, mealPlan, isVip, notes } = body

    if (!guestId || !checkInDate || !checkOutDate)
      return NextResponse.json({ error: 'guestId, checkInDate, checkOutDate are required' }, { status: 400 })

    const ciDate = new Date(checkInDate)
    const coDate = new Date(checkOutDate)
    const nights = Math.ceil((coDate.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24))

    const reservation = await prisma.reservations.create({
      data: {
        guest_id:         guestId,
        room_id:          roomId || null,
        check_in_date:    ciDate,
        check_out_date:   coDate,
        nights,
        adults:           adults || 1,
        children:         children || 0,
        room_rate:        roomRate || null,
        total_amount:     roomRate ? roomRate * nights : null,
        channel:          channel || 'DIRECT',
        special_requests: specialRequests || null,
        meal_plan:        mealPlan || null,
        is_vip:           isVip || false,
        notes:            notes || null,
        created_by_id:    payload.userId,
        status:           'CONFIRMED',
      },
      include: {
        guests: true,
        rooms:  true,
      },
    })

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
