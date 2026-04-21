import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/it/tickets?status=OPEN&priority=HIGH&category=HARDWARE
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const priority     = searchParams.get('priority')
  const category     = searchParams.get('category')
  const assignedToId = searchParams.get('assigned_to_id')
  const page         = parseInt(searchParams.get('page') || '1')
  const limit        = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (status)       where.status         = status
  if (priority)     where.priority       = priority
  if (category)     where.category       = category
  if (assignedToId) where.assigned_to_id = assignedToId

  const [tickets, total] = await Promise.all([
    prisma.it_tickets.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        users_it_tickets_requester_idTousers:  { select: { first_name: true, last_name: true, department_id: true } },
        users_it_tickets_assigned_to_idTousers:{ select: { first_name: true, last_name: true } },
        departments:                           { select: { name: true } },
        it_ticket_comments:                    { orderBy: { created_at: 'desc' }, take: 1 },
      },
    }),
    prisma.it_tickets.count({ where }),
  ])

  const summary = {
    open:       await prisma.it_tickets.count({ where: { status: 'OPEN' } }),
    inProgress: await prisma.it_tickets.count({ where: { status: 'IN_PROGRESS' } }),
    critical:   await prisma.it_tickets.count({ where: { priority: 'CRITICAL', status: { notIn: ['CLOSED','RESOLVED'] } } }),
  }

  return NextResponse.json({ tickets, total, page, limit, pages: Math.ceil(total / limit), summary })
}

// POST /api/it/tickets
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, description, category, departmentId, priority, assignedToId } = body

    if (!title || !description || !category)
      return NextResponse.json({ error: 'title, description, category required' }, { status: 400 })

    const ticket = await prisma.it_tickets.create({
      data: {
        title,
        description,
        category,
        department_id:  departmentId || null,
        requester_id:   payload.userId,
        assigned_to_id: assignedToId || null,
        priority:       priority     || 'MEDIUM',
        status:         'OPEN',
        hotel_id:       'hotel_hrg',
      },
      include: {
        users_it_tickets_requester_idTousers: { select: { first_name: true, last_name: true } },
      },
    })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}