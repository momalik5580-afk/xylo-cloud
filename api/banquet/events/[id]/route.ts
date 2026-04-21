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

  const event = await prisma.event_bookings.findUnique({
    where:   { id: params.id },
    include: {
      banquet_rooms: true,
      event_add_ons: true,
    },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ event })
}

// PATCH — update status: INQUIRY→CONFIRMED→IN_PROGRESS→COMPLETED | CANCELLED
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = [
      'status','organizer_name','organizer_email','organizer_phone',
      'event_name','event_type','setup','guest_count','start_date','end_date',
      'meal_plan','av_requirements','notes','room_rate','deposit_amount','deposit_paid',
    ]
    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.start_date)          data.start_date    = new Date(data.start_date)
    if (data.end_date)            data.end_date      = new Date(data.end_date)
    if (body.status === 'CANCELLED') data.cancelled_at = new Date()

    const event = await prisma.event_bookings.update({ where: { id: params.id }, data })
    return NextResponse.json({ event })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.event_bookings.update({
    where: { id: params.id },
    data:  { status: 'CANCELLED', cancelled_at: new Date() },
  })
  return NextResponse.json({ success: true })
}
