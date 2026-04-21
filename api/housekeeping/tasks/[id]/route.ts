import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/housekeeping/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await prisma.housekeeping_tasks.findUnique({
    where: { id: params.id },
    include: {
      rooms:                    true,
      users:                    { select: { id: true, first_name: true, last_name: true, avatar: true } },
      housekeeping_supply_usage: true,
    },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ task })
}

// PATCH /api/housekeeping/tasks/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { status, assignedToId, notes, checklistData, dndActive, guestPresent, duration } = body

    const data: any = {}
    if (status !== undefined)        data.status         = status
    if (assignedToId !== undefined)  data.assigned_to_id = assignedToId
    if (notes !== undefined)         data.notes          = notes
    if (checklistData !== undefined) data.checklist_data = checklistData
    if (dndActive !== undefined)     data.dnd_active     = dndActive
    if (guestPresent !== undefined)  data.guest_present  = guestPresent
    if (duration !== undefined)      data.duration       = duration

    if (status === 'IN_PROGRESS') data.started_at  = new Date()
    if (status === 'COMPLETED')   data.completed_at = new Date()

    const task = await prisma.housekeeping_tasks.update({
      where: { id: params.id },
      data,
      include: {
        rooms: { select: { room_number: true, floor: true } },
        users: { select: { id: true, first_name: true, last_name: true } },
      },
    })

    // If completed, mark room as AVAILABLE (trigger also handles this)
    if (status === 'COMPLETED' && task.room_id) {
      await prisma.rooms.update({
        where: { id: task.room_id },
        data:  { status: 'AVAILABLE', last_cleaned_at: new Date() },
      })
    }

    return NextResponse.json({ task })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/housekeeping/tasks/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.housekeeping_tasks.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}