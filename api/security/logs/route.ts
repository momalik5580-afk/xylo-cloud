import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/security/logs?type=INCIDENT&severity=HIGH
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')
  const severity = searchParams.get('severity')
  const from     = searchParams.get('from')
  const page     = parseInt(searchParams.get('page') || '1')
  const limit    = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (type)     where.type        = type
  if (severity) where.severity    = severity
  if (from)     where.occurred_at = { gte: new Date(from) }

  const [logs, total] = await Promise.all([
    prisma.security_logs.findMany({
      where,
      orderBy: { occurred_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.security_logs.count({ where }),
  ])

  // Open incidents
  const incidents = await prisma.incidents.findMany({
    where:   { status: { not: 'CLOSED' } },
    orderBy: { occurred_at: 'desc' },
    take: 10,
   include: {
  users_incidents_reported_by_idTousers: { select: { first_name: true, last_name: true } },
  users_incidents_assigned_to_idTousers: { select: { first_name: true, last_name: true } },
  departments:                           { select: { name: true } },
},
  })

  // Visitor logs today
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0)
  const visitors = await prisma.visitor_logs.findMany({
    where:   { created_at: { gte: startOfDay } },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  const summary = {
    total,
    critical:     await prisma.security_logs.count({ where: { severity: 'CRITICAL' } }),
    high:         await prisma.security_logs.count({ where: { severity: 'HIGH' } }),
    openIncidents:await prisma.incidents.count({ where: { status: { not: 'CLOSED' } } }),
    visitorsToday:visitors.length,
  }

  return NextResponse.json({ logs, incidents, visitors, total, page, limit, summary })
}

// POST /api/security/logs — log security event
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, description, location, floor, severity, actionTaken, occurredAt } = body

    if (!type || !description)
      return NextResponse.json({ error: 'type and description required' }, { status: 400 })

    const log = await prisma.security_logs.create({
      data: {
        type,
        description,
        location:       location || null,
        floor:          floor || null,
        severity:       severity || 'LOW',
        reported_by_id: payload.userId,
        action_taken:   actionTaken || null,
        occurred_at:    occurredAt ? new Date(occurredAt) : new Date(),
        hotel_id:       'hotel_hrg',
      },
    })
    return NextResponse.json({ log }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
