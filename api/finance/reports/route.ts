import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/finance/reports?type=daily|monthly|occupancy|revenue
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type') || 'daily'
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1
  const year  = searchParams.get('year')  ? parseInt(searchParams.get('year')!)  : new Date().getFullYear()

  if (type === 'daily') {
    const date  = from ? new Date(from) : new Date()
    const start = new Date(date); start.setHours(0,0,0,0)
    const end   = new Date(date); end.setHours(23,59,59,999)

    const [checkIns, checkOuts, charges, payments, tasks] = await Promise.all([
      prisma.reservations.count({ where: { actual_check_in:  { gte: start, lte: end } } }),
      prisma.reservations.count({ where: { actual_check_out: { gte: start, lte: end } } }),
      prisma.folio_charges.aggregate({ where: { charge_date: { gte: start, lte: end }, voided_at: null }, _sum: { total_amount: true } }),
      prisma.payment_transactions.aggregate({ where: { processed_at: { gte: start, lte: end }, status: 'PAID' }, _sum: { amount: true } }),
      prisma.tasks.count({ where: { created_at: { gte: start, lte: end } } }),
    ])

    const [totalRooms, occupiedRooms] = await Promise.all([
      prisma.rooms.count({ where: { is_active: true } }),
      prisma.rooms.count({ where: { status: 'OCCUPIED' } }),
    ])

    return NextResponse.json({
      date:        date.toISOString().split('T')[0],
      checkIns,
      checkOuts,
      revenue:     charges._sum?.total_amount || 0,
      payments:    payments._sum.amount || 0,
      tasks,
      occupancy:   { total: totalRooms, occupied: occupiedRooms, rate: totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0 },
    })
  }

  if (type === 'monthly') {
    const startDate = new Date(year, month - 1, 1)
    const endDate   = new Date(year, month, 0, 23, 59, 59)

    const [revenue, payments, reservations] = await Promise.all([
      prisma.folio_charges.aggregate({ where: { charge_date: { gte: startDate, lte: endDate }, voided_at: null }, _sum: { total_amount: true } }),
      prisma.payment_transactions.aggregate({ where: { processed_at: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      prisma.reservations.findMany({ where: { check_in_date: { gte: startDate, lte: endDate } }, select: { nights: true, room_rate: true, total_amount: true, status: true } }),
    ])

    // Revenue by category
    const byCategory = await prisma.folio_charges.groupBy({
      by: ['category'],
      where: { charge_date: { gte: startDate, lte: endDate }, voided_at: null },
      _sum: { total_amount: true },
    })

    return NextResponse.json({
      month, year,
      totalRevenue:      revenue._sum?.total_amount || 0,
      totalPayments:     payments._sum.amount || 0,
      totalReservations: reservations.length,
      avgDailyRate:      reservations.length ? reservations.reduce((s: number, r: any) => s + Number(r.roomRate || 0), 0) / reservations.length : 0,
      revenueByCategory: byCategory,
    })
  }

  if (type === 'occupancy') {
    // Last 30 days occupancy trend
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d     = new Date(); d.setDate(d.getDate() - i)
      const start = new Date(d); start.setHours(0,0,0,0)
      const end   = new Date(d); end.setHours(23,59,59,999)
      const occupied = await prisma.reservations.count({ where: { status: 'CHECKED_IN', check_in_date: { lte: end }, check_out_date: { gte: start } } })
      days.push({ date: d.toISOString().split('T')[0], occupied })
    }
    const totalRooms = await prisma.rooms.count({ where: { is_active: true } })
    return NextResponse.json({ trend: days.map(d => ({ ...d, rate: totalRooms ? ((d.occupied / totalRooms) * 100).toFixed(1) : 0 })), totalRooms })
  }

  return NextResponse.json({ error: 'Invalid report type. Use: daily | monthly | occupancy' }, { status: 400 })
}
