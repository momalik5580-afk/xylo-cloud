import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appt = await prisma.spa_appointments.findUnique({
    where: { id: params.id },
    include: {
      guests:         true,
      users:          true,
      spa_services:   true,
      spa_therapists: true,
      reservations:   { include: { rooms: { select: { room_number: true } } } },
    },
  })
  if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ appointment: appt })
}

// PATCH — update status, therapist, notes, discount, OR process payment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const { status, therapistId, notes, cancellationReason, discount, paymentMethod } = body

    const existing = await prisma.spa_appointments.findUnique({
      where: { id: params.id },
      include: {
        spa_services:   { select: { name: true } },
        spa_therapists: { select: { first_name: true, last_name: true } },
        reservations:   { select: { id: true } },
      }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Verify belongs to this hotel (allow hotel_hrg legacy)
    if (existing.hotel_id && existing.hotel_id !== payload.hotel_id && existing.hotel_id !== 'hotel_hrg') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ── Validate room charge BEFORE making any changes ───────────────────────
    let chargeReservationId = existing.reservation_id
    let chargeGuestId       = existing.guest_id

    if (status === 'COMPLETED' && paymentMethod === 'ROOM_CHARGE') {
      // If no guest_id on appointment (booked via name only), try to find guest by name from notes
      if (!chargeGuestId) {
        const walkinName = existing.notes?.startsWith('Walk-in:')
          ? existing.notes.replace('Walk-in:', '').split('·')[0].split('|')[0].trim()
          : null

        if (walkinName) {
          const nameParts = walkinName.trim().split(' ')
          const firstName = nameParts[0]
          const lastName  = nameParts.slice(1).join(' ')
          const foundGuest = await prisma.guests.findFirst({
            where: {
              first_name: { equals: firstName, mode: 'insensitive' },
              last_name:  { equals: lastName,  mode: 'insensitive' },
            }
          })
          if (foundGuest) chargeGuestId = foundGuest.id
        }
      }

      if (!chargeGuestId) {
        return NextResponse.json({
          error: 'Room charge requires a hotel guest. This guest was not linked to a hotel profile at booking time.'
        }, { status: 400 })
      }

      // Look up active reservation for the guest
      if (!chargeReservationId) {
        const hotelIds = [...new Set([payload.hotel_id, 'hotel_hrg'])]
        const activeRes = await prisma.reservations.findFirst({
          where: {
            guest_id: chargeGuestId,
            hotel_id: { in: hotelIds },
            status:   { in: ['CHECKED_IN', 'CONFIRMED'] },
          },
          orderBy: { check_in_date: 'desc' },
        })
        if (!activeRes) {
          return NextResponse.json({
            error: 'Guest has no active reservation. Use Cash or Card instead.'
          }, { status: 400 })
        }
        chargeReservationId = activeRes.id
      }
    }

    const now  = new Date()
    const data: any = { updated_at: now }

    if (status !== undefined)      data.status       = status
    if (therapistId !== undefined) data.therapist_id = therapistId
    if (notes !== undefined)       data.notes        = notes
    if (discount !== undefined)    data.discount     = discount

    if (status === 'CANCELLED') {
      data.cancelled_at        = now
      data.cancellation_reason = cancellationReason || null
    }
    if (status === 'COMPLETED') {
      data.completed_at = now
      // Append payment to notes — preserve walk-in name stored in existing notes
      if (paymentMethod) {
        const existingNotes = existing.notes ?? ''
        // Keep walk-in info, append payment
        const walkinPart = existingNotes.startsWith('Walk-in:') ? existingNotes.split('|')[0].trim() : ''
        data.notes = walkinPart
          ? `${walkinPart} | Payment: ${paymentMethod.replace(/_/g,' ')}`
          : `Payment: ${paymentMethod.replace(/_/g,' ')}${notes ? ` | ${notes}` : ''}`
      }
    }

    const appointment = await prisma.spa_appointments.update({
      where:   { id: params.id },
      data,
      include: {
        guests:         { select: { first_name: true, last_name: true, is_vip: true } },
        spa_services:   { select: { name: true, category: true, duration: true } },
        spa_therapists: { select: { first_name: true, last_name: true } },
        reservations:   { include: { rooms: { select: { room_number: true } } } },
      }
    })

    // ── Process payment ───────────────────────────────────────────────────────
    if (status === 'COMPLETED' && paymentMethod) {
      const totalAmount = Number(existing.total_price ?? existing.price)
      const taxAmount   = totalAmount * 0.14

      if (paymentMethod === 'ROOM_CHARGE') {
        const serviceName = existing.spa_services?.name ?? 'Spa Treatment'
        await prisma.folio_charges.create({
          data: {
            reservation_id: chargeReservationId!,
            guest_id:       chargeGuestId!,
            description:    `Spa: ${serviceName}`,
            category:       'SPA',
            amount:         totalAmount,
            quantity:       1,
            unit_price:     totalAmount,
            tax_amount:     taxAmount,
            service_charge: 0,
            total_amount:   totalAmount + taxAmount,
            reference_id:   existing.id,
            reference_type: 'spa_appointment',
            posted_by_id:   payload.userId || null,
            hotel_id:       payload.hotel_id,
            charge_date:    now,
          }
        }).catch(e => console.error('Folio charge error:', e.message))
      }

      // Cash / Card / other — just record in notes (already done above)
      // No additional DB action needed for non-room-charge payments

      broadcastToHotel(payload.hotel_id, {
        type: 'spa',
        payload: {
          action:        'payment_processed',
          appointmentId: params.id,
          amount:        totalAmount,
          method:        paymentMethod,
        }
      })
    }

    broadcastToHotel(payload.hotel_id, {
      type: 'spa',
      payload: { action: 'updated', appointmentId: params.id, status }
    })

    return NextResponse.json({ appointment })
  } catch (e: any) {
    console.error('SPA PATCH error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.spa_appointments.update({
    where: { id: params.id },
    data:  { status: 'CANCELLED', cancelled_at: new Date() },
  })
  return NextResponse.json({ success: true })
}
