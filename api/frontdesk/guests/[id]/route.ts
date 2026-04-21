import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/frontdesk/guests/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guest = await prisma.guests.findUnique({
    where: { id: params.id },
    include: {
      reservations: {
        orderBy: { created_at: 'desc' },
        take: 10,
       include: { rooms: { select: { room_number: true, type: true } } },
      },
      
      
    },
  })
  if (!guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ guest })
}

// PATCH /api/frontdesk/guests/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = ['first_name','last_name','email','phone','nationality','passport_number','date_of_birth','gender','address','city','country','company','is_vip','loyalty_tier','vip_code','vip_notes','notes','blacklisted','blacklist_reason']
    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.date_of_birth) data.date_of_birth = new Date(data.date_of_birth)

    const guest = await prisma.guests.update({ where: { id: params.id }, data })
    return NextResponse.json({ guest })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/frontdesk/guests/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.guests.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
