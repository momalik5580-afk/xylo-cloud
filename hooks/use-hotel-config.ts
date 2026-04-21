// src/hooks/use-hotel-config.ts
import { useState, useEffect } from 'react'

export type OutletType = "restaurant" | "bar" | "cafe" | "room-service" | "banquet"

export interface OutletConfig {
  id:              string
  name:            string
  code?:           string
  type:            OutletType
  status:          string
  openingTime?:    string | null
  closingTime?:    string | null
  twoSeatTables?:  number
  fourSeatTables?: number
  sixSeatTables?:  number
  tableCount?:     number
  orderCount?:     number
}

export interface OutletKpiSettings {
  trackBeverageCost:  boolean
  trackWaste:         boolean
  trackLaborCost:     boolean
  trackTableTurnover: boolean
}

export interface HotelConfig {
  hotelId?:          string
  hotelName:         string
  totalRooms:        number
  totalFloors:       number
  roomNumberFormat:  string
  currency:          string
  timezone:          string
  checkInTime:       string
  checkOutTime:      string
  outlets:           OutletConfig[]
  modules:           Record<string, boolean>
  outletKpiSettings: OutletKpiSettings
}

const DEFAULT_CONFIG: HotelConfig = {
  hotelName:        'XYLO Hotel',
  totalRooms:       450,
  totalFloors:      4,
  roomNumberFormat: '{floor}{number}',
  currency:         'USD',
  timezone:         'UTC',
  checkInTime:      '14:00',
  checkOutTime:     '12:00',
  outlets:          [],
  modules: {
    spa: true, gym: true, banquet: true,
    ird: true, pool: true, clinic: false,
  },
  outletKpiSettings: {
    trackBeverageCost:  true,
    trackWaste:         true,
    trackLaborCost:     true,
    trackTableTurnover: true,
  },
}

export function useHotelConfig() {
  const [config,  setConfig]  = useState<HotelConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Fetch hotel config and outlets in parallel
        const [configRes, outletsRes] = await Promise.all([
          fetch('/api/hotel/config'),
          fetch('/api/outlets'),
        ])

        if (!configRes.ok) throw new Error('Failed to load hotel config')

        const configData  = await configRes.json()
        const outletsData = outletsRes.ok ? await outletsRes.json() : { outlets: [] }

        if (cancelled) return

        setConfig({
          hotelId:          configData.hotelId,
          hotelName:        configData.hotelName        ?? DEFAULT_CONFIG.hotelName,
          totalRooms:       configData.totalRooms       ?? DEFAULT_CONFIG.totalRooms,
          totalFloors:      configData.totalFloors      ?? DEFAULT_CONFIG.totalFloors,
          roomNumberFormat: configData.roomNumberFormat ?? DEFAULT_CONFIG.roomNumberFormat,
          currency:         configData.currency         ?? DEFAULT_CONFIG.currency,
          timezone:         configData.timezone         ?? DEFAULT_CONFIG.timezone,
          checkInTime:      configData.checkInTime      ?? DEFAULT_CONFIG.checkInTime,
          checkOutTime:     configData.checkOutTime     ?? DEFAULT_CONFIG.checkOutTime,
          outlets:          outletsData.outlets         ?? [],
          modules:          configData.modules          ?? DEFAULT_CONFIG.modules,
          outletKpiSettings: configData.outletKpiSettings ?? DEFAULT_CONFIG.outletKpiSettings,
        })
      } catch (e: any) {
        if (cancelled) return
        console.error('useHotelConfig error:', e)
        setError(e)
        // Fall back to defaults so the app doesn't break
        setConfig(DEFAULT_CONFIG)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { config, loading, error }
}
