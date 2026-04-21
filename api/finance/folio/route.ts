import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/finance/folio?reservationId=&guestId=
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const reservationId = searchParams.get('reservationId')
  const guestId       = searchParams.get('guestId')

  if (!reservationId && !guestId)
    return NextResponse.json({ error: 'reservationId or guestId required' }, { status: 400 })

  const where: any = {}
  if (reservationId) where.reservation_id = reservationId
  if (guestId)       where.guest_id       = guestId

  const [charges, payments] = await Promise.all([
    prisma.folio_charges.findMany({
      where,
      orderBy: { charge_date: 'asc' },
    }),
    prisma.payment_transactions.findMany({
      where:   { reservation_id: reservationId || undefined },
      orderBy: { created_at: 'asc' },
    }),
  ])

  const totalCharges  = charges.filter((c: any) => !c.voided_at).reduce((s: number, c: any) => s + Number(c.total_amount), 0)
  const totalPayments = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const balance       = totalCharges - totalPayments

  return NextResponse.json({ charges, payments, totalCharges, totalPayments, balance })
}

// POST /api/finance/folio — action: charge | payment | void_charge
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'charge') {
      const { reservationId, guestId, description, category, amount, quantity, taxAmount, serviceCharge } = body
      if (!reservationId || !guestId || !description || !category || amount === undefined)
        return NextResponse.json({ error: 'reservationId, guestId, description, category, amount required' }, { status: 400 })

      const unitPrice   = amount
      const qty         = quantity || 1
      const tax         = taxAmount      || unitPrice * qty * 0.05
      const svc         = serviceCharge  || unitPrice * qty * 0.10
      const totalAmount = unitPrice * qty + tax + svc

      const charge = await prisma.folio_charges.create({
        data: {
          reservation_id: reservationId,
          guest_id:       guestId,
          description,
          category,
          amount:         unitPrice,
          quantity:       qty,
          unit_price:     unitPrice,
          tax_amount:     tax,
          service_charge: svc,
          total_amount:   totalAmount,
          charge_date:    new Date(),
          posted_by_id:   payload.userId,
          hotel_id:       'hotel_hrg',
        },
      })
      return NextResponse.json({ charge }, { status: 201 })
    }

    if (action === 'payment') {
      const { reservationId, guestId, amount, method, reference } = body
      if (!amount || !method)
        return NextResponse.json({ error: 'amount and method required' }, { status: 400 })

      const payment = await prisma.payment_transactions.create({
        data: {
          reservation_id: reservationId || null,
          guest_id:       guestId       || null,
          amount,
          method,
          reference:      reference || null,
          status:         'PAID',
          hotel_id:       'hotel_hrg',
        },
      })

      // Update reservation paid amount
      if (reservationId) {
        await prisma.reservations.update({
          where: { id: reservationId },
          data:  { paid_amount: { increment: amount } },
        })
      }

      return NextResponse.json({ payment }, { status: 201 })
    }

    if (action === 'void_charge') {
      const { chargeId, reason } = body
      const charge = await prisma.folio_charges.update({
        where: { id: chargeId },
        data:  { voided_at: new Date(), void_reason: reason || null },
      })
      return NextResponse.json({ charge })
    }

    return NextResponse.json({ error: 'Invalid action. Use: charge | payment | void_charge' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
