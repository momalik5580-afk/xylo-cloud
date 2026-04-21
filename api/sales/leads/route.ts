import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/sales/leads?status=NEW&assigned_to_id=&search=
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const assignedToId = searchParams.get('assigned_to_id')
  const search       = searchParams.get('search')
  const page         = parseInt(searchParams.get('page') || '1')
  const limit        = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (status)       where.status         = status
  if (assignedToId) where.assigned_to_id = assignedToId
  if (search) {
    where.OR = [
      { contact_name:  { contains: search, mode: 'insensitive' } },
      { company:       { contains: search, mode: 'insensitive' } },
      { contact_email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [leads, total] = await Promise.all([
    prisma.sales_leads.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
  corporate_accounts: { select: { company_name: true } },
},
    }),
    prisma.sales_leads.count({ where }),
  ])

  const summary = {
    new:        await prisma.sales_leads.count({ where: { status: 'NEW' } }),
    contacted:  await prisma.sales_leads.count({ where: { status: 'CONTACTED' } }),
    proposal: await prisma.sales_leads.count({ where: { status: 'PROPOSAL_SENT' } }),
    won:        await prisma.sales_leads.count({ where: { status: 'WON' } }),
    lost:       await prisma.sales_leads.count({ where: { status: 'LOST' } }),
    totalValue: leads.reduce((s: number, l: any) => s + Number(l.estimated_value || 0), 0),
  }

  return NextResponse.json({ leads, total, page, limit, pages: Math.ceil(total / limit), summary })
}

// POST /api/sales/leads
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      contactName, contactEmail, contactPhone, company, source,
      type, estimatedValue, estimatedRooms, estimatedDates,
      notes, nextFollowUp, assignedToId, corporateAccountId,
    } = body

    if (!contactName)
      return NextResponse.json({ error: 'contactName required' }, { status: 400 })

    const lead = await prisma.sales_leads.create({
      data: {
        contact_name:          contactName,
        contact_email:         contactEmail        || null,
        contact_phone:         contactPhone        || null,
        company:               company             || null,
        source:                source              || null,
        type:                  type                || null,
        estimated_value:       estimatedValue      || null,
        estimated_rooms:       estimatedRooms      || null,
        estimated_dates:       estimatedDates      || null,
        status:                'NEW',
        assigned_to_id:        assignedToId        || payload.userId,
        corporate_account_id:  corporateAccountId  || null,
        notes:                 notes               || null,
        next_follow_up:        nextFollowUp        ? new Date(nextFollowUp) : null,
        hotel_id:              'hotel_hrg',
      },
    })
    return NextResponse.json({ lead }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
