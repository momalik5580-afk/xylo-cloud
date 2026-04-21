import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/frontdesk/guests?search=&vip=true&page=1
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const vip    = searchParams.get('vip')
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (vip === 'true') where.is_Vip = true
  if (search) {
    where.OR = [
      { first_name:  { contains: search, mode: 'insensitive' } },
      { last_name:   { contains: search, mode: 'insensitive' } },
      { email:      { contains: search, mode: 'insensitive' } },
      { phone:      { contains: search, mode: 'insensitive' } },
      { guest_number:{ contains: search, mode: 'insensitive' } },
    ]
  }

  const [guests, total] = await Promise.all([
    prisma.guests.findMany({
      where,
     orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reservations: {
          where:   { status: 'CHECKED_IN' },
          include: { rooms: { select: { room_number: true } } },
          take: 1,
        },
      },
    }),
    prisma.guests.count({ where }),
  ])

  return NextResponse.json({ guests, total, page, limit, pages: Math.ceil(total / limit) })
}

// POST /api/frontdesk/guests — create guest profile
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, nationality, passportNumber, dateOfBirth, gender, address, city, country, company, isVip, loyaltyTier, notes } = body

    if (!firstName || !lastName)
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })

    const guest = await prisma.guests.create({
      data: {
        first_name: firstName,
        last_name:  lastName,
        email:          email || null,
        phone:          phone || null,
        nationality:    nationality || null,
        passport_number: passportNumber || null,
        date_of_birth:    dateOfBirth ? new Date(dateOfBirth) : null,
        gender:         gender || null,
        address:        address || null,
        zip_code :           city || null,
        company:        company || null,
        is_vip:          isVip || false,
        loyalty_tier:    loyaltyTier || 'STANDARD',
        notes:          notes || null,
      },
    })
    return NextResponse.json({ guest }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
