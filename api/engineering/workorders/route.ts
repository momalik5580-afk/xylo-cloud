import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/engineering/workorders?status=OPEN&priority=URGENT
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const priority     = searchParams.get('priority')
  const assignedToId = searchParams.get('assigned_to_id')
  const type         = searchParams.get('type')
  const page         = parseInt(searchParams.get('page') || '1')
  const limit        = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (status)       where.status         = status
  if (priority)     where.priority       = priority
  if (assignedToId) where.assigned_to_id = assignedToId
  if (type)         where.type           = type

  const [workOrders, total] = await Promise.all([
    prisma.work_orders.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        users_work_orders_assigned_to_idTousers: true,
        departments: true,
        work_order_parts: true,
      },
    }),
    prisma.work_orders.count({ where }),
  ])

  const summary = {
    open:       await prisma.work_orders.count({ where: { status: 'OPEN' } }),
    inProgress: await prisma.work_orders.count({ where: { status: 'IN_PROGRESS' } }),
    urgent:     await prisma.work_orders.count({ where: { priority: 'URGENT' } }),
    overdue:    await prisma.work_orders.count({ where: { due_at: { lt: new Date() }, status: { notIn: ['COMPLETED','CANCELLED'] } } }),
  }

  return NextResponse.json({ workOrders, total, page, limit, pages: Math.ceil(total / limit), summary })
}

// POST /api/engineering/workorders
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, description, type, priority, assignedToId, location, locationType, room_number, assetId, estimatedHours, scheduledAt, dueAt, notes } = body

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

    const dept = await prisma.departments.findFirst({ where: { code: 'ENGINEERING' } })

    const workOrder = await prisma.work_orders.create({
      data: {
        title,
        description:     description  || null,
        type:            type         || 'CORRECTIVE',
        priority:        priority     || 'ROUTINE',
        status:          'OPEN',
        department_id:   dept?.id     || '',
        created_by_id:   payload.userId,
        assigned_to_id:  assignedToId || null,
        location:        location     || null,
        location_type:   locationType || null,
        room_number:     room_number  || null,
        asset_id:        assetId      || null,
        estimated_hours: estimatedHours || null,
        scheduled_at:    scheduledAt  ? new Date(scheduledAt) : null,
        due_at:          dueAt        ? new Date(dueAt)       : null,
        notes:           notes        || null,
        hotel_id:        'hotel_hrg',
      },
      include: {
       users_work_orders_assigned_to_idTousers: true,
        departments: true,
      },
    })
    return NextResponse.json({ workOrder }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
