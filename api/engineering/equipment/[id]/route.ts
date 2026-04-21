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

  const equipment = await prisma.equipment.findUnique({
    where:   { id: params.id },
    include: {
  equipment_maintenance_logs: { orderBy: { performed_at: 'desc' }, take: 10 },
},
  })
  if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ equipment })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = ['name','category','brand','model','location','floor','status','warranty_expiry','current_value','notes','last_serviced_at','next_service_at']
    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.warranty_expiry)  data.warranty_expiry  = new Date(data.warranty_expiry)
    if (data.last_serviced_at)  data.last_serviced_at  = new Date(data.last_serviced_at)
    if (data.next_service_at)   data.next_service_at   = new Date(data.next_service_at)

    // Log maintenance if status changed
    if (body.status === 'SERVICED' && body.maintenanceNote) {
      await prisma.equipment_maintenance_logs.create({
        data: { equipment_id: params.id, type: 'SERVICED', description: body.maintenanceNote, performed_by: payload.userId, notes: body.maintenanceNote, performed_at: new Date() },
      })
      data.last_serviced_at = new Date()
    }

    const equipment = await prisma.equipment.update({ where: { id: params.id }, data })
    return NextResponse.json({ equipment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.equipment.update({ where: { id: params.id }, data: { is_active: false } })
  return NextResponse.json({ success: true })
}
