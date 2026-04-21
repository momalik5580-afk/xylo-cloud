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

  const lead = await prisma.sales_leads.findUnique({
    where:   { id: params.id },
    include: {
  corporate_accounts: true,
},
  })
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead })
}

// PATCH — update lead: status, follow-up, notes
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = [
      'status','contact_name','contact_email','contact_phone','company',
      'estimated_value','estimated_rooms','estimated_dates',
      'notes','next_follow_up','assigned_to_id','lost_reason',
    ]
    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.next_follow_up)    data.next_follow_up = new Date(data.next_follow_up)
    if (body.status === 'WON')  data.won_at  = new Date()
    if (body.status === 'LOST') data.lost_at = new Date()

    const lead = await prisma.sales_leads.update({ where: { id: params.id }, data })
    return NextResponse.json({ lead })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.sales_leads.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
