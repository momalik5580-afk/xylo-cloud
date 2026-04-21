import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await prisma.it_tickets.findUnique({
    where:   { id: params.id },
    include: {
      users_it_tickets_requester_idTousers:  { select: { first_name: true, last_name: true, department_id: true } },
      users_it_tickets_assigned_to_idTousers:{ select: { first_name: true, last_name: true } },
      departments:                           { select: { name: true } },
      it_ticket_comments:                    { orderBy: { created_at: 'asc' } },
    },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ticket })
}

// PATCH — update status, assign, resolve, add comment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { status, assignedToId, priority, resolution, comment } = body

    const data: any = {}
    if (status !== undefined)       data.status         = status
    if (assignedToId !== undefined) data.assigned_to_id = assignedToId
    if (priority !== undefined)     data.priority       = priority
    if (resolution !== undefined)   data.resolution     = resolution

    if (status === 'RESOLVED') data.resolved_at = new Date()
    if (status === 'CLOSED')   data.closed_at   = new Date()

    const ticket = await prisma.it_tickets.update({ where: { id: params.id }, data })

    // Add comment if provided
    if (comment) {
      await prisma.it_ticket_comments.create({
        data: {
          ticket_id: params.id,
          user_id:   payload.userId,
          content:   comment,
        },
      })
    }

    return NextResponse.json({ ticket })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}