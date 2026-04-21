import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// Tier thresholds
const TIERS: Record<string, { min: number; next: string | null }> = {
  STANDARD: { min: 0,     next: 'SILVER'   },
  SILVER:   { min: 1000,  next: 'GOLD'     },
  GOLD:     { min: 5000,  next: 'PLATINUM' },
  PLATINUM: { min: 15000, next: null       },
}

function calculateTier(points: number): string {
  if (points >= 15000) return 'PLATINUM'
  if (points >= 5000)  return 'GOLD'
  if (points >= 1000)  return 'SILVER'
  return 'STANDARD'
}

// GET /api/loyalty/accounts?guestId=&tier=GOLD&search=
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const guestId = searchParams.get('guestId')
  const tier    = searchParams.get('tier')
  const search  = searchParams.get('search')
  const page    = parseInt(searchParams.get('page') || '1')
  const limit   = parseInt(searchParams.get('limit') || '20')

  // Single account lookup
  if (guestId) {
    const account = await prisma.loyalty_accounts.findFirst({
      where: { guest_id: guestId },
      include: {
        guests:               { select: { first_name: true, last_name: true, email: true, phone: true } },
        loyalty_programs:     { select: { name: true, points_per_dollar: true } },
        loyalty_transactions: { orderBy: { created_at: 'desc' }, take: 20 },
      },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const tierInfo = TIERS[account.tier] || TIERS.STANDARD
    const nextTier = tierInfo.next ? TIERS[tierInfo.next] : null
    const progress = nextTier ? Math.min(100, ((account.points_balance - tierInfo.min) / (nextTier.min - tierInfo.min)) * 100).toFixed(1) : 100

    return NextResponse.json({ account, tierProgress: progress, nextTierAt: nextTier?.min || null })
  }

  // List accounts
  const accountWhere: any = {}
  if (tier) accountWhere.tier = tier
  if (search) {
    accountWhere.guests = {
      OR: [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name:  { contains: search, mode: 'insensitive' } },
        { email:      { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [accounts, total] = await Promise.all([
    prisma.loyalty_accounts.findMany({
      where:   accountWhere,
      orderBy: { points_balance: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        guests:           { select: { first_name: true, last_name: true, email: true, is_vip: true } },
        loyalty_programs: { select: { name: true } },
      },
    }),
    prisma.loyalty_accounts.count({ where: accountWhere }),
  ])

  const summary = {
    platinum: await prisma.loyalty_accounts.count({ where: { tier: 'PLATINUM' } }),
    gold:     await prisma.loyalty_accounts.count({ where: { tier: 'GOLD'     } }),
    silver:   await prisma.loyalty_accounts.count({ where: { tier: 'SILVER'   } }),
    standard: await prisma.loyalty_accounts.count({ where: { tier: 'STANDARD' } }),
  }

  return NextResponse.json({ accounts, total, page, limit, pages: Math.ceil(total / limit), summary })
}

// POST /api/loyalty/accounts — enroll guest | add points | redeem points
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'enroll') {
      const { guestId } = body
      if (!guestId) return NextResponse.json({ error: 'guestId required' }, { status: 400 })

      const program = await prisma.loyalty_programs.findFirst({ where: { is_active: true } })
      if (!program) return NextResponse.json({ error: 'No active loyalty program' }, { status: 400 })

      const existing = await prisma.loyalty_accounts.findFirst({ where: { guest_id: guestId, program_id: program.id } })
      if (existing) return NextResponse.json({ account: existing, message: 'Already enrolled' })

      const account = await prisma.loyalty_accounts.create({
        data: {
          guest_id:   guestId,
          program_id: program.id,
          tier:       'STANDARD',
          points_balance:  0,
          points_lifetime: 0,
        },
      })

      await prisma.guests.update({ where: { id: guestId }, data: { loyalty_tier: 'STANDARD', loyalty_number: account.member_number } })

      return NextResponse.json({ account }, { status: 201 })
    }

    if (action === 'add_points') {
      const { accountId, points, description, reservationId } = body
      if (!accountId || !points) return NextResponse.json({ error: 'accountId and points required' }, { status: 400 })

      const current = await prisma.loyalty_accounts.findUnique({ where: { id: accountId } })
      if (!current) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

      const newBalance = current.points_balance + points

      const [account] = await prisma.$transaction([
        prisma.loyalty_accounts.update({
          where: { id: accountId },
          data:  { points_balance: { increment: points }, points_lifetime: { increment: points } },
        }),
        prisma.loyalty_transactions.create({
          data: {
            account_id:     accountId,
            hotel_id:       'hotel_hrg',
            type:           'EARN',
            points,
            balance_after:  newBalance,
            description:    description || 'Points earned',
            reservation_id: reservationId || null,
          },
        }),
      ])

      const newTier = calculateTier(account.points_balance)
      if (newTier !== account.tier) {
        await prisma.loyalty_accounts.update({ where: { id: accountId }, data: { tier: newTier } })
        await prisma.guests.update({ where: { id: account.guest_id }, data: { loyalty_tier: newTier } })
      }

      return NextResponse.json({ account, newTier })
    }

    if (action === 'redeem') {
      const { accountId, points, description } = body
      if (!accountId || !points) return NextResponse.json({ error: 'accountId and points required' }, { status: 400 })

      const acct = await prisma.loyalty_accounts.findUnique({ where: { id: accountId } })
      if (!acct || acct.points_balance < points)
        return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })

      const newBalance = acct.points_balance - points

      const [account] = await prisma.$transaction([
        prisma.loyalty_accounts.update({
          where: { id: accountId },
          data:  { points_balance: { decrement: points } },
        }),
        prisma.loyalty_transactions.create({
          data: {
            account_id:    accountId,
            hotel_id:      'hotel_hrg',
            type:          'REDEEM',
            points:        -points,
            balance_after: newBalance,
            description:   description || 'Points redeemed',
          },
        }),
      ])

      return NextResponse.json({ account })
    }

    return NextResponse.json({ error: 'Invalid action. Use: enroll | add_points | redeem' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}