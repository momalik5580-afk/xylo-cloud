// src/app/api/fnb/menu/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/fnb/menu?outletId=xxx&available=true
// Returns categories + items for a specific outlet (own menu per restaurant)
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const outletId   = searchParams.get('outletId')
  const categoryId = searchParams.get('categoryId')
  const available  = searchParams.get('available')
  const search     = searchParams.get('search')

  // Categories filter — scoped to outlet if provided
  const catWhere: any = {}
  if (outletId) catWhere.outlet_id = outletId

  // Items filter
  const itemWhere: any = { hotel_id: payload.hotel_id }
  if (outletId)              itemWhere.outlet_id   = outletId
  if (categoryId)            itemWhere.category_id = categoryId
  if (available === 'true')  itemWhere.is_available = true
  if (available === 'false') itemWhere.is_available = false
  if (search) itemWhere.name = { contains: search, mode: 'insensitive' }

  const [categories, items] = await Promise.all([
    prisma.menu_categories.findMany({
      where:   catWhere,
      orderBy: { sort_order: 'asc' },
    }),
    prisma.menu_items.findMany({
      where:   itemWhere,
      orderBy: [{ category_id: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, description: true,
        category_id: true, outlet_id: true,
        price: true, cost_price: true,
        calories: true, allergens: true,
        is_vegetarian: true, is_vegan: true,
        is_gluten_free: true, is_halal: true,
        is_available: true, popular: true,
        vip_only: true, image: true,
        spice_level: true, preparation_time: true,
        menu_categories: { select: { name: true } },
      },
    }),
  ])

  return NextResponse.json({ categories, items })
}

// POST /api/fnb/menu — create menu item
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const {
      name, description, categoryId, outletId, price, costPrice,
      calories, allergens, isVegetarian, isVegan, isGlutenFree,
      isHalal, spiceLevel, preparationTime, image, notes, popular, vipOnly,
    } = body

    if (!name || !categoryId || !outletId || price === undefined)
      return NextResponse.json({ error: 'name, categoryId, outletId, price are required' }, { status: 400 })

    // Verify outlet belongs to this hotel
    const outlet = await prisma.outlets.findFirst({
      where: { id: outletId, hotel_id: payload.hotel_id }
    })
    if (!outlet) return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })

    const item = await prisma.menu_items.create({
      data: {
        name,
        description:      description      || null,
        outlet_id:        outletId,
        hotel_id:         payload.hotel_id,
        category_id:      categoryId,
        price,
        cost_price:       costPrice        || null,
        calories:         calories         || null,
        allergens:        allergens        || null,
        is_vegetarian:    isVegetarian     || false,
        is_vegan:         isVegan          || false,
        is_gluten_free:   isGlutenFree     || false,
        is_halal:         isHalal          || false,
        spice_level:      spiceLevel       || null,
        preparation_time: preparationTime  || null,
        is_available:     true,
        image:            image            || null,
        notes:            notes            || null,
        popular:          popular          || false,
        vip_only:         vipOnly          || false,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
