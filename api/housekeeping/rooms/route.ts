import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/housekeeping/rooms
// Returns rooms grouped by floor with housekeeping status
// ?staffId= to filter by assigned housekeeper
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get('staffId')
  const floor   = searchParams.get('floor')

  const where: any = { is_active: true }
  if (floor) where.floor = parseInt(floor)

  const rooms = await prisma.rooms.findMany({
    where,
    orderBy: [{ floor: 'asc' }, { room_number: 'asc' }],
    include: {
      housekeeping_tasks: {
        where:   { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { created_at: 'desc' },
        take: 1,
        include: {
          users: { select: { id: true, first_name: true, last_name: true, avatar: true } },
        },
      },
      reservations: {
        where:   { status: 'CHECKED_IN' },
        include: { guests: { select: { first_name: true, last_name: true, is_vip: true } } },
        take: 1,
      },
    },
  })

  // Filter by staffId if provided
  const filtered = staffId
    ? rooms.filter(r => r.housekeeping_tasks.some((t: any) => t.assigned_to_id === staffId))
    : rooms

  // Group by floor
  const byFloor: Record<number, any[]> = {}
  for (const room of filtered) {
    if (!byFloor[room.floor]) byFloor[room.floor] = []
    byFloor[room.floor].push(room)
  }

  // Staff workload summary
  const staff = await prisma.users.findMany({
    where: { department_id: { not: null }, is_active: true },
    select: { id: true, first_name: true, last_name: true, avatar: true },
  })

  const staffWorkload = await Promise.all(
    staff.map(async (s) => {
      const [pending, inProgress, completed] = await Promise.all([
        prisma.housekeeping_tasks.count({ where: { assigned_to_id: s.id, status: 'PENDING' } }),
        prisma.housekeeping_tasks.count({ where: { assigned_to_id: s.id, status: 'IN_PROGRESS' } }),
        prisma.housekeeping_tasks.count({ where: { assigned_to_id: s.id, status: 'COMPLETED', completed_at: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      ])
      return { ...s, pending, inProgress, completed }
    })
  )

  // Accurate summary counts direct from DB
  const [available, occupied, dirty, cleaning, maintenance, outOfOrder, pendingTasks] = await Promise.all([
    prisma.rooms.count({ where: { is_active: true, status: 'AVAILABLE' } }),
    prisma.rooms.count({ where: { is_active: true, status: 'OCCUPIED' } }),
    prisma.rooms.count({ where: { is_active: true, status: 'DIRTY' } }),
    prisma.rooms.count({ where: { is_active: true, status: 'CLEANING' } }),
    prisma.rooms.count({ where: { is_active: true, status: 'MAINTENANCE' } }),
    prisma.rooms.count({ where: { is_active: true, status: 'OUT_OF_ORDER' } }),
    prisma.housekeeping_tasks.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] }, created_at: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
  ])

  const summary = { available, occupied, dirty, cleaning, maintenance, outOfOrder, pendingTasks,
    total: available + occupied + dirty + cleaning + maintenance + outOfOrder }

  return NextResponse.json({ rooms: filtered, byFloor, staffWorkload, summary })
}