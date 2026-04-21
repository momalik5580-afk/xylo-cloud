// ─── Types ────────────────────────────────────────────────────────────────────

export type VIPTier = "platinum" | "gold" | "silver"
export type GuestStatus = "in-house" | "arriving-today" | "departing-today" | "upcoming" | "no-reservation"
export type RequestStatus = "pending" | "in-progress" | "completed" | "escalated"
export type TaskPriority = "urgent" | "high" | "medium" | "low"

export interface GuestPreference {
  category: string
  items: string[]
}

export interface ConciergeTask {
  id: string
  guestId: string
  title: string
  description: string
  priority: TaskPriority
  status: RequestStatus
  assignedTo: string
  department: string
  createdAt: string
  dueBy?: string
  completedAt?: string
}

export interface GuestTimeline {
  time: string
  event: string
  type: "arrival" | "service" | "request" | "departure" | "note"
}

export interface VIPGuest {
  id: string
  name: string
  tier: VIPTier
  nationality: string
  avatar: string // initials
  roomNumber: string
  roomType: string
  floor: number
  status: GuestStatus
  checkIn: string
  checkOut: string
  nights: number
  rate: number
  totalSpend: number
  previousStays: number
  preferences: GuestPreference[]
  specialRequests: string[]
  dietaryRestrictions: string[]
  allergies: string[]
  assignedConcierge: string
  language: string
  vipNote: string
  tasks: ConciergeTask[]
  timeline: GuestTimeline[]
  arrivalTime?: string
  departureTime?: string
  flightNumber?: string
  transportRequired: boolean
}

// ─── Tier config ──────────────────────────────────────────────────────────────

export const TIER_CONFIG: Record<VIPTier, {
  label: string
  color: string
  bg: string
  border: string
  stars: number
}> = {
  platinum: {
    label: "Platinum",
    color: "text-[#8E939D]",
    bg: "bg-slate-400/20",
    border: "border-slate-400/40",
    stars: 3,
  },
  gold: {
    label: "Gold",
    color: "text-yellow-300",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/40",
    stars: 2,
  },
  silver: {
    label: "Silver",
    color: "text-slate-300",
    bg: "bg-slate-500/20",
    border: "border-slate-500/40",
    stars: 1,
  },
}

export const STATUS_CONFIG: Record<GuestStatus, {
  label: string
  color: string
  bg: string
  border: string
  dot: string
}> = {
  "in-house":        { label: "In House",        color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  "arriving-today":  { label: "Arriving Today",  color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30",    dot: "bg-blue-400 animate-pulse" },
  "departing-today": { label: "Departing Today", color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  "upcoming":        { label: "Upcoming",        color: "text-purple-400",  bg: "bg-purple-500/15",  border: "border-purple-500/30",  dot: "bg-purple-400" },
  "no-reservation":  { label: "No Reservation",  color: "text-slate-400",   bg: "bg-slate-500/15",   border: "border-slate-500/30",   dot: "bg-slate-400" },
}

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, {
  label: string
  color: string
  bg: string
}> = {
  pending:     { label: "Pending",     color: "text-amber-400",  bg: "bg-amber-500/15"  },
  "in-progress": { label: "In Progress", color: "text-blue-400",   bg: "bg-blue-500/15"   },
  completed:   { label: "Completed",   color: "text-emerald-400", bg: "bg-emerald-500/15" },
  escalated:   { label: "Escalated",   color: "text-red-400",    bg: "bg-red-500/15"    },
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-400" },
  high:   { label: "High",   color: "text-orange-400" },
  medium: { label: "Medium", color: "text-amber-400" },
  low:    { label: "Low",    color: "text-slate-400" },
}

// ─── Mock VIP Data ────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
const in5days = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]
const in2days = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0]

export const VIP_GUESTS: VIPGuest[] = [
  {
    id: "vip-001",
    name: "Sheikh Mohammed Al-Rashid",
    tier: "platinum",
    nationality: "UAE 🇦🇪",
    avatar: "MA",
    roomNumber: "2001",
    roomType: "Presidential Suite",
    floor: 20,
    status: "in-house",
    checkIn: yesterday,
    checkOut: in5days,
    nights: 7,
    rate: 4500,
    totalSpend: 38420,
    previousStays: 14,
    language: "Arabic / English",
    assignedConcierge: "Antoine Renard",
    vipNote: "Long-term platinum member. Requires absolute privacy. Personal security team of 3. Private meeting room reserved daily 10AM–2PM.",
    preferences: [
      { category: "Room", items: ["Highest floor", "City view", "Extra-firm mattress", "Temperature 21°C"] },
      { category: "F&B", items: ["Halal certified only", "Fresh dates on arrival", "Sparkling water (Perrier)", "No alcohol in room"] },
      { category: "Service", items: ["Daily newspaper (Arabic Al-Hayat + English FT)", "Private check-in", "Butler service 24/7"] },
      { category: "Amenities", items: ["Prayer mat & Qibla direction", "Luxury bath products (Acqua di Parma)", "Flowers: White orchids only"] },
    ],
    specialRequests: [
      "Private meeting room daily 10AM–2PM (Conference B)",
      "Security team room adjacent on same floor",
      "No photography policy — alert all staff",
      "Rolls Royce Phantom for all transfers",
    ],
    dietaryRestrictions: ["Halal only", "No pork derivatives", "No alcohol"],
    allergies: ["Shellfish", "Peanuts"],
    transportRequired: true,
    flightNumber: "EK 002",
    tasks: [
      {
        id: "t-001",
        guestId: "vip-001",
        title: "Daily Arabic newspaper delivery",
        description: "Al-Hayat + Financial Times delivered by 6AM every morning",
        priority: "high",
        status: "in-progress",
        assignedTo: "Room Service",
        department: "F&B",
        createdAt: `${today}T06:00:00`,
        dueBy: `${today}T06:30:00`,
      },
      {
        id: "t-002",
        guestId: "vip-001",
        title: "Conference Room B setup",
        description: "Meeting room prepared daily, Arabic tea service, whiteboard, AV equipment tested",
        priority: "urgent",
        status: "pending",
        assignedTo: "Antoine Renard",
        department: "Concierge",
        createdAt: `${today}T08:00:00`,
        dueBy: `${today}T09:45:00`,
      },
      {
        id: "t-003",
        guestId: "vip-001",
        title: "Rolls Royce Phantom arranged",
        description: "Vehicle + driver on standby from 2PM for city tour",
        priority: "high",
        status: "completed",
        assignedTo: "Concierge",
        department: "Concierge",
        createdAt: `${today}T07:00:00`,
        completedAt: `${today}T08:30:00`,
      },
    ],
    timeline: [
      { time: "Yesterday 14:22", event: "VIP private check-in — Presidential Suite 2001", type: "arrival" },
      { time: "Yesterday 15:00", event: "White orchids and welcome amenities delivered", type: "service" },
      { time: "Yesterday 19:30", event: "In-room Halal dining ordered — Room Service", type: "service" },
      { time: "Today 06:05", event: "Newspapers delivered — Al-Hayat & FT", type: "service" },
      { time: "Today 09:30", event: "Conference Room B requested for 10AM", type: "request" },
    ],
  },

  {
    id: "vip-002",
    name: "Countess Elena von Hartmann",
    tier: "platinum",
    nationality: "Germany 🇩🇪",
    avatar: "EH",
    roomNumber: "1901",
    roomType: "Royal Suite",
    floor: 19,
    status: "arriving-today",
    checkIn: today,
    checkOut: in3days,
    nights: 3,
    rate: 3200,
    totalSpend: 12800,
    previousStays: 8,
    language: "German / English / French",
    assignedConcierge: "Sophie Beaumont",
    vipNote: "European aristocracy. Extremely private. Prefers classic luxury, no modern minimalism. Travelling with personal assistant Ms. Keller (adjacent room 1902).",
    arrivalTime: "16:45",
    flightNumber: "LH 590",
    preferences: [
      { category: "Room", items: ["Classic décor preferred", "Fresh flowers daily (pink peonies)", "Cashmere throw", "Feather-down pillows"] },
      { category: "F&B", items: ["Dom Pérignon on ice upon arrival", "Continental breakfast in room 8AM", "Afternoon tea 4PM daily"] },
      { category: "Service", items: ["Turn-down with rose petals at 7PM", "Personal shopping assistance", "Spa appointment pre-arranged"] },
    ],
    specialRequests: [
      "Dom Pérignon 2015 in ice bucket upon arrival",
      "Pink peonies bouquet — suite and bathroom",
      "Adjacent room 1902 booked for Ms. Keller (PA)",
      "Spa booking: Swedish massage Monday 10AM",
      "Private dining reservation: Altitude Restaurant Thursday 8PM",
    ],
    dietaryRestrictions: ["Vegetarian", "No garlic"],
    allergies: ["Latex", "Certain perfumes — advise staff no strong fragrances"],
    transportRequired: true,
    tasks: [
      {
        id: "t-004",
        guestId: "vip-002",
        title: "Pre-arrival room preparation",
        description: "Pink peonies, champagne on ice, Cashmere throw — all ready by 16:00",
        priority: "urgent",
        status: "in-progress",
        assignedTo: "Sophie Beaumont",
        department: "Concierge",
        createdAt: `${today}T10:00:00`,
        dueBy: `${today}T15:30:00`,
      },
      {
        id: "t-005",
        guestId: "vip-002",
        title: "Airport transfer — LH 590",
        description: "Mercedes S-Class to collect from Terminal 1, flight lands 16:10 ETA",
        priority: "urgent",
        status: "pending",
        assignedTo: "Driver: Hans M.",
        department: "Concierge",
        createdAt: `${today}T08:00:00`,
        dueBy: `${today}T15:45:00`,
      },
      {
        id: "t-006",
        guestId: "vip-002",
        title: "Spa booking confirmation",
        description: "Swedish massage Monday 10AM — confirm with Wellness team",
        priority: "medium",
        status: "completed",
        assignedTo: "Spa Reception",
        department: "Wellness",
        createdAt: `${today}T09:00:00`,
        completedAt: `${today}T09:45:00`,
      },
    ],
    timeline: [
      { time: "09:00", event: "Arrival alert issued — all departments notified", type: "note" },
      { time: "09:45", event: "Spa booking confirmed — Monday 10AM", type: "service" },
      { time: "10:00", event: "Room preparation started — Housekeeping", type: "service" },
      { time: "ETA 16:45", event: "Expected arrival from Frankfurt (LH 590)", type: "arrival" },
    ],
  },

  {
    id: "vip-003",
    name: "Mr. David Chen",
    tier: "gold",
    nationality: "Hong Kong 🇭🇰",
    avatar: "DC",
    roomNumber: "1801",
    roomType: "Executive Suite",
    floor: 18,
    status: "in-house",
    checkIn: today,
    checkOut: in2days,
    nights: 2,
    rate: 1800,
    totalSpend: 5940,
    previousStays: 5,
    language: "Cantonese / Mandarin / English",
    assignedConcierge: "James Park",
    vipNote: "Tech executive — CEO of Pacific Ventures. Works unusual hours, often orders room service after midnight. Loyalty Gold member since 2021.",
    preferences: [
      { category: "Room", items: ["High-speed WiFi (dedicated line preferred)", "Standing desk setup", "Multiple device charging stations", "Blackout curtains"] },
      { category: "F&B", items: ["Chinese tea selection", "Congee available for breakfast", "No MSG", "Late-night dining required"] },
      { category: "Service", items: ["DND respected at all times", "Digital key only", "Tech support on-call"] },
    ],
    specialRequests: [
      "Dedicated WiFi bandwidth — IT department to set up",
      "Standing desk and ergonomic chair in suite",
      "Late checkout requested — 3PM",
      "Business lounge access 24/7",
    ],
    dietaryRestrictions: ["No MSG", "Low sodium"],
    allergies: [],
    transportRequired: false,
    tasks: [
      {
        id: "t-007",
        guestId: "vip-003",
        title: "Dedicated WiFi line setup",
        description: "IT to configure dedicated high-speed line for Suite 1801 — 1Gbps minimum",
        priority: "high",
        status: "completed",
        assignedTo: "IT Dept.",
        department: "IT",
        createdAt: `${today}T12:00:00`,
        completedAt: `${today}T13:30:00`,
      },
      {
        id: "t-008",
        guestId: "vip-003",
        title: "Late checkout approval",
        description: "3PM checkout requested — coordinate with Housekeeping and Front Office",
        priority: "medium",
        status: "pending",
        assignedTo: "James Park",
        department: "Front Office",
        createdAt: `${today}T14:00:00`,
      },
    ],
    timeline: [
      { time: "12:30", event: "Express check-in via digital key — Suite 1801", type: "arrival" },
      { time: "13:30", event: "Dedicated WiFi line configured by IT", type: "service" },
      { time: "14:00", event: "Late checkout 3PM requested", type: "request" },
      { time: "15:45", event: "Standing desk delivered and set up", type: "service" },
    ],
  },

  {
    id: "vip-004",
    name: "Mrs. Priya & Raj Sharma",
    tier: "gold",
    nationality: "India 🇮🇳",
    avatar: "PS",
    roomNumber: "1502",
    roomType: "Honeymoon Suite",
    floor: 15,
    status: "in-house",
    checkIn: yesterday,
    checkOut: in3days,
    nights: 5,
    rate: 1600,
    totalSpend: 8200,
    previousStays: 1,
    language: "Hindi / English",
    assignedConcierge: "Lucia Moretti",
    vipNote: "Honeymoon couple — first stay at XYLO. Anniversary dinner booked. Handle with exceptional personal attention — first impressions critical for loyalty.",
    preferences: [
      { category: "Room", items: ["Rose petal turndown nightly", "Romantic lighting", "Complimentary anniversary cake"] },
      { category: "F&B", items: ["Vegetarian options always available", "Indian breakfast options", "Champagne on arrival"] },
      { category: "Service", items: ["Couple's spa package arranged", "Photography session coordinated", "Surprise anniversary setup Day 3"] },
    ],
    specialRequests: [
      "Rose petals on bed every evening",
      "Anniversary surprise dinner setup on Day 3 — balcony",
      "Couple's spa: Hot stone massage tomorrow 11AM",
      "Complimentary anniversary cake (chocolate)",
      "Photographer for formal portrait — arrange on request",
    ],
    dietaryRestrictions: ["Vegetarian (both)", "No beef"],
    allergies: ["Nuts (Priya — moderate)"],
    transportRequired: false,
    tasks: [
      {
        id: "t-009",
        guestId: "vip-004",
        title: "Anniversary dinner balcony setup",
        description: "Candlelit table, rose arrangement, champagne, personalized menu — surprise for Day 3 evening",
        priority: "high",
        status: "pending",
        assignedTo: "Lucia Moretti",
        department: "F&B",
        createdAt: `${today}T09:00:00`,
        dueBy: `${in2days}T18:00:00`,
      },
      {
        id: "t-010",
        guestId: "vip-004",
        title: "Couple's spa — Hot stone massage",
        description: "Tomorrow 11AM — Suite 1502 guests. Nut-free products only (Priya allergy).",
        priority: "high",
        status: "in-progress",
        assignedTo: "Spa Team",
        department: "Wellness",
        createdAt: `${today}T10:00:00`,
        dueBy: `${tomorrow}T10:45:00`,
      },
    ],
    timeline: [
      { time: "Yesterday 15:00", event: "Honeymoon arrival — champagne & roses setup complete", type: "arrival" },
      { time: "Yesterday 20:00", event: "Welcome dinner at Altitude — F&B coordinated", type: "service" },
      { time: "Today 09:00", event: "Anniversary dinner (Day 3) planning started", type: "request" },
      { time: "Today 10:00", event: "Spa appointment confirmed — nut-free products noted", type: "service" },
    ],
  },

  {
    id: "vip-005",
    name: "Ms. Valentina Cruz",
    tier: "silver",
    nationality: "Mexico 🇲🇽",
    avatar: "VC",
    roomNumber: "1203",
    roomType: "Deluxe Ocean View",
    floor: 12,
    status: "departing-today",
    checkIn: yesterday,
    checkOut: today,
    nights: 2,
    rate: 980,
    totalSpend: 3140,
    previousStays: 2,
    language: "Spanish / English",
    assignedConcierge: "Marco Bianchi",
    vipNote: "Silver member. Departing today at 14:00. Arrange express checkout and farewell amenity. Follow-up survey to be sent within 24h.",
    departureTime: "14:00",
    flightNumber: "AM 406",
    preferences: [
      { category: "F&B", items: ["Strong espresso in mornings", "Fresh fruit platter"] },
      { category: "Service", items: ["Express checkout", "Luggage assistance"] },
    ],
    specialRequests: [
      "Express checkout — bill to corporate card on file",
      "Luggage to lobby by 13:30",
      "Farewell amenity from management",
    ],
    dietaryRestrictions: [],
    allergies: [],
    transportRequired: true,
    tasks: [
      {
        id: "t-011",
        guestId: "vip-005",
        title: "Express checkout preparation",
        description: "Bill finalized, corporate card charged, express checkout packet ready",
        priority: "urgent",
        status: "in-progress",
        assignedTo: "Front Desk",
        department: "Front Office",
        createdAt: `${today}T11:00:00`,
        dueBy: `${today}T13:00:00`,
      },
      {
        id: "t-012",
        guestId: "vip-005",
        title: "Farewell amenity delivery",
        description: "Management farewell gift + handwritten note from GM",
        priority: "medium",
        status: "pending",
        assignedTo: "Marco Bianchi",
        department: "Concierge",
        createdAt: `${today}T11:30:00`,
        dueBy: `${today}T13:15:00`,
      },
    ],
    timeline: [
      { time: "Yesterday 12:00", event: "Check-in — Deluxe Ocean View 1203", type: "arrival" },
      { time: "Yesterday 14:00", event: "Espresso and fruit platter delivered", type: "service" },
      { time: "Today 11:00", event: "Departure request confirmed — 14:00", type: "request" },
      { time: "Today 13:30", event: "Luggage to be collected", type: "departure" },
      { time: "Today 14:00", event: "Scheduled departure", type: "departure" },
    ],
  },

  {
    id: "vip-006",
    name: "Ambassador Robert Williams",
    tier: "platinum",
    nationality: "United States 🇺🇸",
    avatar: "RW",
    roomNumber: "1903",
    roomType: "Diplomatic Suite",
    floor: 19,
    status: "upcoming",
    checkIn: in2days,
    checkOut: in5days,
    nights: 3,
    rate: 2800,
    totalSpend: 0,
    previousStays: 11,
    language: "English",
    assignedConcierge: "Antoine Renard",
    vipNote: "US diplomatic staff — requires security sweep of suite before arrival. Coordinate with hotel security. Dietary requirements strict. Press/media blackout.",
    arrivalTime: "11:00",
    flightNumber: "AA 100",
    preferences: [
      { category: "Room", items: ["Security swept suite", "Separate sitting room", "US-standard voltage adapters"] },
      { category: "F&B", items: ["Gluten-free certified kitchen", "American breakfast", "Still water (Evian)"] },
      { category: "Service", items: ["Press blackout — no photography", "Security liaison coordination", "Priority elevator access"] },
    ],
    specialRequests: [
      "Security sweep of suite 24h before arrival — coordinate with Head of Security",
      "Press/media total blackout — brief all front-line staff",
      "Priority elevator access during stay",
      "Gluten-free menu pre-approved by executive chef",
    ],
    dietaryRestrictions: ["Strict gluten-free (Celiac disease)"],
    allergies: ["Gluten (severe — Celiac)"],
    transportRequired: true,
    tasks: [
      {
        id: "t-013",
        guestId: "vip-006",
        title: "Security sweep — Suite 1903",
        description: "Full sweep to be completed 24h before arrival. Coordinate with hotel security and diplomatic security team.",
        priority: "urgent",
        status: "pending",
        assignedTo: "Head of Security",
        department: "Security",
        createdAt: `${today}T09:00:00`,
        dueBy: `${in2days}T10:00:00`,
      },
      {
        id: "t-014",
        guestId: "vip-006",
        title: "Staff briefing — media blackout",
        description: "Brief all front desk, F&B, and concierge staff on media/photography policy",
        priority: "high",
        status: "pending",
        assignedTo: "GM Office",
        department: "Management",
        createdAt: `${today}T10:00:00`,
        dueBy: `${in2days}T08:00:00`,
      },
      {
        id: "t-015",
        guestId: "vip-006",
        title: "Gluten-free menu approval",
        description: "Executive chef to approve dedicated GF menu for Ambassador's stay",
        priority: "high",
        status: "in-progress",
        assignedTo: "Exec. Chef",
        department: "Kitchen",
        createdAt: `${today}T11:00:00`,
      },
    ],
    timeline: [
      { time: "Today 09:00", event: "Arrival alert sent to all departments", type: "note" },
      { time: "Today 09:00", event: "Security sweep request issued", type: "request" },
      { time: "Today 10:00", event: "Staff briefing scheduled", type: "note" },
      { time: `${in2days} 11:00`, event: "Expected arrival", type: "arrival" },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getVIPSummary() {
  const inHouse    = VIP_GUESTS.filter((g) => g.status === "in-house").length
  const arriving   = VIP_GUESTS.filter((g) => g.status === "arriving-today").length
  const departing  = VIP_GUESTS.filter((g) => g.status === "departing-today").length
  const upcoming   = VIP_GUESTS.filter((g) => g.status === "upcoming").length
  const platinum   = VIP_GUESTS.filter((g) => g.tier === "platinum").length
  const gold       = VIP_GUESTS.filter((g) => g.tier === "gold").length
  const silver     = VIP_GUESTS.filter((g) => g.tier === "silver").length
  const pendingTasks = VIP_GUESTS.flatMap((g) => g.tasks).filter((t) => t.status === "pending" || t.status === "escalated").length
  const urgentTasks  = VIP_GUESTS.flatMap((g) => g.tasks).filter((t) => t.priority === "urgent" && t.status !== "completed").length
  return { inHouse, arriving, departing, upcoming, platinum, gold, silver, pendingTasks, urgentTasks }
}