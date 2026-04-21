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

  const item = await prisma.menu_items.findUnique({
    where:   { id: params.id },
    include: { fnb_order_items: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = ['name','description','categoryId','price','costPrice','calories','allergens','isVegetarian','isVegan','isGlutenFree','isHalal','spiceLevel','preparationTime','isAvailable','image','notes']
    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    const item = await prisma.menu_items.update({ where: { id: params.id }, data })
    return NextResponse.json({ item })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.menu_items.update({ where: { id: params.id }, data: { is_available: false } })
  return NextResponse.json({ success: true })
}
