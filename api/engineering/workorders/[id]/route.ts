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

  const wo = await prisma.work_orders.findUnique({
    where: { id: params.id },
    include: { users_work_orders_assigned_to_idTousers: true, departments: true, work_order_parts: true },
  })
  if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ workOrder: wo })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { status, assignedToId, priority, notes, actualHours, laborCost, materialCost } = body

    const data: any = {}
    if (status !== undefined)       data.status       = status
    if (assignedToId !== undefined) data.assigned_to_id = assignedToId
    if (priority !== undefined)     data.priority     = priority
    if (notes !== undefined)        data.notes        = notes
    if (actualHours !== undefined)  data.actual_hours  = actualHours
    if (laborCost !== undefined)    data.labor_cost    = laborCost
    if (materialCost !== undefined) data.material_cost = materialCost

    if (status === 'IN_PROGRESS') data.started_at   = new Date()
    if (status === 'COMPLETED')   data.completed_at  = new Date()
    if (laborCost && materialCost) data.total_cost   = laborCost + materialCost

    const workOrder = await prisma.work_orders.update({
      where: { id: params.id },
      data,
     include: { users_work_orders_assigned_to_idTousers: true, departments: true, work_order_parts: true },
    })
    return NextResponse.json({ workOrder })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.work_orders.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ success: true })
}
