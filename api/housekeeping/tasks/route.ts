import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/housekeeping/tasks?status=PENDING&assigned_to_id=&taskType=&floor=
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const assignedToId = searchParams.get('assigned_to_id')
  const taskType     = searchParams.get('taskType')
  const floor        = searchParams.get('floor')

  const where: any = {}
  if (status)       where.status        = status
  if (assignedToId) where.assigned_to_id = assignedToId
  if (taskType)     where.task_type     = taskType
  if (floor)        where.room = { floor: parseInt(floor) }

  const tasks = await prisma.housekeeping_tasks.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { scheduled_for: 'asc' }],
    include: {
      rooms:       { select: { room_number: true, floor: true, type: true, status: true } },
      users: { select: { id: true, first_name: true, last_name: true, avatar: true } },
    },
  })

  const summary = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed:  tasks.filter(t => t.status === 'COMPLETED').length,
    dnd:        tasks.filter(t => t.dnd_active).length,
  }

  return NextResponse.json({ tasks, summary })
}

// POST /api/housekeeping/tasks — create task
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { roomId, assignedToId, taskType, priority, scheduledFor, notes, checklistData } = body

    if (!roomId)
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })

    const dept = await prisma.departments.findFirst({ where: { code: 'HOUSEKEEPING' } })

    const task = await prisma.housekeeping_tasks.create({
      data: {
        room_id:        roomId,
        assigned_to_id: assignedToId || null,
        department_id:  dept?.id || '',
        task_type:      taskType || 'CLEANING',
        priority:       priority || 'MEDIUM',
        scheduled_for:  scheduledFor ? new Date(scheduledFor) : null,
        notes:          notes || null,
        checklist_data: checklistData || null,
        status:         'PENDING',
        hotel_id:       (payload as any).hotel_id ?? 'hotel_hrg',
      },
      include: {
        rooms:       { select: { room_number: true, floor: true, type: true } },
        users: { select: { id: true, first_name: true, last_name: true } },
      },
    })
    return NextResponse.json({ task }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
