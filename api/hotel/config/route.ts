// src/app/api/hotel/config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/hotel/config
// Returns config for the hotel the logged-in user belongs to
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // If user has a hotel_id, read from hotels table
    if (payload.hotel_id) {
      const hotel = await prisma.hotels.findUnique({
        where: { id: payload.hotel_id }
      })

      if (hotel) {
        const settings = (hotel.settings as any) ?? {}
        return NextResponse.json({
          hotelId:          hotel.id,
          hotelName:        hotel.name,
          address:          hotel.address,
          city:             hotel.city,
          country:          hotel.country,
          phone:            hotel.phone,
          email:            hotel.email,
          website:          hotel.website,
          logo:             hotel.logo,
          totalRooms:       hotel.total_rooms,
          totalFloors:      hotel.total_floors,
          roomNumberFormat: hotel.room_number_format,
          currency:         hotel.currency,
          timezone:         hotel.timezone,
          checkInTime:      hotel.check_in_time,
          checkOutTime:     hotel.check_out_time,
          earlyCheckInFee:  hotel.early_check_in_fee,
          lateCheckOutFee:  hotel.late_check_out_fee,
          taxRate:          hotel.tax_rate,
          serviceCharge:    hotel.service_charge,
          starRating:       hotel.star_rating,
          // Module toggles stored in settings JSON
          modules:          settings.modules ?? {
            spa: true, gym: true, banquet: true,
            ird: true, pool: true, clinic: false,
          },
          outletKpiSettings: settings.outletKpiSettings ?? {
            trackBeverageCost: true,
            trackWaste: true,
            trackLaborCost: true,
            trackTableTurnover: true,
          },
        })
      }
    }

    // Fallback: legacy hotel_config table (single hotel mode)
    const config = await prisma.hotel_config.findFirst()
    if (!config) {
      return NextResponse.json({
        hotelName: 'XYLO Hotel', totalRooms: 450, totalFloors: 4,
        roomNumberFormat: '{floor}{number}', currency: 'USD', timezone: 'UTC',
        checkInTime: '14:00', checkOutTime: '12:00',
        modules: { spa: true, gym: true, banquet: true, ird: true, pool: true, clinic: false },
        outletKpiSettings: { trackBeverageCost: true, trackWaste: true, trackLaborCost: true, trackTableTurnover: true },
      })
    }

    return NextResponse.json({
      hotelName:        config.hotel_name,
      address:          config.address,
      city:             config.city,
      country:          config.country,
      phone:            config.phone,
      email:            config.email,
      website:          config.website,
      logo:             config.logo,
      totalRooms:       config.total_rooms,
      totalFloors:      config.total_floors,
      roomNumberFormat: config.room_number_format,
      currency:         config.currency,
      timezone:         config.timezone,
      checkInTime:      config.check_in_time,
      checkOutTime:     config.check_out_time,
      earlyCheckInFee:  config.early_check_in_fee,
      lateCheckOutFee:  config.late_check_out_fee,
      taxRate:          config.tax_rate,
      serviceCharge:    config.service_charge,
      modules: { spa: true, gym: true, banquet: true, ird: true, pool: true, clinic: false },
      outletKpiSettings: { trackBeverageCost: true, trackWaste: true, trackLaborCost: true, trackTableTurnover: true },
    })
  } catch (error) {
    console.error('Error fetching hotel config:', error)
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 })
  }
}

// POST /api/hotel/config
// Update hotel config — only updates the hotel this user belongs to
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()

    if (payload.hotel_id) {
      // Get current settings so we merge, not overwrite
      const current = await prisma.hotels.findUnique({ where: { id: payload.hotel_id } })
      const currentSettings = (current?.settings as any) ?? {}

      const hotel = await prisma.hotels.update({
        where: { id: payload.hotel_id },
        data: {
          name:               data.hotelName,
          address:            data.address      ?? undefined,
          city:               data.city         ?? undefined,
          country:            data.country      ?? undefined,
          phone:              data.phone        ?? undefined,
          email:              data.email        ?? undefined,
          website:            data.website      ?? undefined,
          logo:               data.logo         ?? undefined,
          total_rooms:        data.totalRooms   ?? undefined,
          total_floors:       data.totalFloors  ?? undefined,
          room_number_format: data.roomNumberFormat ?? undefined,
          currency:           data.currency     ?? undefined,
          timezone:           data.timezone     ?? undefined,
          check_in_time:      data.checkInTime  ?? undefined,
          check_out_time:     data.checkOutTime ?? undefined,
          early_check_in_fee: data.earlyCheckInFee ?? undefined,
          late_check_out_fee: data.lateCheckOutFee ?? undefined,
          tax_rate:           data.taxRate      ?? undefined,
          service_charge:     data.serviceCharge ?? undefined,
          star_rating:        data.starRating   ?? undefined,
          // Merge settings JSON — modules and KPI settings live here
          settings: {
            ...currentSettings,
            ...(data.modules           && { modules: data.modules }),
            ...(data.outletKpiSettings && { outletKpiSettings: data.outletKpiSettings }),
          },
          updated_at: new Date(),
        }
      })

      return NextResponse.json({ success: true, hotelId: hotel.id })
    }

    // Fallback: legacy hotel_config table
    await prisma.hotel_config.upsert({
      where:  { id: 'default' },
      update: {
        hotel_name:         data.hotelName,
        total_rooms:        data.totalRooms,
        total_floors:       data.totalFloors,
        room_number_format: data.roomNumberFormat,
        currency:           data.currency,
        timezone:           data.timezone,
        check_in_time:      data.checkInTime,
        check_out_time:     data.checkOutTime,
        updated_at:         new Date(),
      },
      create: {
        id:                 'default',
        hotel_name:         data.hotelName ?? 'XYLO Hotel',
        total_rooms:        data.totalRooms ?? 450,
        total_floors:       data.totalFloors ?? 4,
        room_number_format: data.roomNumberFormat ?? '{floor}{number}',
        currency:           data.currency ?? 'USD',
        timezone:           data.timezone ?? 'UTC',
        check_in_time:      data.checkInTime ?? '14:00',
        check_out_time:     data.checkOutTime ?? '12:00',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating hotel config:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
