import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/engineering/equipment?category=HVAC&status=OPERATIONAL
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status')
  const floor    = searchParams.get('floor')

  const where: any = { is_active: true }
  if (category) where.category = category
  if (status)   where.status   = status
  if (floor)    where.floor    = floor

  const equipment = await prisma.equipment.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      equipment_maintenance_logs: {
  orderBy: { performed_at: 'desc' },
  take: 3,
},
    },
  })

  // Get PM schedules due
 const duePM = await prisma.pm_schedules.findMany({
  where: {
    next_run_at: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    is_active:   true,
  },
  orderBy: { next_run_at: 'asc' },
})

  return NextResponse.json({ equipment, duePM })
}

// POST /api/engineering/equipment
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, category, brand, model, serialNumber, location, floor, purchaseDate, warrantyExpiry, purchaseCost, notes } = body

    if (!name || !category)
      return NextResponse.json({ error: 'name and category are required' }, { status: 400 })

    const item = await prisma.equipment.create({
      data: {
        name,
        category,
        brand:          brand || null,
        model:          model || null,
        serial_number:   serialNumber || null,
        location:       location || null,
        floor:          floor || null,
        purchase_date:   purchaseDate ? new Date(purchaseDate) : null,
        warranty_expiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        purchase_cost:   purchaseCost || null,
        status:         'OPERATIONAL',
        is_active:       true,
        notes:          notes || null,
      },
    })
    return NextResponse.json({ equipment: item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
