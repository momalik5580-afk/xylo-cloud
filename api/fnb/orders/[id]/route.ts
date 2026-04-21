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

  const order = await prisma.fnb_orders.findUnique({
    where:   { id: params.id },
    include: {
  fnb_order_items: true,
  restaurant_tables_fnb_orders_table_idTorestaurant_tables: { select: { table_number: true, section: true } },
},
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order })
}

// PATCH — update status: PENDING→PREPARING→READY→SERVED→PAID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status, paidAmount, paymentMethod, kitchenNotes } = await req.json()

    const data: any = {}
    if (status !== undefined)        data.status         = status
    if (kitchenNotes !== undefined)  data.kitchen_notes  = kitchenNotes
    if (paidAmount !== undefined)    data.paid_amount    = paidAmount
    if (paymentMethod !== undefined) data.payment_method = paymentMethod

    if (status === 'PREPARING') data.prepared_at = null
    if (status === 'READY')     data.prepared_at = new Date()
    if (status === 'SERVED')    data.served_at   = new Date()
    if (status === 'PAID')      data.billed_at   = new Date()

    const order = await prisma.fnb_orders.update({ where: { id: params.id }, data })
    return NextResponse.json({ order })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
