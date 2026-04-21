import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/hr/staff?view=staff|attendance|leave|shifts
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view     = searchParams.get('view') || 'staff'
  const deptId   = searchParams.get('department')
  const userId   = searchParams.get('userId')
  const date     = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const page     = parseInt(searchParams.get('page') || '1')
  const limit    = parseInt(searchParams.get('limit') || '20')

  if (view === 'staff') {
    const where: any = { is_active: true }
    if (deptId) where.department_id = deptId
    const [staff, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: [{ first_name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, first_name: true, last_name: true, email: true,
          avatar: true, employee_id: true, phone: true, is_active: true,
          department_id: true,
          role_id:       true,
        },
      }),
      prisma.users.count({ where }),
    ])
    return NextResponse.json({ staff, total, page, limit })
  }

  if (view === 'attendance') {
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0)
    const endOfDay   = new Date(targetDate); endOfDay.setHours(23,59,59,999)
    const where: any = { date: { gte: startOfDay, lte: endOfDay } }
    if (userId) where.user_id = userId

    const records = await prisma.attendance.findMany({
      where,
      include: {
        users: { select: { first_name: true, last_name: true, employee_id: true, department_id: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ attendance: records, date })
  }

  if (view === 'leave') {
    const where: any = { status: 'PENDING' }
    if (userId) where.user_id = userId
    const [requests, total] = await Promise.all([
      prisma.leave_requests.findMany({
        where,
        include: {
          users_leave_requests_user_idTousers: { select: { first_name: true, last_name: true, department_id: true } },
        },
        orderBy: { applied_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leave_requests.count({ where }),
    ])
    return NextResponse.json({ requests, total, page, limit })
  }

  if (view === 'shifts') {
    const targetDate = new Date(date)
    const start      = new Date(targetDate); start.setHours(0,0,0,0)
    const end        = new Date(targetDate); end.setHours(23,59,59,999)
    const shifts = await prisma.shifts.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { start_time: 'asc' },
    })
    return NextResponse.json({ shifts, date })
  }

  return NextResponse.json({ error: 'Invalid view' }, { status: 400 })
}

// POST /api/hr/staff — action: attendance | leave_request | approve_leave
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'attendance') {
      const { userId, status, checkIn, checkOut, notes } = body
      const record = await prisma.attendance.create({
        data: {
          user_id:   userId,
          date:      new Date(),
          status:    status || 'PRESENT',
          check_in:  checkIn  ? new Date(checkIn)  : null,
          check_out: checkOut ? new Date(checkOut) : null,
          notes:     notes || null,
          hotel_id:  'hotel_hrg',
        },
      })
      return NextResponse.json({ attendance: record }, { status: 201 })
    }

    if (action === 'leave_request') {
      const { userId, type, startDate, endDate, days, reason } = body
      const request = await prisma.leave_requests.create({
        data: {
          user_id:    userId,
          type:       type || 'ANNUAL',
          status:     'PENDING',
          start_date: new Date(startDate),
          end_date:   new Date(endDate),
          days,
          reason:     reason || null,
          hotel_id:   'hotel_hrg',
        },
      })
      return NextResponse.json({ request }, { status: 201 })
    }

    if (action === 'approve_leave') {
      const { leaveId, approved, note } = body
      const request = await prisma.leave_requests.update({
        where: { id: leaveId },
        data: {
          status:        approved ? 'APPROVED' : 'REJECTED',
          approver_id:   payload.userId,
          reviewed_at:   new Date(),
          approval_note: note || null,
        },
      })
      return NextResponse.json({ request })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}