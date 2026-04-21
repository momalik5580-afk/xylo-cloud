import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/roomservice/laundry
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const orders = await prisma.laundry_orders.findMany({
      where:   { hotel_id: payload.hotel_id },
      orderBy: { created_at: 'desc' },
      take:    limit,
    })
    return NextResponse.json({ orders })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
