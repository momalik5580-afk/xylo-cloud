import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { generateToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/multihotel/hotels — list all hotels user can access
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includeStats = searchParams.get('stats') === 'true'

  const hotels = await prisma.hotels.findMany({
    where:   { is_active: true },
    orderBy: { name: 'asc' },
    include: {
      organizations: { select: { name: true, logo: true } },
    },
  })

  if (!includeStats) {
    return NextResponse.json({ hotels, currentHotelId: (payload as any).hotelId || null })
  }

  const enriched = await Promise.all(
    hotels.map(async (hotel: any) => {
      const [occupiedRooms, totalRooms, openTasks, openIncidents] = await Promise.all([
        prisma.rooms.count({ where: { hotel_id: hotel.id, status: 'OCCUPIED' } }),
        prisma.rooms.count({ where: { hotel_id: hotel.id, is_active: true } }),
        prisma.tasks.count({ where: { hotel_id: hotel.id, status: { notIn: ['CLOSED', 'CANCELLED'] } } }),
        prisma.incidents.count({ where: { hotel_id: hotel.id, status: { not: 'CLOSED' } } }),
      ])
      return {
        ...hotel,
        stats: {
          occupiedRooms,
          totalRooms,
          occupancyRate: totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0',
          openTasks,
          openIncidents,
        },
      }
    })
  )

  return NextResponse.json({ hotels: enriched, currentHotelId: (payload as any).hotelId || null })
}

// POST /api/multihotel/hotels — switch active hotel context
// action: 'switch' | 'create'
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'switch') {
      const { hotelId } = body
      if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

      const hotel = await prisma.hotels.findUnique({ where: { id: hotelId } })
      if (!hotel || !hotel.is_active)
        return NextResponse.json({ error: 'Hotel not found or inactive' }, { status: 404 })

      const user = await prisma.users.findUnique({
        where:   { id: payload.userId },
        include: {
          roles:                                          true,
          departments_users_department_idTodepartments:  true,
        },
      })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const newToken = generateToken({
        userId:       user.id,
        email:        user.email,
        role:         (payload as any).role,
        department_id: user.department_id || undefined,
        hotelId,
      } as any)

      const response = NextResponse.json({
        success: true,
        hotel:   { id: hotel.id, name: hotel.name, code: hotel.code, city: hotel.city },
        token:   newToken,
      })

      response.cookies.set('xylo-token', newToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   60 * 60 * 24,
        path:     '/',
      })

      return response
    }

    if (action === 'create') {
      if ((payload as any).role !== 'GENERAL_MANAGER')
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

      const { organizationId, code, name, city, country, address, phone, email, totalRooms, totalFloors, starRating, currency, timezone, checkInTime, checkOutTime, taxRate, serviceCharge } = body

      if (!organizationId || !code || !name)
        return NextResponse.json({ error: 'organizationId, code, name required' }, { status: 400 })

      const hotel = await prisma.hotels.create({
        data: {
          organization_id: organizationId,
          code,
          name,
          city:            city         || null,
          country:         country      || null,
          address:         address      || null,
          phone:           phone        || null,
          email:           email        || null,
          total_rooms:     totalRooms   || 0,
          total_floors:    totalFloors  || 1,
          star_rating:     starRating   || null,
          currency:        currency     || 'USD',
          timezone:        timezone     || 'UTC',
          check_in_time:   checkInTime  || '14:00',
          check_out_time:  checkOutTime || '12:00',
          tax_rate:        taxRate      || 0,
          service_charge:  serviceCharge|| 0,
          is_active:       true,
        },
      })
      return NextResponse.json({ hotel }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action. Use: switch | create' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}