"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Sparkles, Calendar, Clock, User, DollarSign, BookOpen, ChevronRight, Loader2, Crown,
  Heart, Droplets, Sun, Moon, Leaf,
  Plus, Search, Filter, CheckCircle2, AlertCircle,
  TrendingUp, ArrowUpRight, Users, Star,
  Shield, AlertTriangle, Camera, FileText,
  Syringe, Activity, Dumbbell, 
  Umbrella, Bath, Wine, Award, Percent,
  Lock, Eye, EyeOff, ThermometerSun,
  Sunset, Wind, Coffee, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useHotelConfig } from "@/hooks/use-hotel-config"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AppointmentStatus = "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show"
type ServiceType = "massage" | "facial" | "body" | "wellness" | "beauty" | "medical" | "gym" | "beach"
type TherapistStatus = "available" | "busy" | "break" | "off"
type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance"
type CabanaStatus = "available" | "reserved" | "occupied" | "cleaning"
type MedicalProcedureType = "botox" | "filler" | "laser" | "prp" | "minor-surgery" | "consultation"

interface SpaAppointment {
  id: string
  guestName: string
  guestId?: string
  reservationId?: string
  roomNumber: string
  isVip: boolean
  vipLevel?: "platinum" | "gold" | "silver"
  service: string
  serviceType: ServiceType
  serviceId?: string
  therapist: string
  therapistId?: string
  doctor?: string
  doctorId?: string
  status: AppointmentStatus
  date: string
  startTime: string
  endTime: string
  price: number
  cost?: number
  commission?: number
  notes?: string
  rating?: number
  feedback?: string
  medicalProcedure?: boolean
  consentSigned?: boolean
  beforePhoto?: string
  afterPhoto?: string
  prescription?: string
  followUpDate?: string
}

interface Therapist {
  id: string
  name: string
  avatar?: string
  specialty: string
  specialization: string[]
  certifications: string[]
  languages: string[]
  status: TherapistStatus
  appointmentsToday: number
  rating: number
  revenueGenerated: number
  utilizationRate: number
  commission: number
  medicalLicense?: string
  doctor?: boolean
  schedule: {
    day: string
    start: string
    end: string
  }[]
}

interface TreatmentRoom {
  id: string
  name: string
  type: string
  roomType: "massage" | "facial" | "medical" | "consultation" | "gym" | "studio"
  equipment: string[]
  status: RoomStatus
  currentGuest?: string
  currentAppointment?: string
  nextBooking?: string
  cleaningTime: number
  temperature?: number
  humidity?: number
}

interface Cabana {
  id: string
  number: string
  location: "beach" | "pool" | "garden"
  status: CabanaStatus
  currentGuest?: string
  guestRoom?: string
  startTime?: string
  endTime?: string
  foodOrdered: boolean
  attendant?: string
  amenities: string[]
}

interface GymClass {
  id: string
  name: string
  type: "yoga" | "pilates" | "hiit" | "spinning" | "meditation" | "personal"
  instructor: string
  location: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  price: number
  guestOnly: boolean
}

interface Product {
  id: string
  name: string
  category: "oil" | "skincare" | "supplement" | "bath" | "gift"
  price: number
  cost: number
  stock: number
  commission: number
  therapistCommission?: number
  vipOnly: boolean
}

interface WellnessPackage {
  id: string
  name: string
  description: string
  services: string[]
  products: string[]
  totalPrice: number
  packagePrice: number
  savings: number
  duration: string
  recommendedFor: string[]
}

interface MedicalRecord {
  id: string
  guestId: string
  guestName: string
  procedure: MedicalProcedureType
  date: string
  doctor: string
  notes: string
  photos: string[]
  consentFile: string
  followUpDate?: string
  restricted: boolean
}

interface NewBookingForm {
  guestName: string
  roomNumber: string
  isVip: boolean
  vipLevel: "platinum" | "gold" | "silver"
  serviceType: ServiceType
  service: string
  therapistId: string
  date: string
  startTime: string
  duration: number
  notes: string
  medicalProcedure: boolean
  requireConsent: boolean
}

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

export function SpaContent() {
  const [activeTab, setActiveTab] = useState("live")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [appointments, setAppointments] = useState<SpaAppointment[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [rooms, setRooms] = useState<TreatmentRoom[]>([])
  const [cabanas, setCabanas] = useState<Cabana[]>([])
  const [gymClasses, setGymClasses] = useState<GymClass[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [packages, setPackages] = useState<WellnessPackage[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMedical, setShowMedical] = useState(false)
  const [userRole, setUserRole] = useState<"director" | "medical" | "receptionist" | "therapist" | "gm">("director")
  
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<SpaAppointment | null>(null)
  const [isMedicalRecordOpen, setIsMedicalRecordOpen] = useState(false)
  const [isConsentFormOpen, setIsConsentFormOpen] = useState(false)
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('spa_dismissed_ids')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    try {
      localStorage.setItem('spa_dismissed_ids', JSON.stringify([...dismissedIds]))
    } catch {}
  }, [dismissedIds])

  const [allAppointments, setAllAppointments] = useState<typeof appointments>([])
  const [historyLoading,  setHistoryLoading]  = useState(false)
  const [historyGuest,    setHistoryGuest]    = useState<string | null>(null)
  const [historyOpen,     setHistoryOpen]     = useState(false)
  const [isPaymentOpen,     setIsPaymentOpen]     = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentDone,       setPaymentDone]       = useState<{method: string; amount: number} | null>(null)
  
  const [newBooking, setNewBooking] = useState<NewBookingForm>({
    guestName: "",
    roomNumber: "",
    isVip: false,
    vipLevel: "silver",
    serviceType: "massage",
    service: "",
    therapistId: "",
    date: selectedDate,
    startTime: "10:00",
    duration: 60,
    notes: "",
    medicalProcedure: false,
    requireConsent: false
  })

  const { config, loading: configLoading } = useHotelConfig()

  const fetchSpaData = async (date?: string) => {
    setIsLoading(true)
    try {
      const d = date || selectedDate
      const res = await fetch(`/api/spa/appointments?date=${d}&limit=100`)
      if (!res.ok) { setIsLoading(false); return }
      const data = await res.json()

      const appts: SpaAppointment[] = (data.appointments ?? []).map((a: any) => {
        const guestFirst = a.guests?.first_name ?? ''
        const guestLast  = a.guests?.last_name  ?? ''
        const walkinName = a.notes?.startsWith('Walk-in:')
          ? a.notes.replace('Walk-in:', '').split('·')[0].split('|')[0].trim()
          : null
        const guestName = guestFirst
          ? `${guestFirst} ${guestLast}`.trim()
          : (walkinName ?? 'Walk-in Guest')
        const scheduledAt = new Date(a.scheduled_at)
        const endAt = new Date(scheduledAt.getTime() + a.duration * 60000)
        const pad = (n: number) => String(n).padStart(2, '0')
        const startTime = `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`
        const endTime   = `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`
        const dateStr   = scheduledAt.toISOString().split('T')[0]

        const STATUS_MAP: Record<string, string> = {
          BOOKED: 'confirmed', CONFIRMED: 'confirmed',
          IN_PROGRESS: 'in-progress', COMPLETED: 'completed',
          CANCELLED: 'cancelled', NO_SHOW: 'no-show',
        }

        return {
          id:           a.id,
          guestName,
          guestId:      a.guest_id ?? undefined,
          reservationId: a.reservation_id ?? undefined,
          roomNumber:   a.room_number ?? (a.guest_id ? 'Hotel Guest' : 'Walk-in'),
          isVip:        a.guests?.is_vip ?? false,
          service:      a.spa_services?.name ?? 'Treatment',
          serviceType:  (a.spa_services?.category ?? 'wellness') as any,
          therapist:    a.spa_therapists ? `${a.spa_therapists.first_name} ${a.spa_therapists.last_name}` : 'Unassigned',
          therapistId:  a.therapist_id ?? undefined,
          status:       (STATUS_MAP[a.status] ?? 'confirmed') as any,
          date:         dateStr,
          startTime,
          endTime,
          price:        Number(a.total_price ?? a.price),
          cost:         a.discount ? Number(a.discount) : undefined,
          notes:        a.special_requests ?? a.health_notes ?? undefined,
          prescription: a.notes?.startsWith('Payment:') ? a.notes : undefined,
        }
      })
      setAppointments(appts)

      const therapistList: Therapist[] = (data.therapists ?? []).map((t: any) => ({
        id:               t.id,
        name:             `${t.first_name} ${t.last_name}`,
        specialty:        (t.specialties as string[] ?? []).join(', ') || 'General',
        specialization:   t.specialties as string[] ?? [],
        certifications:   t.certifications as string[] ?? [],
        languages:        ['English'],
        status:           t.is_available ? 'available' : 'off' as any,
        appointmentsToday: appts.filter(a => a.therapistId === t.id).length,
        rating:           4.8,
        revenueGenerated: appts.filter(a => a.therapistId === t.id).reduce((s, a) => s + a.price, 0),
        utilizationRate:  Math.min(Math.round(appts.filter(a => a.therapistId === t.id).length / 8 * 100), 100),
        commission:       15,
        doctor:           (t.specialties as string[] ?? []).some((s: string) => s.toLowerCase().includes('botox') || s.toLowerCase().includes('medical')),
        schedule: []
      }))
      setTherapists(therapistList)

      const roomList: TreatmentRoom[] = (data.rooms ?? []).map((r: any) => ({
        id:           r.id,
        name:         r.name,
        type:         r.room_type ?? 'treatment',
        status:       r.status ?? 'available' as any,
        currentGuest: r.current_guest ?? null,
        temperature:  r.temperature ? Number(r.temperature) : null,
        humidity:     r.humidity    ? Number(r.humidity)    : null,
      }))
      setRooms(roomList)

      setServices(data.services ?? [])

    } catch (e) { console.error('Spa fetch error:', e) }
    finally { setIsLoading(false) }
  }

  const fetchGymClasses = async () => {
    try {
      const res = await fetch('/api/gym/classes?date=today')
      if (res.ok) {
        const d = await res.json()
        const classes: GymClass[] = (d.classes ?? []).map((c: any) => ({
          id:         c.id,
          name:       c.name,
          type:       c.type ?? 'fitness',
          instructor: c.instructor_name ?? 'Instructor',
          startTime:  new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime:    new Date(c.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          capacity:   c.capacity ?? 20,
          booked:     c.booked_count ?? 0,
          location:   c.location ?? 'Gym',
        }))
        setGymClasses(classes)
      }
    } catch (_) {}
  }

  useEffect(() => {
    fetchSpaData()
    fetchGymClasses()
  }, [])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    fetchSpaData(date)
  }

  const fetchAllHistory = async () => {
    if (allAppointments.length > 0) return
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/spa/appointments?limit=500')
      if (res.ok) {
        const d = await res.json()
        const STATUS_MAP: Record<string, string> = {
          BOOKED: 'confirmed', CONFIRMED: 'confirmed',
          IN_PROGRESS: 'in-progress', COMPLETED: 'completed',
          CANCELLED: 'cancelled', NO_SHOW: 'no-show',
        }
        const mapped = (d.appointments ?? []).map((a: any) => {
          const guestFirst = a.guests?.first_name ?? ''
          const guestLast  = a.guests?.last_name  ?? ''
          const walkinName = a.notes?.startsWith('Walk-in:')
            ? a.notes.replace('Walk-in:', '').split('·')[0].split('|')[0].trim() : null
          const guestName = guestFirst ? `${guestFirst} ${guestLast}`.trim() : (walkinName ?? 'Walk-in Guest')
          const scheduledAt = new Date(a.scheduled_at)
          const endAt = new Date(scheduledAt.getTime() + (a.duration ?? 0) * 60000)
          const pad = (n: number) => String(n).padStart(2, '0')
          return {
            ...a,
            guestName,
            date:      scheduledAt.toISOString().split('T')[0],
            startTime: `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`,
            endTime:   `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`,
            status:    STATUS_MAP[a.status] ?? 'confirmed',
            price:     Number(a.total_price ?? a.price ?? 0),
            service:   a.spa_services?.name ?? 'Treatment',
            serviceType: (a.spa_services?.category ?? 'wellness') as any,
            therapist: a.spa_therapists ? `${a.spa_therapists.first_name} ${a.spa_therapists.last_name}` : 'Unassigned',
            roomNumber: a.room_number ?? (a.guest_id ? 'Hotel Guest' : 'Walk-in'),
            isVip:     a.guests?.is_vip ?? false,
            prescription: a.notes?.startsWith('Payment:') ? a.notes : undefined,
          }
        })
        setAllAppointments(mapped)
      }
    } catch (e) { console.error(e) }
    finally { setHistoryLoading(false) }
  }

  const todayAppointments = useMemo(() => 
    appointments.filter(a => a.date === selectedDate && !dismissedIds.has(a.id)), 
    [appointments, selectedDate, dismissedIds]
  )
  
  const totalRevenue = todayAppointments.reduce((sum, a) => sum + (a.status !== "cancelled" ? a.price : 0), 0)
  
  const occupancyRate = useMemo(() => 
    rooms.length === 0 ? 0 : Math.round((rooms.filter(r => r.status === "occupied").length / rooms.length) * 100), 
    [rooms]
  )
  
  const therapistUtilization = useMemo(() => {
    const total = therapists.reduce((sum, t) => sum + t.utilizationRate, 0)
    return therapists.length === 0 ? 0 : Math.round(total / therapists.length)
  }, [therapists])

  const productSales = products.reduce((sum, p) => sum + (p.stock < 20 ? p.price : 0), 0)
  const vipGuestsToday = todayAppointments.filter(a => a.isVip).length
  const medicalProceduresToday = todayAppointments.filter(a => a.serviceType === "medical").length

  const getAvailableTherapists = (serviceType: ServiceType, date: string, time: string) => {
    return therapists.filter(t => t.status !== 'off')
  }

  const handleCreateBooking = async () => {
    if (!newBooking.guestName.trim()) {
      alert("Please enter guest name")
      return
    }
    if (!newBooking.startTime || !/^\d{2}:\d{2}$/.test(newBooking.startTime)) {
      alert("Please enter a valid start time (e.g. 14:00)")
      return
    }
    if (!newBooking.serviceType) {
      alert("Please select a service type")
      return
    }

    const matchedService = services.find(s =>
      s.name.toLowerCase().includes(newBooking.service.toLowerCase()) ||
      s.category === newBooking.serviceType
    )

    try {
      const res = await fetch('/api/spa/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId:       matchedService?.id ?? null,
          therapistId:     newBooking.therapistId || null,
          scheduledAt:     `${newBooking.date}T${newBooking.startTime}:00`,
          specialRequests: newBooking.notes || null,
          guestName:       newBooking.guestName,
          guestPhone:      newBooking.roomNumber || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create booking')
        return
      }
      await fetchSpaData(newBooking.date)
    } catch (e: any) {
      alert(e.message)
      return
    }

    setNewBooking({
      guestName: "",
      roomNumber: "",
      isVip: false,
      vipLevel: "silver",
      serviceType: "massage",
      service: "",
      therapistId: "",
      date: selectedDate,
      startTime: "10:00",
      duration: 60,
      notes: "",
      medicalProcedure: false,
      requireConsent: false
    })
    setIsNewBookingOpen(false)
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "in-progress": return "bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20"
      case "completed": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
      case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "no-show": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  }

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case "massage": return <Heart className="h-4 w-4" />
      case "facial": return <Sparkles className="h-4 w-4" />
      case "body": return <Droplets className="h-4 w-4" />
      case "wellness": return <Leaf className="h-4 w-4" />
      case "beauty": return <Sun className="h-4 w-4" />
      case "medical": return <Syringe className="h-4 w-4" />
      case "gym": return <Activity className="h-4 w-4" />
      case "beach": return <Umbrella className="h-4 w-4" />
    }
  }

  const getTherapistStatusColor = (status: TherapistStatus) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400"
      case "busy": return "bg-[#00f2ff]/10 text-[#00f2ff]"
      case "break": return "bg-amber-500/10 text-amber-400"
      case "off": return "bg-slate-500/10 text-[#8E939D]"
    }
  }

  const getRoomStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "available": return "border-emerald-500/30"
      case "occupied": return "border-[#00f2ff]/30"
      case "cleaning": return "border-amber-500/30"
      case "maintenance": return "border-red-500/30"
    }
  }

  const getRoomStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400"
      case "occupied": return "bg-[#00f2ff]/10 text-[#00f2ff]"
      case "cleaning": return "bg-amber-500/10 text-amber-400"
      case "maintenance": return "bg-red-500/10 text-red-400"
    }
  }

  const getCabanaStatusColor = (status: CabanaStatus) => {
    switch (status) {
      case "available": return "border-emerald-500/30"
      case "reserved": return "border-purple-500/30"
      case "occupied": return "border-[#00f2ff]/30"
      case "cleaning": return "border-amber-500/30"
    }
  }

  const getCabanaStatusBadge = (status: CabanaStatus) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400"
      case "reserved": return "bg-purple-500/10 text-purple-400"
      case "occupied": return "bg-[#00f2ff]/10 text-[#00f2ff]"
      case "cleaning": return "bg-amber-500/10 text-amber-400"
    }
  }

  const getVipBadge = (level?: string) => {
    switch (level) {
      case "platinum": return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-[8px] tracking-widest">PLATINUM</Badge>
      case "gold": return <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 text-[8px] tracking-widest">GOLD</Badge>
      case "silver": return <Badge className="bg-slate-600/20 text-[#8E939D] border-slate-600/30 text-[8px] tracking-widest">SILVER</Badge>
      default: return null
    }
  }

  if (isLoading || configLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64 bg-[#00f2ff]/5" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-[#00f2ff]/5" />
          ))}
        </div>
        <Skeleton className="h-12 w-full bg-[#00f2ff]/5" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-[#00f2ff]/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            SPA & WELLNESS <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> ECOSYSTEM
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
            {therapists.filter(t => t.status !== "off").length} THERAPISTS ON DUTY · {rooms.filter(r => r.status === "available").length} ROOMS AVAILABLE
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          {userRole === "medical" || userRole === "director" ? (
            <Button 
              variant="ghost" 
              size="sm"
              className={`text-[10px] font-bold uppercase tracking-widest h-8 ${showMedical ? "text-red-400 hover:text-red-400" : "text-[#5C6270] hover:text-[#00f2ff]"}`}
              onClick={() => setShowMedical(!showMedical)}
            >
              {showMedical ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
              {showMedical ? "HIDE MEDICAL" : "SHOW MEDICAL"}
            </Button>
          ) : null}
          
          <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                <Plus className="mr-1 h-3 w-3" />
                NEW BOOKING
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> CREATE NEW SPA BOOKING
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">GUEST INFORMATION</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">GUEST NAME *</Label>
                      <Input
                        placeholder="FULL NAME"
                        value={newBooking.guestName}
                        onChange={(e) => setNewBooking({...newBooking, guestName: e.target.value})}
                        className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">ROOM NUMBER *</Label>
                      <Input
                        placeholder="E.G., 1205"
                        value={newBooking.roomNumber}
                        onChange={(e) => setNewBooking({...newBooking, roomNumber: e.target.value})}
                        className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isVip"
                        checked={newBooking.isVip}
                        onCheckedChange={(checked) => setNewBooking({...newBooking, isVip: checked as boolean})}
                        className="border-[#00f2ff]/30 data-[state=checked]:bg-[#00f2ff]"
                      />
                      <Label htmlFor="isVip" className="text-[9px] font-bold uppercase tracking-widest text-slate-300">VIP GUEST</Label>
                    </div>
                    
                    {newBooking.isVip && (
                      <Select 
                        value={newBooking.vipLevel} 
                        onValueChange={(value: "platinum" | "gold" | "silver") => 
                          setNewBooking({...newBooking, vipLevel: value})
                        }
                      >
                        <SelectTrigger className="h-7 w-28 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                          <SelectValue placeholder="LEVEL" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                          <SelectItem value="platinum" className="text-purple-400 text-[9px] font-bold uppercase">PLATINUM</SelectItem>
                          <SelectItem value="gold" className="text-amber-400 text-[9px] font-bold uppercase">GOLD</SelectItem>
                          <SelectItem value="silver" className="text-[#8E939D] text-[9px] font-bold uppercase">SILVER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#00f2ff]/20">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">SERVICE DETAILS</h3>
                  
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SERVICE TYPE *</Label>
                    <Select 
                      value={newBooking.serviceType} 
                      onValueChange={(value: ServiceType) => {
                        setNewBooking({...newBooking, serviceType: value, therapistId: ""})
                      }}
                    >
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue placeholder="SELECT SERVICE TYPE" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        <SelectItem value="massage" className="text-[#8E939D] text-[9px] font-bold uppercase">MASSAGE</SelectItem>
                        <SelectItem value="facial" className="text-[#8E939D] text-[9px] font-bold uppercase">FACIAL</SelectItem>
                        <SelectItem value="body" className="text-[#8E939D] text-[9px] font-bold uppercase">BODY TREATMENT</SelectItem>
                        <SelectItem value="wellness" className="text-[#8E939D] text-[9px] font-bold uppercase">WELLNESS</SelectItem>
                        <SelectItem value="medical" className="text-red-400 text-[9px] font-bold uppercase">MEDICAL AESTHETIC</SelectItem>
                        <SelectItem value="gym" className="text-[#8E939D] text-[9px] font-bold uppercase">GYM SESSION</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SERVICE NAME *</Label>
                    <Input
                      placeholder="E.G., SWEDISH MASSAGE 90MIN"
                      value={newBooking.service}
                      onChange={(e) => setNewBooking({...newBooking, service: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">THERAPIST *</Label>
                    <Select 
                      value={newBooking.therapistId} 
                      onValueChange={(value) => setNewBooking({...newBooking, therapistId: value})}
                    >
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue placeholder="SELECT THERAPIST" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        {getAvailableTherapists(newBooking.serviceType, newBooking.date, newBooking.startTime).map(therapist => (
                          <SelectItem key={therapist.id} value={therapist.id} className="text-[9px] font-bold uppercase">
                            <div className="flex items-center justify-between w-full">
                              <span>{therapist.name}</span>
                              <Badge className={`ml-2 ${getTherapistStatusColor(therapist.status)} text-[7px] tracking-widest`}>
                                {therapist.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#00f2ff]/20">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">DATE & TIME</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DATE *</Label>
                      <Input
                        type="date"
                        value={newBooking.date}
                        onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                        className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">START TIME *</Label>
                      <Input
                        type="time"
                        value={newBooking.startTime}
                        onChange={(e) => setNewBooking({...newBooking, startTime: e.target.value})}
                        className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DURATION (MINUTES) *</Label>
                    <Select 
                      value={newBooking.duration.toString()} 
                      onValueChange={(value) => setNewBooking({...newBooking, duration: parseInt(value)})}
                    >
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue placeholder="SELECT DURATION" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        <SelectItem value="30" className="text-[9px] font-bold uppercase">30 MINUTES</SelectItem>
                        <SelectItem value="60" className="text-[9px] font-bold uppercase">60 MINUTES</SelectItem>
                        <SelectItem value="90" className="text-[9px] font-bold uppercase">90 MINUTES</SelectItem>
                        <SelectItem value="120" className="text-[9px] font-bold uppercase">120 MINUTES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newBooking.serviceType === "medical" && (
                  <div className="space-y-3 pt-2 border-t border-red-500/30">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-400">MEDICAL PROCEDURE</h3>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="requireConsent"
                        checked={newBooking.requireConsent}
                        onCheckedChange={(checked) => setNewBooking({...newBooking, requireConsent: checked as boolean})}
                        className="border-red-500/30"
                      />
                      <Label htmlFor="requireConsent" className="text-[9px] font-bold uppercase tracking-widest text-slate-300">REQUIRE CONSENT FORM</Label>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        MEDICAL RECORDS WILL BE ENCRYPTED AND RESTRICTED
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-2">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SPECIAL INSTRUCTIONS</Label>
                  <Textarea
                    placeholder="ANY SPECIAL REQUESTS, ALLERGIES, OR NOTES..."
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                    className="bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[8px] font-bold uppercase tracking-widest placeholder:text-[7px] min-h-[60px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 text-slate-300 hover:bg-[#00f2ff]/10 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => setIsNewBookingOpen(false)}
                >
                  CANCEL
                </Button>
                <Button 
                  className="flex-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                  onClick={handleCreateBooking}
                >
                  CREATE BOOKING
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1️⃣ Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "TODAY'S REVENUE", val: `$${(totalRevenue / 1000).toFixed(1)}K`, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" },
          { label: "TREATMENTS", val: todayAppointments.length, color: "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" },
          { label: "OCCUPANCY", val: `${occupancyRate}%`, color: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" },
          { label: "AVG VALUE", val: `$${todayAppointments.length ? Math.round(totalRevenue / todayAppointments.length) : 0}`, color: "text-[#8E939D]" },
          { label: "THERAPIST UTIL", val: `${therapistUtilization}%`, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
          { label: "PRODUCT SALES", val: `$${(productSales / 1000).toFixed(1)}K`, color: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" },
          { label: "VIP GUESTS", val: vipGuestsToday, color: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">{kpi.label}</p>
              <p className={cn("text-lg font-bold tracking-tight", kpi.color)}>{kpi.val}</p>
            </CardContent>
          </Card>
        ))}
        {showMedical && (
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-red-500/30 hover:border-red-500/50 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <p className="text-[8px] font-bold uppercase tracking-widest text-red-400">MEDICAL</p>
              <p className="text-lg font-bold text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{medicalProceduresToday}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 2️⃣ Treatment Rooms Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {rooms.map((room) => (
          <Card 
            key={room.id} 
            className={`bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden ${getRoomStatusColor(room.status)}`}
          >
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{room.name}</span>
                <Badge className={`text-[7px] tracking-widest uppercase ${getRoomStatusBadge(room.status)} border-0`}>
                  {room.status}
                </Badge>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{room.type}</p>
              {room.temperature && (
                <div className="flex items-center gap-1 mt-1 text-[8px]">
                  <ThermometerSun className="h-2.5 w-2.5 text-[#5C6270]" />
                  <span className="text-slate-300 font-bold">{room.temperature}°C</span>
                </div>
              )}
              {room.currentGuest && (
                <p className="text-[7px] font-bold uppercase tracking-widest text-slate-300 mt-1 truncate">{room.currentGuest}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3️⃣ Live Appointment Board */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1 flex-wrap">
          <TabsTrigger value="live" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            LIVE APPOINTMENTS
          </TabsTrigger>
          <TabsTrigger value="therapists" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            THERAPISTS
          </TabsTrigger>
          <TabsTrigger value="cabanas" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            BEACH & CABANAS
          </TabsTrigger>
          <TabsTrigger value="products" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            PRODUCTS
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            PACKAGES
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]"
            onClick={fetchAllHistory}>
            GUEST HISTORY
          </TabsTrigger>
          {showMedical && (
            <TabsTrigger value="medical" className="text-[9px] font-bold uppercase tracking-widest text-red-400 data-[state=active]:text-red-400 data-[state=active]:bg-red-500/10 data-[state=active]:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              MEDICAL
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
              <Input
                placeholder="SEARCH GUEST OR SERVICE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
              />
            </div>
            <Select value={selectedDate} onValueChange={handleDateChange}>
              <SelectTrigger className="w-[140px] h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="SELECT DATE" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                {Array.from({length: 7}, (_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() + i)
                  const val = d.toISOString().split('T')[0]
                  const label = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()
                  return <SelectItem key={val} value={val} className="text-[9px] font-bold uppercase">{label}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {todayAppointments
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group relative overflow-hidden ${
                    appointment.serviceType === "medical" && showMedical ? "border-red-500/30 bg-red-950/20 hover:border-red-500/50" :
                    appointment.isVip ? "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50" :
                    "bg-[#00f2ff]/5 border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10"
                  }`}
                  onClick={() => {
                    setSelectedAppointment(appointment)
                    setIsAppointmentDetailOpen(true)
                  }}
                >
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="w-16 text-[11px] font-mono font-bold text-[#00f2ff] relative z-10">
                    {appointment.startTime}
                  </div>

                  <div className={`p-2 rounded-lg ${getStatusColor(appointment.status)} relative z-10`}>
                    {getServiceIcon(appointment.serviceType)}
                  </div>

                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{appointment.guestName}</span>
                      <Badge variant="outline" className="border-[#00f2ff]/30 text-[8px] tracking-widest uppercase font-bold">ROOM {appointment.roomNumber}</Badge>
                      {appointment.isVip && getVipBadge(appointment.vipLevel)}
                      {appointment.serviceType === "medical" && showMedical && (
                        <Badge className="bg-red-600/20 text-red-400 text-[7px] tracking-widest uppercase border-0">MEDICAL</Badge>
                      )}
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{appointment.service}</p>
                  </div>

                  <div className="flex items-center gap-2 min-w-[100px] relative z-10">
                    <Avatar className="h-6 w-6 border border-[#00f2ff]/30">
                      <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[8px] font-bold">
                        {appointment.therapist.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{appointment.therapist}</span>
                  </div>

                  <div className="text-right min-w-[90px] relative z-10">
                    <p className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${appointment.price}</p>
                    <Badge className={`${getStatusColor(appointment.status)} text-[7px] tracking-widest uppercase border-0`}>
                      {appointment.status}
                    </Badge>
                    {appointment.prescription && (
                      <p className="text-[7px] text-emerald-400 mt-0.5 font-bold uppercase">
                        {appointment.prescription.replace('Payment: ','').split('|')[0].trim()}
                      </p>
                    )}
                  </div>
                  
                  {["completed","cancelled","no-show"].includes(appointment.status) && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setDismissedIds(prev => new Set([...prev, appointment.id]))
                      }}
                      className="ml-2 p-1.5 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 relative z-10"
                      title="Remove from list">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="therapists">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">THERAPIST MANAGEMENT</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {therapists.map((therapist) => (
                  <div key={therapist.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-[#00f2ff]/30">
                        <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold">
                          {therapist.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{therapist.name}</h4>
                          <Badge className={`${getTherapistStatusColor(therapist.status)} text-[7px] tracking-widest uppercase border-0`}>
                            {therapist.status}
                          </Badge>
                        </div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">{therapist.specialty}</p>
                        <div className="flex items-center gap-3 mt-1 text-[8px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-[#5C6270]" />
                            <span className="text-slate-300">{therapist.appointmentsToday} TODAY</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span>{therapist.rating}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest mb-0.5">
                            <span className="text-[#5C6270]">UTILIZATION</span>
                            <span className="text-slate-300">{therapist.utilizationRate}%</span>
                          </div>
                          <Progress value={therapist.utilizationRate} className="h-1 bg-[#00f2ff]/20 [&>div]:bg-[#00f2ff] [&>div]:shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
                        </div>
                        {therapist.doctor && (
                          <Badge className="mt-2 bg-purple-600/20 text-purple-400 text-[6px] tracking-widest uppercase border-0">MEDICAL LICENSE</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cabanas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {cabanas.map((cabana) => (
              <Card 
                key={cabana.id} 
                className={`bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden ${getCabanaStatusColor(cabana.status)}`}
              >
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{cabana.number}</span>
                    <Badge className={`text-[7px] tracking-widest uppercase ${getCabanaStatusBadge(cabana.status)} border-0`}>
                      {cabana.status}
                    </Badge>
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] capitalize mb-1">{cabana.location}</p>
                  {cabana.currentGuest && (
                    <div className="text-[7px] font-bold uppercase tracking-widest text-slate-300">
                      <p>GUEST: {cabana.currentGuest}</p>
                      <p>ROOM: {cabana.guestRoom}</p>
                      <p>{cabana.startTime} - {cabana.endTime}</p>
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cabana.amenities.slice(0, 2).map((item, i) => (
                      <Badge key={i} variant="outline" className="border-[#00f2ff]/20 text-[6px] tracking-widest uppercase font-bold">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">RETAIL PRODUCTS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[11px] text-[#8E939D] group-hover:text-[#00f2ff] transition-colors uppercase">{product.name}</h4>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] tracking-widest uppercase border-0">${product.price}</Badge>
                    </div>
                    <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">{product.category}</p>
                    <div className="flex items-center justify-between text-[8px] font-bold">
                      <span className="text-[#5C6270]">STOCK</span>
                      <span className={`${product.stock < 20 ? "text-red-400" : "text-slate-300"}`}>
                        {product.stock} UNITS
                      </span>
                    </div>
                    {product.vipOnly && (
                      <Badge className="mt-1 bg-purple-600/20 text-purple-400 text-[6px] tracking-widest uppercase border-0">VIP ONLY</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-[#00f2ff] flex items-center justify-between">
                    <span>{pkg.name}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[7px] tracking-widest uppercase border-0">SAVE ${pkg.savings}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-2">{pkg.description}</p>
                  <div className="space-y-1 mb-2">
                    <p className="text-[7px] font-bold uppercase tracking-widest text-slate-300">INCLUDES:</p>
                    {pkg.services.slice(0, 2).map((service, i) => (
                      <div key={i} className="text-[7px] text-[#8E939D]">• {service}</div>
                    ))}
                    {pkg.services.length > 2 && (
                      <div className="text-[7px] text-[#5C6270]">+{pkg.services.length - 2} MORE</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#00f2ff]/20">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PACKAGE PRICE</span>
                    <span className="text-sm font-bold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]">${pkg.packagePrice}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* GUEST HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          {(() => {
            const guestMap = new Map<string, typeof appointments>()
            const historyData = allAppointments.length > 0 ? allAppointments : appointments
            for (const a of historyData) {
              const name = a.guestName
              if (!name || name === 'Walk-in Guest') continue
              if (!guestMap.has(name)) guestMap.set(name, [])
              guestMap.get(name)!.push(a)
            }
            if (historyLoading) return (
              <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 text-[#00f2ff] mx-auto mb-3 animate-spin" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">LOADING HISTORY...</p>
                </CardContent>
              </Card>
            )
            if (guestMap.size === 0) return (
              <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-10 w-10 text-[#5C6270] mx-auto mb-3" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">NO GUEST HISTORY YET</p>
                </CardContent>
              </Card>
            )
            return (
              <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
                <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> GUEST HISTORY — {guestMap.size} GUESTS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {[...guestMap.entries()].map(([guestName, visits]) => {
                    const totalSpend = visits.filter(v => v.status === 'completed').reduce((s, v) => s + v.price, 0)
                    const lastVisit  = visits.sort((a, b) => (b.date).localeCompare(a.date))[0]
                    const isVip = visits.some(v => v.isVip)
                    return (
                      <div key={guestName}
                        onClick={() => { setHistoryGuest(guestName); setHistoryOpen(true) }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 cursor-pointer transition-all group">
                        <div className="w-8 h-8 rounded-full bg-[#00f2ff]/20 border border-[#00f2ff]/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-[#00f2ff]">
                            {guestName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isVip && <Crown className="h-3 w-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)] flex-shrink-0" />}
                            <p className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors truncate">{guestName}</p>
                          </div>
                          <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">
                            LAST: {lastVisit.service} · {lastVisit.date}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${totalSpend}</p>
                          <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">{visits.length} VISIT{visits.length !== 1 ? 'S' : ''}</p>
                        </div>
                        <ChevronRight className="h-3 w-3 text-[#5C6270] group-hover:text-[#00f2ff] transition-colors flex-shrink-0" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })()}
        </TabsContent>

        {showMedical && (
          <TabsContent value="medical">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-red-500/30 hover:border-red-500/50 transition-all">
              <CardHeader className="pb-3 border-b border-red-500/30">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> MEDICAL RECORDS (RESTRICTED)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 hover:border-red-500/50 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-red-400">{record.guestName}</h4>
                        <Badge className="bg-red-600/20 text-red-400 text-[7px] tracking-widest uppercase border-0">{record.procedure}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px] font-bold uppercase tracking-widest">
                        <div>
                          <span className="text-[#5C6270]">DATE</span>
                          <p className="text-slate-300">{record.date}</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">DOCTOR</span>
                          <p className="text-slate-300">{record.doctor}</p>
                        </div>
                      </div>
                      <p className="text-[8px] text-[#8E939D] mt-1">{record.notes}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="border-red-500/30 bg-red-950/20 text-red-400 text-[7px] font-bold uppercase tracking-widest h-6">
                          <FileText className="h-2.5 w-2.5 mr-1" /> VIEW CONSENT
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 bg-red-950/20 text-red-400 text-[7px] font-bold uppercase tracking-widest h-6">
                          <Camera className="h-2.5 w-2.5 mr-1" /> PHOTOS
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Appointment Detail Dialog */}
      <Dialog open={isAppointmentDetailOpen} onOpenChange={v => { setIsAppointmentDetailOpen(v); if (!v) setPaymentDone(null) }}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-lg">
          <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
            <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f2ff]">
              APPOINTMENT DETAILS
              {selectedAppointment?.isVip && getVipBadge(selectedAppointment.vipLevel)}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-2">

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">GUEST</p>
                  <p className="text-sm font-bold text-[#8E939D]">{selectedAppointment.guestName}</p>
                  <p className="text-[8px] text-[#8E939D]">{selectedAppointment.roomNumber}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">SERVICE</p>
                  <p className="text-sm font-bold text-[#8E939D]">{selectedAppointment.service}</p>
                  <p className="text-[8px] text-[#8E939D] uppercase">{selectedAppointment.serviceType}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">DATE & TIME</p>
                  <p className="text-sm text-[#8E939D]">{selectedAppointment.date}</p>
                  <p className="text-sm text-[#8E939D]">{selectedAppointment.startTime} – {selectedAppointment.endTime}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">THERAPIST</p>
                  <p className="text-sm text-[#8E939D]">{selectedAppointment.therapist}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">AMOUNT</p>
                  <p className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${selectedAppointment.price}</p>
                  {selectedAppointment.cost && selectedAppointment.cost > 0 && (
                    <p className="text-[7px] text-[#8E939D]">DISCOUNT: -${selectedAppointment.cost}</p>
                  )}
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">STATUS</p>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} text-[7px] tracking-widest uppercase border-0 mt-1`}>
                    {selectedAppointment.status}
                  </Badge>
                  {selectedAppointment.prescription && (
                    <p className="text-[7px] text-emerald-400 mt-1 font-bold uppercase">
                      ✓ {selectedAppointment.prescription.replace('Payment: ','').split('|')[0].trim()}
                    </p>
                  )}
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400">⚠ {selectedAppointment.notes}</p>
                </div>
              )}

              {!["completed","cancelled","no-show"].includes(selectedAppointment.status) && (
                <div className="space-y-2">
                  {selectedAppointment.status === "confirmed" && (
                    <Button className="w-full bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40"
                      onClick={async () => {
                        await fetch(`/api/spa/appointments/${selectedAppointment.id}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'IN_PROGRESS' })
                        })
                        setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'in-progress' as any } : a))
                        setSelectedAppointment(prev => prev ? { ...prev, status: 'in-progress' as any } : null)
                      }}>
                      ▶ START SESSION
                    </Button>
                  )}

                  {selectedAppointment.status === "in-progress" && (
                    <Button className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/40"
                      onClick={() => { setIsAppointmentDetailOpen(false); setIsPaymentOpen(true) }}>
                      💳 COMPLETE & PAY — ${selectedAppointment.price}
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-[8px] font-bold uppercase tracking-widest"
                      onClick={async () => {
                        await fetch(`/api/spa/appointments/${selectedAppointment.id}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'CANCELLED' })
                        })
                        setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'cancelled' as any } : a))
                        setIsAppointmentDetailOpen(false)
                      }}>
                      CANCEL
                    </Button>
                    <Button size="sm" variant="outline"
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-[8px] font-bold uppercase tracking-widest"
                      onClick={async () => {
                        await fetch(`/api/spa/appointments/${selectedAppointment.id}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'NO_SHOW' })
                        })
                        setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'no-show' as any } : a))
                        setIsAppointmentDetailOpen(false)
                      }}>
                      NO SHOW
                    </Button>
                  </div>
                </div>
              )}

              {["completed","cancelled","no-show"].includes(selectedAppointment.status) && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-[#00f2ff]/20 text-slate-300 text-[9px] font-bold uppercase tracking-widest"
                    onClick={() => setIsAppointmentDetailOpen(false)}>
                    CLOSE
                  </Button>
                  <Button variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-[9px] font-bold uppercase tracking-widest"
                    onClick={() => {
                      setDismissedIds(prev => new Set([...prev, selectedAppointment.id]))
                      setIsAppointmentDetailOpen(false)
                    }}>
                    🗑 REMOVE
                  </Button>
                </div>
              )}

              {!["completed","cancelled","no-show"].includes(selectedAppointment.status) && (
                <Button variant="outline" className="w-full border-[#00f2ff]/20 text-slate-300 text-[9px] font-bold uppercase tracking-widest"
                  onClick={() => setIsAppointmentDetailOpen(false)}>
                  CLOSE
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guest History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
            <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f2ff]">
              <BookOpen className="h-5 w-5" /> {historyGuest} — VISIT HISTORY
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(allAppointments.length > 0 ? allAppointments : appointments)
              .filter((a: any) => a.guestName === historyGuest)
              .sort((a: any, b: any) => (b.date).localeCompare(a.date))
              .map(a => {
                const s = getStatusColor(a.status)
                const payInfo = a.prescription?.replace('Payment: ','').split('|')[0].trim()
                return (
                  <div key={a.id} className="p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${s}`}>{getServiceIcon(a.serviceType)}</div>
                        <p className="font-bold text-sm text-[#8E939D]">{a.service}</p>
                      </div>
                      <Badge className={`${s} text-[7px] tracking-widest uppercase border-0`}>{a.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[8px] font-bold uppercase tracking-widest">
                      <div>
                        <p className="text-[#5C6270]">DATE</p>
                        <p className="text-slate-300">{a.date}</p>
                        <p className="text-[#8E939D]">{a.startTime} – {a.endTime}</p>
                      </div>
                      <div>
                        <p className="text-[#5C6270]">THERAPIST</p>
                        <p className="text-slate-300">{a.therapist}</p>
                      </div>
                      <div>
                        <p className="text-[#5C6270]">AMOUNT</p>
                        <p className="text-emerald-400 font-bold">${a.price}</p>
                        {payInfo && <p className="text-emerald-400 text-[6px]">✓ {payInfo}</p>}
                      </div>
                    </div>
                    {a.notes && !a.notes.startsWith('Walk-in:') && !a.notes.startsWith('Payment:') && (
                      <p className="text-[7px] text-amber-400 mt-1 font-bold uppercase">⚠ {a.notes}</p>
                    )}
                  </div>
                )
              })}
            {(allAppointments.length > 0 ? allAppointments : appointments).filter((a: any) => a.guestName === historyGuest).length === 0 && (
              <p className="text-center text-[#5C6270] py-8 text-[9px] font-bold uppercase tracking-widest">NO HISTORY FOUND FOR THIS GUEST</p>
            )}
            <Button variant="outline" className="w-full border-[#00f2ff]/20 text-slate-300 mt-2 text-[9px] font-bold uppercase tracking-widest"
              onClick={() => setHistoryOpen(false)}>CLOSE</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Popup */}
      <Dialog open={isPaymentOpen} onOpenChange={v => { setIsPaymentOpen(v); if (!v) setPaymentDone(null) }}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-sm">
          {!paymentDone ? (
            <>
              <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f2ff]">
                  <Sparkles className="h-5 w-5" /> PROCESS PAYMENT
                </DialogTitle>
              </DialogHeader>
              {selectedAppointment && (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-[#5C6270]">GUEST</span>
                      <span className="text-[#8E939D]">{selectedAppointment.guestName}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-[#5C6270]">SERVICE</span>
                      <span className="text-[#8E939D]">{selectedAppointment.service}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-[#5C6270]">THERAPIST</span>
                      <span className="text-[#8E939D]">{selectedAppointment.therapist}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-[#5C6270]">DURATION</span>
                      <span className="text-[#8E939D]">{selectedAppointment.startTime} – {selectedAppointment.endTime}</span>
                    </div>
                    {selectedAppointment.cost && selectedAppointment.cost > 0 && (
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                        <span className="text-[#5C6270]">DISCOUNT</span>
                        <span className="text-emerald-400">-${selectedAppointment.cost}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-[#00f2ff]/20 pt-2 mt-2">
                      <span className="text-[#8E939D]">TOTAL</span>
                      <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${selectedAppointment.price}</span>
                    </div>
                  </div>

                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SELECT PAYMENT METHOD</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { method: 'CASH',        label: '💵 CASH',           cls: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400' },
                      { method: 'CREDIT_CARD', label: '💳 CREDIT CARD',    cls: 'bg-blue-600/20    hover:bg-blue-600/30 text-blue-400' },
                      { method: 'DEBIT_CARD',  label: '💳 DEBIT CARD',     cls: 'bg-sky-600/20     hover:bg-sky-600/30 text-sky-400' },
                      { method: 'ROOM_CHARGE', label: '🏨 CHARGE TO ROOM', cls: 'bg-orange-600/20  hover:bg-orange-600/30 text-orange-400' },
                      { method: 'VOUCHER',     label: '🎫 VOUCHER',         cls: 'bg-purple-600/20  hover:bg-purple-600/30 text-purple-400' },
                      { method: 'CITY_LEDGER', label: '🏢 CITY LEDGER',     cls: 'bg-slate-600/20   hover:bg-slate-600/30 text-slate-300' },
                    ].map(({ method, label, cls }) => (
                      <Button key={method} size="sm"
                        disabled={paymentProcessing}
                        className={`text-[9px] font-bold uppercase tracking-widest h-9 ${cls}`}
                        onClick={async () => {
                          setPaymentProcessing(true)
                          try {
                            const res = await fetch(`/api/spa/appointments/${selectedAppointment.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'COMPLETED', paymentMethod: method })
                            })
                            if (!res.ok) {
                              const err = await res.json()
                              alert(err.error)
                              return
                            }
                            setPaymentDone({ method, amount: selectedAppointment.price })
                            setAppointments(prev => prev.map(a =>
                              a.id === selectedAppointment.id
                                ? { ...a, status: 'completed' as any, prescription: `Payment: ${method.replace(/_/g,' ')}` }
                                : a
                            ))
                          } catch (e: any) {
                            alert(e.message)
                          } finally {
                            setPaymentProcessing(false)
                          }
                        }}>
                        {label}
                      </Button>
                    ))}
                  </div>

                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270] text-center">🏨 ROOM CHARGE WILL POST TO GUEST FOLIO IF LINKED TO HOTEL RESERVATION</p>

                  <Button variant="outline" className="w-full border-[#00f2ff]/20 text-slate-300 text-[9px] font-bold uppercase tracking-widest"
                    onClick={() => setIsPaymentOpen(false)}>
                    CANCEL
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <DialogHeader className="border-b border-emerald-500/30 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                  ✓ PAYMENT COMPLETE
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                    <span>GUEST</span><span>{selectedAppointment?.guestName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                    <span>SERVICE</span><span>{selectedAppointment?.service}</span>
                  </div>
                  {selectedAppointment?.roomNumber && selectedAppointment.roomNumber !== 'Walk-in' && (
                    <div className="flex justify-between text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                      <span>ROOM</span><span>{selectedAppointment.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-emerald-500/30 pt-2 mt-2">
                    <span className="text-[#8E939D]">TOTAL PAID</span>
                    <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${paymentDone.amount}</span>
                  </div>
                  <div className="flex justify-between text-[#8E939D] text-[8px] font-bold uppercase tracking-widest">
                    <span>METHOD</span>
                    <span className="capitalize">{paymentDone.method.replace(/_/g,' ')}</span>
                  </div>
                  {paymentDone.method === 'ROOM_CHARGE' && (
                    <p className="text-[8px] text-emerald-400 font-bold uppercase">✓ CHARGED TO GUEST FOLIO</p>
                  )}
                </div>

                <Button className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/40"
                  onClick={() => { setIsPaymentOpen(false); setPaymentDone(null) }}>
                  DONE
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}