import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

function deriveStatus(res: {
  status: string
  check_in_date: Date
  check_out_date: Date
} | null): 'in-house' | 'arriving-today' | 'departing-today' | 'upcoming' | 'no-reservation' {
  if (!res) return 'no-reservation'
  const now     = new Date()
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const cinDay  = new Date(res.check_in_date.getFullYear(),  res.check_in_date.getMonth(),  res.check_in_date.getDate())
  const coutDay = new Date(res.check_out_date.getFullYear(), res.check_out_date.getMonth(), res.check_out_date.getDate())

  if (res.status === 'CHECKED_IN') {
    if (coutDay.getTime() === today.getTime()) return 'departing-today'
    return 'in-house'
  }
  if (res.status === 'CHECKED_OUT') return 'in-house'  // recently checked out, still show info
  if (cinDay.getTime() === today.getTime()) return 'arriving-today'
  if (cinDay > today) return 'upcoming'
  return 'in-house'
}

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function formatRoomType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tierFilter = searchParams.get('tier')
  const search     = searchParams.get('search')
  const hotel_id   = (payload as any).hotel_id as string | undefined ?? null

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + 30)

  try {
    // Query ALL VIP guests directly — not filtered by reservation
    const guests = await prisma.guests.findMany({
      where: {
        is_vip: true,
        ...(search ? {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name:  { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
        ...(tierFilter && tierFilter !== 'all' ? {
          vip_profiles: { vip_tier: tierFilter },
        } : {}),
      },
      include: {
        vip_profiles:      true,
        guest_preferences: true,
        concierge_tasks: {
          where:   hotel_id ? { hotel_id } : {},
          orderBy: { created_at: 'desc' },
        },
        vip_timeline_events: {
          where:   hotel_id ? { hotel_id } : {},
          orderBy: { event_time: 'asc' },
          take:    30,
        },
        // Get most recent reservation regardless of status
        reservations: {
          where: hotel_id ? { hotel_id } : {},
          include: { rooms: true },
          orderBy: { check_in_date: 'desc' },
          take: 1,
        },
      },
      orderBy: { last_name: 'asc' },
    })

    const result = guests.map((g) => {
      const vip  = g.vip_profiles
      const res  = g.reservations[0] ?? null
      const room = res?.rooms ?? null
      const status = deriveStatus(res)

      const prefMap: Record<string, string[]> = {}
      for (const p of g.guest_preferences) {
        if (!prefMap[p.category]) prefMap[p.category] = []
        prefMap[p.category].push(p.preference)
      }
      const preferences = Object.entries(prefMap).map(([category, items]) => ({ category, items }))

      if (g.preferences && typeof g.preferences === 'object') {
        const jp = g.preferences as Record<string, string[]>
        for (const [cat, items] of Object.entries(jp)) {
          if (Array.isArray(items) && !prefMap[cat]) preferences.push({ category: cat, items })
        }
      }

      const specialRequests = res?.special_requests
        ? res.special_requests.split('\n').filter(Boolean)
        : []

      const nights = res
        ? (res.nights ?? Math.round((res.check_out_date.getTime() - res.check_in_date.getTime()) / 86_400_000))
        : 0

      const tasks = [...g.concierge_tasks]
        .sort((a, b) => (PRIORITY_WEIGHT[a.priority] ?? 99) - (PRIORITY_WEIGHT[b.priority] ?? 99))
        .map((t) => ({
          id:          t.id,
          guestId:     t.guest_id,
          title:       t.title,
          description: t.description || '',
          priority:    (t.priority?.toLowerCase() ?? 'medium') as 'urgent' | 'high' | 'medium' | 'low',
          status:      (t.status?.toLowerCase()   ?? 'pending')  as 'pending' | 'in-progress' | 'completed' | 'escalated',
          assignedTo:  t.assigned_to || 'Concierge',
          department:  t.department  || 'Front Desk',
          createdAt:   t.created_at.toISOString(),
          dueBy:       t.due_by?.toISOString()       ?? undefined,
          completedAt: t.completed_at?.toISOString() ?? undefined,
        }))

      const timeline = g.vip_timeline_events.map((e) => ({
        time:  e.event_time.toISOString(),
        event: e.event_text,
        type:  e.event_type as 'arrival' | 'service' | 'request' | 'departure' | 'note',
      }))

      const avatar = `${g.first_name[0] || ''}${g.last_name[0] || ''}`.toUpperCase()

      return {
        id:                  g.id,
        reservationId:       res?.id ?? '',
        name:                `${g.first_name} ${g.last_name}`,
        tier:                ((vip?.vip_tier || g.loyalty_tier || 'silver').toLowerCase()) as 'platinum' | 'gold' | 'silver',
        nationality:         g.nationality || 'N/A',
        avatar,
        roomNumber:          room?.room_number ?? '—',
        roomType:            room?.type ? formatRoomType(String(room.type)) : '—',
        floor:               room?.floor ?? 0,
        status,
        checkIn:             res?.check_in_date.toISOString().split('T')[0]  ?? '—',
        checkOut:            res?.check_out_date.toISOString().split('T')[0] ?? '—',
        nights,
        rate:                Number(res?.room_rate    ?? 0),
        totalSpend:          Number(res?.total_amount ?? 0),
        previousStays:       vip?.previous_stays ?? 0,
        preferences,
        specialRequests,
        dietaryRestrictions: vip?.dietary_restrictions ?? [],
        allergies:           vip?.allergies            ?? [],
        assignedConcierge:   vip?.assigned_concierge   ?? 'Head Concierge',
        language:            vip?.language             ?? 'English',
        vipNote:             vip?.vip_note || g.vip_notes || '',
        tasks,
        timeline,
        flightNumber:      vip?.flight_number  ?? undefined,
        arrivalTime:       vip?.arrival_time   ?? undefined,
        departureTime:     vip?.departure_time ?? undefined,
        transportRequired: vip?.transport_required ?? false,
      }
    })

    const summary = {
      inHouse:      result.filter((g) => g.status === 'in-house').length,
      arriving:     result.filter((g) => g.status === 'arriving-today').length,
      departing:    result.filter((g) => g.status === 'departing-today').length,
      upcoming:     result.filter((g) => g.status === 'upcoming').length,
      pendingTasks: result.reduce((acc, g) => acc + g.tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length, 0),
      urgentTasks:  result.reduce((acc, g) => acc + g.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length, 0),
    }

    return NextResponse.json({ guests: result, summary })
  } catch (err) {
    console.error('[VIP] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId, status } = await req.json()
    if (!taskId || !status) return NextResponse.json({ error: 'taskId and status required' }, { status: 400 })

    const validStatuses = ['pending', 'in-progress', 'completed', 'escalated']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }

    const task = await prisma.concierge_tasks.update({
      where: { id: taskId },
      data: {
        status,
        completed_at: status === 'completed' ? new Date() : null,
        updated_at:   new Date(),
      },
    })

    return NextResponse.json({ task })
  } catch (err) {
    console.error('[VIP] PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}