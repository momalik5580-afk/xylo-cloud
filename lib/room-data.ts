// src/lib/room-data.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomStatus =
  | "occupied"
  | "vacant"
  | "dirty"
  | "inspection"
  | "maintenance"
  | "reserved"

export type RoomType =
  | "standard"
  | "deluxe"
  | "junior-suite"
  | "suite"
  | "presidential"

export interface Room {
  id: string
  number: string
  floor: number
  position: number
  type: RoomType
  status: RoomStatus
  isVIP: boolean
  guestName?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  specialRequests?: string[]
  housekeepingAssigned?: string
  notes?: string
  rate?: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  occupied:    { label: "Occupied",    color: "text-blue-400",    bg: "bg-blue-500",    border: "border-blue-500/40",    dot: "bg-blue-400" },
  vacant:      { label: "Vacant",      color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/40", dot: "bg-emerald-400" },
  dirty:       { label: "Dirty",       color: "text-amber-400",   bg: "bg-amber-500",   border: "border-amber-500/40",   dot: "bg-amber-400" },
  inspection:  { label: "Inspection",  color: "text-purple-400",  bg: "bg-purple-500",  border: "border-purple-500/40",  dot: "bg-purple-400" },
  maintenance: { label: "Maintenance", color: "text-red-400",     bg: "bg-red-500",     border: "border-red-500/40",     dot: "bg-red-400" },
  reserved:    { label: "Reserved",    color: "text-orange-400",  bg: "bg-orange-500",  border: "border-orange-500/40",  dot: "bg-orange-400" },
}

export const TYPE_CONFIG: Record<RoomType, { label: string; short: string; color: string }> = {
  "standard":      { label: "Standard",        short: "STD", color: "text-slate-400" },
  "deluxe":        { label: "Deluxe",          short: "DLX", color: "text-blue-300" },
  "junior-suite":  { label: "Junior Suite",    short: "JRS", color: "text-violet-300" },
  "suite":         { label: "Suite",           short: "STE", color: "text-amber-300" },
  "presidential":  { label: "Presidential",    short: "PRS", color: "text-yellow-300" },
}

// ─── Guest names pool ─────────────────────────────────────────────────────────

const GUEST_NAMES = [
  "James Harrison", "Sofia Andersen", "Mohammed Al-Rashid", "Elena Kovacs",
  "David Chen", "Priya Sharma", "Lucas Oliveira", "Anna Mueller",
  "Carlos Rodriguez", "Yuki Tanaka", "Robert Williams", "Isabelle Dupont",
  "Ahmed Hassan", "Maria Santos", "John Mitchell", "Fatima Al-Zahra",
  "Thomas Bergmann", "Chiara Romano", "Kevin O'Brien", "Nadia Petrov",
  "William Foster", "Amelia Brooks", "Samuel Okonkwo", "Valentina Cruz",
]

const SPECIAL_REQUESTS = [
  "Extra pillows requested",
  "Hypoallergenic bedding",
  "Late checkout 2PM",
  "Early check-in 10AM",
  "High floor preference",
  "Champagne on arrival",
  "Ocean view required",
  "Quiet room requested",
  "Baby crib needed",
  "Airport transfer booked",
  "Dietary restrictions: vegan",
  "Birthday decoration setup",
]

const HK_STAFF = [
  "Maria L.", "John D.", "Sarah K.", "Ahmed H.", "Lisa W.",
  "Carlos M.", "Diana P.", "Robert T.", "Yuki S.", "Emma R.",
]

// ─── Helper function to get room type based on floor and position ───────────

function getTypeForPosition(totalFloors: number, floor: number, pos: number, totalRoomsPerFloor: number): RoomType {
  // Luxury rooms on top floors
  const isTopFloor = floor === totalFloors
  const isUpperFloor = floor > totalFloors / 2
  
  if (isTopFloor) {
    if (pos <= totalRoomsPerFloor * 0.1) return "presidential"
    if (pos <= totalRoomsPerFloor * 0.3) return "suite"
    if (pos <= totalRoomsPerFloor * 0.6) return "junior-suite"
    if (pos <= totalRoomsPerFloor * 0.8) return "deluxe"
    return "standard"
  }
  
  if (isUpperFloor) {
    if (pos <= totalRoomsPerFloor * 0.15) return "suite"
    if (pos <= totalRoomsPerFloor * 0.4) return "junior-suite"
    if (pos <= totalRoomsPerFloor * 0.7) return "deluxe"
    return "standard"
  }
  
  // Lower floors
  if (pos <= totalRoomsPerFloor * 0.1) return "junior-suite"
  if (pos <= totalRoomsPerFloor * 0.3) return "deluxe"
  return "standard"
}

// ─── Generate rooms based on hotel config ───────────────────────────────────

export type GenerateRoomsConfig = {
  totalFloors: number
  totalRooms: number
  roomNumberFormat?: string
}

export function generateRooms(config?: GenerateRoomsConfig): Room[] {
  // Default values if no config provided
  const totalFloors = config?.totalFloors || 5
  const totalRooms = config?.totalRooms || 800
  const roomNumberFormat = config?.roomNumberFormat
  const roomsPerFloor = Math.floor(totalRooms / totalFloors)
  const remainder = totalRooms % totalFloors
  
  const rooms: Room[] = []

  // Status distribution
  const statusPool: RoomStatus[] = [
    "occupied", "occupied", "occupied", "occupied", "occupied", "occupied",
    "occupied", "occupied", "occupied", "occupied", "occupied", "occupied",
    "vacant", "vacant", "vacant", "vacant", "vacant", "vacant",
    "dirty", "dirty", "dirty", "dirty",
    "reserved", "reserved", "reserved",
    "inspection", "inspection",
    "maintenance",
  ]

  // VIP-eligible statuses
  const vipEligible: RoomStatus[] = ["occupied", "reserved"]

  for (let floor = 1; floor <= totalFloors; floor++) {
    // Distribute remainder rooms to first few floors
    const roomsOnThisFloor = roomsPerFloor + (floor <= remainder ? 1 : 0)

    for (let pos = 1; pos <= roomsOnThisFloor; pos++) {
      const seed = floor * 1000 + pos
      const r1 = (Math.sin(seed) * 10000) - Math.floor(Math.sin(seed) * 10000)
      const r2 = (Math.sin(seed + 500) * 10000) - Math.floor(Math.sin(seed + 500) * 10000)
      const r3 = (Math.sin(seed + 1000) * 10000) - Math.floor(Math.sin(seed + 1000) * 10000)
      const r4 = (Math.sin(seed + 1500) * 10000) - Math.floor(Math.sin(seed + 1500) * 10000)
      const r5 = (Math.sin(seed + 2000) * 10000) - Math.floor(Math.sin(seed + 2000) * 10000)

      // Format room number
      const defaultRoomNumber = `${floor.toString().padStart(2, "0")}${pos.toString().padStart(3, "0")}`
      const roomNumber = roomNumberFormat
        ? roomNumberFormat
            .replace("{floor}", floor.toString())
            .replace("{number}", pos.toString().padStart(3, "0"))
        : defaultRoomNumber
      
      // Get room type based on floor and position
      const type = getTypeForPosition(totalFloors, floor, pos, roomsOnThisFloor)

      // Pick status from pool
      const statusIndex = Math.floor(r1 * statusPool.length)
      const status = statusPool[statusIndex]

      // VIP logic
      const isHighValue = type === "suite" || type === "presidential" || type === "junior-suite"
      const vipChance = isHighValue ? 0.35 : 0.10
      const isVIP = vipEligible.includes(status) && r2 < vipChance

      // Guest info for occupied/reserved
      const hasGuest = status === "occupied" || status === "reserved"
      const guestIndex = Math.floor(r3 * GUEST_NAMES.length)
      const guestName = hasGuest ? GUEST_NAMES[guestIndex] : undefined

      // Check-in/out dates
      const today = new Date()
      const checkInOffset = Math.floor(r4 * 5)
      const nights = 1 + Math.floor(r5 * 6)
      const checkIn = hasGuest
        ? new Date(today.getTime() - checkInOffset * 86400000).toISOString().split("T")[0]
        : undefined
      const checkOut = hasGuest && checkIn
        ? new Date(new Date(checkIn).getTime() + nights * 86400000).toISOString().split("T")[0]
        : undefined

      // Special requests for VIPs
      const specialRequests: string[] = []
      if (isVIP) {
        const numRequests = 1 + Math.floor(r2 * 3)
        for (let i = 0; i < numRequests; i++) {
          const reqIndex = Math.floor(((Math.sin(seed + i * 300) * 10000) - Math.floor(Math.sin(seed + i * 300) * 10000)) * SPECIAL_REQUESTS.length)
          const req = SPECIAL_REQUESTS[reqIndex]
          if (!specialRequests.includes(req)) specialRequests.push(req)
        }
      }

      // HK assignment for dirty/inspection
      const needsHK = status === "dirty" || status === "inspection"
      const hkIndex = Math.floor(r3 * HK_STAFF.length)
      const housekeepingAssigned = needsHK ? HK_STAFF[hkIndex] : undefined

      // Rate based on type
      const baseRates: Record<RoomType, number> = {
        standard: 380,
        deluxe: 580,
        "junior-suite": 980,
        suite: 1800,
        presidential: 4500,
      }
      const rateVariance = 0.85 + r4 * 0.3
      const rate = Math.round(baseRates[type] * rateVariance / 10) * 10

      rooms.push({
        id: `room-${floor}-${pos}`,
        number: roomNumber,
        floor,
        position: pos,
        type,
        status,
        isVIP,
        guestName,
        checkIn,
        checkOut,
        nights: hasGuest ? nights : undefined,
        specialRequests: specialRequests.length > 0 ? specialRequests : undefined,
        housekeepingAssigned,
        rate,
      })
    }
  }

  return rooms
}

// ─── Summary stats ─────────────────────────────────────────────────────────────

export function getRoomStats(rooms: Room[]) {
  const stats = {
    total: rooms.length,
    occupied: 0,
    vacant: 0,
    dirty: 0,
    inspection: 0,
    maintenance: 0,
    reserved: 0,
    vip: 0,
    occupancyRate: 0,
  }

  for (const room of rooms) {
    stats[room.status]++
    if (room.isVIP) stats.vip++
  }

  stats.occupancyRate = Math.round((stats.occupied / stats.total) * 100)
  return stats
}