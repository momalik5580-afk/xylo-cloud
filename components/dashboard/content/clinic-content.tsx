"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Stethoscope, Activity, Users, Calendar, Clock, DollarSign,
  TrendingUp, ArrowUpRight, Search, Filter, Plus,
  CheckCircle2, AlertCircle, AlertTriangle, Star,
  Heart, Thermometer, Pill, Syringe, Droplets,
  Ambulance, Shield, Lock, Eye, EyeOff,
  FileText, Camera, Printer, Download,
  MoreHorizontal, Edit, Trash2, Copy,
  CalendarDays, Clock3, Bookmark, Share2,
  User, Phone, Mail, MapPin, Briefcase,
  FlaskRound, Microscope, TestTube, Pill as Medication,
  Scissors, HeartPulse, Bone,
  Brain, Stethoscope as HeartMonitor, Crown, X
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
import { Switch } from "@/components/ui/switch"
import { useHotelConfig } from "@/hooks/use-hotel-config"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ==========================================
// TYPES (same as original)
// ==========================================

type FacilityType = "consultation" | "treatment" | "lab" | "pharmacy" | "recovery" | "emergency"
type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance"
type AppointmentStatus = "scheduled" | "checked-in" | "in-progress" | "completed" | "cancelled" | "no-show" | "emergency"
type ServiceType = "consultation" | "specialist" | "travel-medicine" | "iv-therapy" | "aesthetic" | "emergency" | "screening" | "physiotherapy" | "mental-health" | "telemedicine"
type StaffRole = "doctor" | "nurse" | "lab-technician" | "pharmacist" | "receptionist" | "administrator"
type PatientType = "guest" | "external" | "emergency" | "vip"
type EmergencyLevel = "minor" | "moderate" | "critical"
type LabTestStatus = "ordered" | "collected" | "processing" | "completed" | "reviewed"
type PrescriptionStatus = "active" | "dispensed" | "cancelled" | "expired"

interface ClinicFacility {
  id: string
  name: string
  type: FacilityType
  location: string
  capacity: number
  currentOccupancy: number
  status: RoomStatus
  equipment: string[]
  amenities: string[]
  nextCleaning?: string
  temperature?: number
  humidity?: number
}

interface MedicalStaff {
  id: string
  name: string
  role: StaffRole
  specialization?: string[]
  licenseNumber?: string
  qualifications: string[]
  languages: string[]
  experience: number
  rating: number
  status: "available" | "busy" | "break" | "off"
  consultationFee: number
  schedule: {
    day: string
    start: string
    end: string
  }[]
  avatar?: string
}

interface Patient {
  id: string
  name: string
  dateOfBirth: string
  nationality: string
  passportNumber?: string
  roomNumber?: string
  phone: string
  email?: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  patientType: PatientType
  vipLevel?: "platinum" | "gold" | "silver"
  insurance?: {
    provider: string
    policyNumber: string
    expiryDate: string
  }
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  previousSurgeries: string[]
  familyHistory?: string
  consentSigned: boolean
  privacyLevel: "standard" | "restricted" | "vip-private"
}

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  date: string
  doctor: string
  doctorId: string
  diagnosis: string
  symptoms: string[]
  vitalSigns: {
    temperature?: number
    bloodPressure?: string
    heartRate?: number
    respiratoryRate?: number
    oxygenSaturation?: number
    weight?: number
    height?: number
  }
  prescriptions?: any[]
  labTests?: any[]
  notes?: string
  followUpDate?: string
  attachments?: string[]
  restricted: boolean
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  roomNumber?: string
  patientType: PatientType
  isVip: boolean
  vipLevel?: "platinum" | "gold" | "silver"
  service: string
  serviceType: ServiceType
  doctor: string
  doctorId: string
  nurse?: string
  nurseId?: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  emergencyLevel?: EmergencyLevel
  price: number
  paymentMethod: "room-charge" | "card" | "cash" | "insurance" | "complimentary"
  checkedIn?: boolean
  checkedInTime?: string
  notes?: string
  reason?: string
  insuranceClaim?: string
}

interface Medication {
  id: string
  name: string
  genericName: string
  category: string
  form: "tablet" | "capsule" | "liquid" | "injection" | "cream" | "inhaler"
  strength: string
  manufacturer: string
  stock: number
  reorderLevel: number
  expiryDate: string
  unitPrice: number
  sellingPrice: number
  requiresPrescription: boolean
  controlled: boolean
  location: string
}

interface LabTest {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  testName: string
  testCategory: "basic" | "advanced" | "microbiology"
  orderedDate: string
  collectedDate?: string
  completedDate?: string
  status: LabTestStatus
  results?: {
    parameter: string
    value: string
    referenceRange: string
    flag?: "normal" | "high" | "low"
  }[]
  notes?: string
  file?: string
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ClinicContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMedicalRecords, setShowMedicalRecords] = useState(false)
  const [userRole, setUserRole] = useState<StaffRole>("doctor")
  
  // Data states
  const [facilities, setFacilities] = useState<ClinicFacility[]>([])
  const [staff, setStaff] = useState<MedicalStaff[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // Form states
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    roomNumber: "",
    patientType: "guest" as PatientType,
    isVip: false,
    vipLevel: "silver" as "platinum" | "gold" | "silver",
    service: "",
    serviceType: "consultation" as ServiceType,
    doctorId: "",
    date: selectedDate,
    time: "",
    reason: "",
    paymentMethod: "room-charge" as "room-charge" | "card" | "cash" | "insurance" | "complimentary"
  })

  const { config, loading: configLoading } = useHotelConfig()

  // ==========================================
  // MOCK DATA (Replace with API calls)
  // ==========================================
  
  useEffect(() => {
    setTimeout(() => {
      // Facilities
      setFacilities([
        { id: "fac1", name: "Consultation Room 1", type: "consultation", location: "Level 1", capacity: 1, currentOccupancy: 1, status: "occupied", equipment: ["Exam table"], amenities: ["Private"], temperature: 22, humidity: 45 },
        { id: "fac2", name: "Consultation Room 2", type: "consultation", location: "Level 1", capacity: 1, currentOccupancy: 0, status: "available", equipment: ["Exam table"], amenities: ["Private"], temperature: 22, humidity: 45 },
        { id: "fac3", name: "Treatment Room", type: "treatment", location: "Level 1", capacity: 1, currentOccupancy: 1, status: "occupied", equipment: ["Treatment table"], amenities: ["Medical grade"], temperature: 23, humidity: 40 },
        { id: "fac4", name: "IV Therapy Lounge", type: "treatment", location: "Level 1", capacity: 4, currentOccupancy: 2, status: "available", equipment: ["Recliners"], amenities: ["Comfortable seating"], temperature: 24, humidity: 45 },
        { id: "fac5", name: "Laboratory", type: "lab", location: "Level 1", capacity: 2, currentOccupancy: 1, status: "available", equipment: ["Analyzer"], amenities: ["Sterile"], temperature: 20, humidity: 35 },
        { id: "fac6", name: "Pharmacy", type: "pharmacy", location: "Level 1", capacity: 2, currentOccupancy: 1, status: "available", equipment: ["Storage"], amenities: ["Private"], temperature: 22, humidity: 40 },
        { id: "fac7", name: "Recovery Room", type: "recovery", location: "Level 1", capacity: 2, currentOccupancy: 0, status: "cleaning", equipment: ["Beds"], amenities: ["Privacy"], temperature: 23, humidity: 45 },
        { id: "fac8", name: "Emergency Bay", type: "emergency", location: "Level 1", capacity: 1, currentOccupancy: 0, status: "available", equipment: ["Crash cart"], amenities: ["24/7 ready"], temperature: 22, humidity: 40 }
      ])

      // Staff
      setStaff([
        { id: "doc1", name: "Dr. Sarah Chen", role: "doctor", specialization: ["Internal Medicine"], licenseNumber: "MD12345", qualifications: ["MD"], languages: ["English", "Mandarin"], experience: 12, rating: 4.9, status: "available", consultationFee: 150, schedule: [] },
        { id: "doc2", name: "Dr. James Wilson", role: "doctor", specialization: ["Emergency Medicine"], licenseNumber: "MD12346", qualifications: ["MD"], languages: ["English"], experience: 15, rating: 4.8, status: "busy", consultationFee: 180, schedule: [] },
        { id: "doc3", name: "Dr. Maria Santos", role: "doctor", specialization: ["Aesthetic Medicine"], licenseNumber: "MD12347", qualifications: ["MD"], languages: ["English", "Spanish"], experience: 8, rating: 4.9, status: "available", consultationFee: 200, schedule: [] },
        { id: "nurse1", name: "Lisa Wong", role: "nurse", qualifications: ["RN"], languages: ["English"], experience: 10, rating: 4.8, status: "available", consultationFee: 0, schedule: [] },
        { id: "nurse2", name: "Michael Brown", role: "nurse", qualifications: ["RN"], languages: ["English"], experience: 8, rating: 4.7, status: "busy", consultationFee: 0, schedule: [] },
        { id: "lab1", name: "Robert Taylor", role: "lab-technician", qualifications: ["MLT"], languages: ["English"], experience: 12, rating: 4.9, status: "available", consultationFee: 0, schedule: [] },
        { id: "pharm1", name: "Jennifer Lee", role: "pharmacist", qualifications: ["PharmD"], languages: ["English"], experience: 9, rating: 4.8, status: "available", consultationFee: 0, schedule: [] }
      ])

      // Patients
      setPatients([
        { id: "pat1", name: "Mrs. Anderson", dateOfBirth: "1975-06-15", nationality: "USA", roomNumber: "1205", phone: "+1 555-1234", emergencyContact: { name: "Mr. Anderson", phone: "+1 555-1235", relationship: "Spouse" }, patientType: "guest", vipLevel: "platinum", allergies: ["Penicillin"], chronicConditions: ["Hypertension"], medications: ["Lisinopril"], previousSurgeries: [], consentSigned: true, privacyLevel: "standard" },
        { id: "pat2", name: "Mr. Johnson", dateOfBirth: "1982-03-22", nationality: "UK", roomNumber: "808", phone: "+44 20 5555 1234", emergencyContact: { name: "Ms. Johnson", phone: "+44 20 5555 1235", relationship: "Spouse" }, patientType: "guest", allergies: ["Latex"], chronicConditions: [], medications: [], previousSurgeries: [], consentSigned: true, privacyLevel: "standard" },
        { id: "pat3", name: "Dr. Smith", dateOfBirth: "1968-11-30", nationality: "USA", roomNumber: "1502", phone: "+1 555-5678", emergencyContact: { name: "Mrs. Smith", phone: "+1 555-5679", relationship: "Spouse" }, patientType: "vip", vipLevel: "gold", allergies: ["Sulfa"], chronicConditions: ["Diabetes Type 2"], medications: ["Metformin"], previousSurgeries: ["Knee arthroscopy"], consentSigned: true, privacyLevel: "standard" }
      ])

      // Appointments
      setAppointments([
        { id: "app1", patientId: "pat1", patientName: "Mrs. Anderson", roomNumber: "1205", patientType: "guest", isVip: true, vipLevel: "platinum", service: "General Consultation", serviceType: "consultation", doctor: "Dr. Sarah Chen", doctorId: "doc1", nurse: "Lisa Wong", nurseId: "nurse1", date: selectedDate, startTime: "09:00", endTime: "09:30", status: "in-progress", price: 150, paymentMethod: "room-charge", checkedIn: true, checkedInTime: "08:55", reason: "Follow-up on hypertension" },
        { id: "app2", patientId: "pat2", patientName: "Mr. Johnson", roomNumber: "808", patientType: "guest", isVip: false, service: "Travel Vaccination", serviceType: "travel-medicine", doctor: "Dr. James Wilson", doctorId: "doc2", date: selectedDate, startTime: "10:00", endTime: "10:30", status: "scheduled", price: 120, paymentMethod: "card", reason: "Yellow fever vaccine" },
        { id: "app3", patientId: "pat3", patientName: "Dr. Smith", roomNumber: "1502", patientType: "vip", isVip: true, vipLevel: "gold", service: "IV Vitamin Therapy", serviceType: "iv-therapy", doctor: "Dr. Maria Santos", doctorId: "doc3", nurse: "Michael Brown", nurseId: "nurse2", date: selectedDate, startTime: "11:00", endTime: "12:00", status: "checked-in", price: 250, paymentMethod: "room-charge", checkedIn: true, checkedInTime: "10:50", reason: "Immunity boost" }
      ])

      // Medical Records
      setMedicalRecords([
        { id: "mr1", patientId: "pat1", patientName: "Mrs. Anderson", date: "2024-02-15", doctor: "Dr. Sarah Chen", doctorId: "doc1", diagnosis: "Hypertension - well controlled", symptoms: ["No symptoms"], vitalSigns: { temperature: 36.8, bloodPressure: "128/82", heartRate: 72, oxygenSaturation: 98 }, notes: "Continue current medication.", followUpDate: "2024-05-15", restricted: false },
        { id: "mr2", patientId: "pat3", patientName: "Dr. Smith", date: "2024-02-10", doctor: "Dr. Sarah Chen", doctorId: "doc1", diagnosis: "Diabetes Type 2 - stable", symptoms: ["No acute complaints"], vitalSigns: { temperature: 36.7, bloodPressure: "132/84", heartRate: 76, oxygenSaturation: 97 }, notes: "HbA1c 6.8 - improving.", followUpDate: "2024-05-10", restricted: false }
      ])

      // Medications
      setMedications([
        { id: "med1", name: "Lisinopril", genericName: "Lisinopril", category: "ACE Inhibitor", form: "tablet", strength: "10mg", manufacturer: "Generic", stock: 450, reorderLevel: 100, expiryDate: "2025-12-31", unitPrice: 0.15, sellingPrice: 0.45, requiresPrescription: true, controlled: false, location: "A-12" },
        { id: "med2", name: "Metformin", genericName: "Metformin", category: "Antidiabetic", form: "tablet", strength: "500mg", manufacturer: "Generic", stock: 320, reorderLevel: 100, expiryDate: "2025-10-31", unitPrice: 0.12, sellingPrice: 0.35, requiresPrescription: true, controlled: false, location: "B-05" },
        { id: "med3", name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", form: "capsule", strength: "500mg", manufacturer: "Generic", stock: 280, reorderLevel: 100, expiryDate: "2025-08-31", unitPrice: 0.25, sellingPrice: 0.75, requiresPrescription: true, controlled: false, location: "C-08" },
        { id: "med4", name: "Vitamin B12", genericName: "Cyanocobalamin", category: "Vitamin", form: "injection", strength: "1000mcg/mL", manufacturer: "PharmaCo", stock: 45, reorderLevel: 20, expiryDate: "2025-06-30", unitPrice: 2.50, sellingPrice: 15.00, requiresPrescription: false, controlled: false, location: "D-03" }
      ])

      // Lab Tests
      setLabTests([
        { id: "lab1", patientId: "pat3", patientName: "Dr. Smith", doctorId: "doc1", doctorName: "Dr. Sarah Chen", testName: "Complete Blood Count", testCategory: "advanced", orderedDate: "2024-02-10", collectedDate: "2024-02-10", completedDate: "2024-02-11", status: "completed", results: [{ parameter: "WBC", value: "6.2", referenceRange: "4.5-11.0", flag: "normal" }, { parameter: "Hemoglobin", value: "14.2", referenceRange: "13.5-17.5", flag: "normal" }] }
      ])

      setIsLoading(false)
    }, 500)
  }, [selectedDate])

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const todayAppointments = useMemo(() => 
    appointments.filter(a => a.date === selectedDate),
    [appointments, selectedDate]
  )

  const activePatients = useMemo(() => 
    todayAppointments.filter(a => a.status === "in-progress" || a.status === "checked-in" || a.status === "emergency").length,
    [todayAppointments]
  )

  const waitingPatients = useMemo(() => 
    todayAppointments.filter(a => a.status === "checked-in").length,
    [todayAppointments]
  )

  const emergencyCases = useMemo(() => 
    todayAppointments.filter(a => a.status === "emergency").length,
    [todayAppointments]
  )

  const totalRevenue = useMemo(() => 
    todayAppointments.reduce((sum, a) => sum + a.price, 0),
    [todayAppointments]
  )

  const occupancyRate = useMemo(() => {
    if (facilities.length === 0) return 0
    const occupied = facilities.filter(f => f.status === "occupied").length
    return Math.round((occupied / facilities.length) * 100)
  }, [facilities])

  const lowStockMedications = useMemo(() => 
    medications.filter(m => m.stock <= m.reorderLevel).length,
    [medications]
  )

  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter(a => a.date === selectedDate)
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.roomNumber?.includes(searchQuery) ||
        a.doctor.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }, [appointments, selectedDate, searchQuery])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreateAppointment = () => {
    if (!newAppointment.patientName || !newAppointment.doctorId || !newAppointment.time) {
      alert("Please fill in all required fields")
      return
    }

    const selectedDoctor = staff.find(s => s.id === newAppointment.doctorId)
    if (!selectedDoctor) return

    const appointment: Appointment = {
      id: `app-${Date.now()}`,
      patientId: `temp-${Date.now()}`,
      patientName: newAppointment.patientName,
      roomNumber: newAppointment.roomNumber || undefined,
      patientType: newAppointment.patientType,
      isVip: newAppointment.isVip,
      vipLevel: newAppointment.isVip ? newAppointment.vipLevel : undefined,
      service: newAppointment.service || "Consultation",
      serviceType: newAppointment.serviceType,
      doctor: selectedDoctor.name,
      doctorId: newAppointment.doctorId,
      date: newAppointment.date,
      startTime: newAppointment.time,
      endTime: new Date(new Date(`2000-01-01T${newAppointment.time}`).getTime() + 30*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "scheduled",
      price: selectedDoctor.consultationFee || 150,
      paymentMethod: newAppointment.paymentMethod,
      reason: newAppointment.reason
    }

    setAppointments([appointment, ...appointments])
    setIsAppointmentModalOpen(false)
    setNewAppointment({
      patientName: "",
      roomNumber: "",
      patientType: "guest",
      isVip: false,
      vipLevel: "silver",
      service: "",
      serviceType: "consultation",
      doctorId: "",
      date: selectedDate,
      time: "",
      reason: "",
      paymentMethod: "room-charge"
    })
  }

  const handleCheckIn = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status: "checked-in",
              checkedIn: true,
              checkedInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : a
      )
    )
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getAppointmentStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "checked-in": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "in-progress": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "cancelled": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
      case "no-show": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "emergency": return "bg-red-600/20 text-red-400 border-red-600/30 animate-pulse"
    }
  }

  const getServiceTypeIcon = (type: ServiceType) => {
    switch (type) {
      case "consultation": return <Stethoscope className="h-4 w-4" />
      case "specialist": return <HeartMonitor className="h-4 w-4" />
      case "travel-medicine": return <MapPin className="h-4 w-4" />
      case "iv-therapy": return <Droplets className="h-4 w-4" />
      case "aesthetic": return <Heart className="h-4 w-4" />
      case "emergency": return <Ambulance className="h-4 w-4" />
      case "screening": return <Activity className="h-4 w-4" />
      case "physiotherapy": return <Bone className="h-4 w-4" />
      case "mental-health": return <Brain className="h-4 w-4" />
      case "telemedicine": return <Phone className="h-4 w-4" />
    }
  }

  const getServiceTypeColor = (type: ServiceType) => {
    switch (type) {
      case "consultation": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "specialist": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "travel-medicine": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "iv-therapy": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      case "aesthetic": return "bg-pink-500/10 text-pink-400 border-pink-500/20"
      case "emergency": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "screening": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "physiotherapy": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "mental-health": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      case "telemedicine": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
    }
  }

  const getVipBadge = (level?: string) => {
    switch (level) {
      case "platinum": return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-[8px] tracking-widest uppercase shadow-[0_0_8px_rgba(168,85,247,0.2)]">PLATINUM</Badge>
      case "gold": return <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 text-[8px] tracking-widest uppercase shadow-[0_0_8px_rgba(251,191,36,0.2)]">GOLD</Badge>
      case "silver": return <Badge className="bg-slate-600/20 text-[#8E939D] border-slate-600/30 text-[8px] tracking-widest uppercase">SILVER</Badge>
      default: return null
    }
  }

  const getStaffStatusColor = (status: MedicalStaff["status"]) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400"
      case "busy": return "bg-[#00f2ff]/10 text-[#00f2ff]"
      case "break": return "bg-amber-500/10 text-amber-400"
      case "off": return "bg-slate-500/10 text-[#8E939D]"
    }
  }

  const getFacilityStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400"
      case "occupied": return "bg-[#00f2ff]/10 text-[#00f2ff]"
      case "cleaning": return "bg-amber-500/10 text-amber-400"
      case "maintenance": return "bg-red-500/10 text-red-400"
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
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full bg-[#00f2ff]/5" />
          <Skeleton className="h-64 w-full bg-[#00f2ff]/5" />
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
            <Stethoscope className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            MEDICAL CLINIC <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> HEALTHCARE CENTER
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
            {facilities.length} FACILITIES · {staff.filter(s => s.role === "doctor").length} DOCTORS · {todayAppointments.length} APPOINTMENTS TODAY
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          {userRole === "doctor" || userRole === "administrator" ? (
            <Button 
              variant="ghost" 
              size="sm"
              className={`text-[10px] font-bold uppercase tracking-widest h-8 ${showMedicalRecords ? "text-emerald-400" : "text-[#5C6270] hover:text-[#00f2ff]"}`}
              onClick={() => setShowMedicalRecords(!showMedicalRecords)}
            >
              {showMedicalRecords ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
              {showMedicalRecords ? "HIDE RECORDS" : "SHOW RECORDS"}
            </Button>
          ) : null}
          
          <Button 
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-400 hover:bg-red-500/10 h-8"
            onClick={() => setIsEmergencyModalOpen(true)}
          >
            <Ambulance className="mr-1 h-3 w-3" />
            EMERGENCY
          </Button>

          <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                <Plus className="mr-1 h-3 w-3" />
                NEW APPOINTMENT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
              <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" /> SCHEDULE NEW APPOINTMENT
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PATIENT NAME *</Label>
                    <Input
                      placeholder="FULL NAME"
                      value={newAppointment.patientName}
                      onChange={(e) => setNewAppointment({...newAppointment, patientName: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">ROOM NUMBER</Label>
                    <Input
                      placeholder="E.G., 1205"
                      value={newAppointment.roomNumber}
                      onChange={(e) => setNewAppointment({...newAppointment, roomNumber: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isVip"
                      checked={newAppointment.isVip}
                      onCheckedChange={(checked) => setNewAppointment({...newAppointment, isVip: checked as boolean})}
                      className="border-[#00f2ff]/30 data-[state=checked]:bg-[#00f2ff]"
                    />
                    <Label htmlFor="isVip" className="text-[9px] font-bold uppercase tracking-widest text-slate-300">VIP PATIENT</Label>
                  </div>
                  
                  {newAppointment.isVip && (
                    <Select 
                      value={newAppointment.vipLevel} 
                      onValueChange={(value: "platinum" | "gold" | "silver") => 
                        setNewAppointment({...newAppointment, vipLevel: value})
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SERVICE TYPE *</Label>
                    <Select 
                      value={newAppointment.serviceType} 
                      onValueChange={(value: ServiceType) => setNewAppointment({...newAppointment, serviceType: value})}
                    >
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue placeholder="SELECT TYPE" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        <SelectItem value="consultation" className="text-[9px] font-bold uppercase">GENERAL CONSULTATION</SelectItem>
                        <SelectItem value="specialist" className="text-[9px] font-bold uppercase">SPECIALIST CONSULTATION</SelectItem>
                        <SelectItem value="travel-medicine" className="text-[9px] font-bold uppercase">TRAVEL MEDICINE</SelectItem>
                        <SelectItem value="iv-therapy" className="text-[9px] font-bold uppercase">IV THERAPY</SelectItem>
                        <SelectItem value="screening" className="text-[9px] font-bold uppercase">HEALTH SCREENING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SERVICE NAME</Label>
                    <Input
                      placeholder="E.G., GENERAL CONSULTATION"
                      value={newAppointment.service}
                      onChange={(e) => setNewAppointment({...newAppointment, service: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DOCTOR *</Label>
                  <Select 
                    value={newAppointment.doctorId} 
                    onValueChange={(value) => setNewAppointment({...newAppointment, doctorId: value})}
                  >
                    <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                      <SelectValue placeholder="SELECT DOCTOR" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                      {staff.filter(s => s.role === "doctor").map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id} className="text-[9px] font-bold uppercase">
                          <div className="flex items-center justify-between w-full">
                            <span>{doctor.name}</span>
                            <Badge className={`ml-2 ${getStaffStatusColor(doctor.status)} text-[7px] tracking-widest`}>
                              {doctor.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DATE *</Label>
                    <Input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">TIME *</Label>
                    <Input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                      className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">REASON FOR VISIT</Label>
                  <Textarea
                    placeholder="BRIEF DESCRIPTION OF SYMPTOMS OR REASON"
                    value={newAppointment.reason}
                    onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                    className="bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[8px] font-bold uppercase tracking-widest placeholder:text-[7px] min-h-[60px]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PAYMENT METHOD</Label>
                  <Select 
                    value={newAppointment.paymentMethod} 
                    onValueChange={(value: any) => setNewAppointment({...newAppointment, paymentMethod: value})}
                  >
                    <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                      <SelectValue placeholder="SELECT METHOD" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                      <SelectItem value="room-charge" className="text-[9px] font-bold uppercase">ROOM CHARGE</SelectItem>
                      <SelectItem value="card" className="text-[9px] font-bold uppercase">CREDIT CARD</SelectItem>
                      <SelectItem value="cash" className="text-[9px] font-bold uppercase">CASH</SelectItem>
                      <SelectItem value="insurance" className="text-[9px] font-bold uppercase">INSURANCE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 text-slate-300 hover:bg-[#00f2ff]/10 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => setIsAppointmentModalOpen(false)}
                >
                  CANCEL
                </Button>
                <Button 
                  className="flex-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                  onClick={handleCreateAppointment}
                >
                  SCHEDULE APPOINTMENT
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1️⃣ Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "ACTIVE PATIENTS", val: activePatients, color: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" },
          { label: "WAITING", val: waitingPatients, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
          { label: "EMERGENCY", val: emergencyCases, color: "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
          { label: "REVENUE TODAY", val: `$${totalRevenue}`, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" },
          { label: "OCCUPANCY", val: `${occupancyRate}%`, color: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" },
          { label: "LOW STOCK", val: lowStockMedications, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">{kpi.label}</p>
              <p className={cn("text-lg font-bold tracking-tight", kpi.color)}>{kpi.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2️⃣ Facilities Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {facilities.map(facility => (
          <Card key={facility.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-2 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors truncate">{facility.name}</span>
                <Badge className={`text-[6px] tracking-widest uppercase ${getFacilityStatusBadge(facility.status)} border-0`}>
                  {facility.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest">
                <span className="text-[#5C6270]">OCCUPANCY</span>
                <span className="text-slate-300">{facility.currentOccupancy}/{facility.capacity}</span>
              </div>
              {facility.temperature && (
                <div className="flex items-center gap-1 mt-1 text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">
                  <Thermometer className="h-2 w-2" />
                  <span>{facility.temperature}°C</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3️⃣ Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1 flex-wrap">
          <TabsTrigger value="overview" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            TODAY'S SCHEDULE
          </TabsTrigger>
          <TabsTrigger value="patients" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            PATIENTS
          </TabsTrigger>
          <TabsTrigger value="staff" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            MEDICAL STAFF
          </TabsTrigger>
          <TabsTrigger value="pharmacy" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            PHARMACY
          </TabsTrigger>
          <TabsTrigger value="lab" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            LABORATORY
          </TabsTrigger>
          {showMedicalRecords && (
            <TabsTrigger value="records" className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/10 data-[state=active]:shadow-[0_0_10px_rgba(52,211,153,0.1)]">
              MEDICAL RECORDS
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab - Today's Schedule */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
              <Input
                placeholder="SEARCH APPOINTMENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
              />
            </div>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[140px] h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="SELECT DATE" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                <SelectItem value={new Date().toISOString().split('T')[0]} className="text-[9px] font-bold uppercase">TODAY</SelectItem>
                <SelectItem value={new Date(Date.now() + 86400000).toISOString().split('T')[0]} className="text-[9px] font-bold uppercase">TOMORROW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredAppointments
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(appointment => (
                <div
                  key={appointment.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group relative overflow-hidden ${
                    appointment.status === "emergency" ? "border-red-500/30 bg-red-950/20 hover:border-red-500/50" :
                    appointment.isVip ? "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50" :
                    "bg-[#00f2ff]/5 border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10"
                  }`}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="w-16 text-[11px] font-mono font-bold text-[#00f2ff] relative z-10">
                    {appointment.startTime}
                  </div>

                  <div className={`p-2 rounded-lg ${getServiceTypeColor(appointment.serviceType)} relative z-10`}>
                    {getServiceTypeIcon(appointment.serviceType)}
                  </div>

                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{appointment.patientName}</span>
                      {appointment.roomNumber && (
                        <Badge variant="outline" className="border-[#00f2ff]/30 text-[8px] tracking-widest uppercase font-bold">ROOM {appointment.roomNumber}</Badge>
                      )}
                      {appointment.isVip && getVipBadge(appointment.vipLevel)}
                      {appointment.status === "emergency" && (
                        <Badge className="bg-red-600/20 text-red-400 text-[7px] tracking-widest uppercase border-0 shadow-[0_0_5px_rgba(239,68,68,0.2)] animate-pulse">EMERGENCY</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                      <span>{appointment.service}</span>
                      <span>•</span>
                      <span>WITH {appointment.doctor}</span>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <Badge className={`${getAppointmentStatusColor(appointment.status)} text-[7px] tracking-widest uppercase border-0`}>
                      {appointment.status}
                    </Badge>
                    <p className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)] mt-1">${appointment.price}</p>
                  </div>

                  {appointment.status === "scheduled" && (
                    <Button 
                      size="sm" 
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[8px] font-bold uppercase tracking-widest h-7 border border-emerald-500/40 shadow-[0_0_5px_rgba(52,211,153,0.2)] relative z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCheckIn(appointment.id)
                      }}
                    >
                      CHECK IN
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {patients.map(patient => (
              <Card key={patient.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-[#00f2ff]/30">
                      <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold">
                        {patient.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{patient.name}</h3>
                        {patient.vipLevel && getVipBadge(patient.vipLevel)}
                      </div>
                      
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">
                        {patient.roomNumber ? `ROOM ${patient.roomNumber}` : patient.nationality}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1 text-[7px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1 text-[#5C6270]">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{patient.dateOfBirth}</span>
                        </div>
                      </div>

                      {patient.allergies.length > 0 && (
                        <div className="mt-1">
                          <Badge variant="outline" className="border-red-500/30 text-red-400 text-[6px] tracking-widest uppercase font-bold">
                            ALLERGIES: {patient.allergies.join(", ")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {staff.map(member => (
              <Card key={member.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-[#00f2ff]/30">
                      <AvatarFallback className={cn(
                        "text-[10px] font-bold",
                        member.role === "doctor" ? "bg-blue-500/10 text-blue-400" :
                        member.role === "nurse" ? "bg-emerald-500/10 text-emerald-400" :
                        member.role === "lab-technician" ? "bg-purple-500/10 text-purple-400" :
                        "bg-amber-500/10 text-amber-400"
                      )}>
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{member.name}</h3>
                        <Badge className={`${getStaffStatusColor(member.status)} text-[7px] tracking-widest uppercase border-0`}>
                          {member.status}
                        </Badge>
                      </div>
                      
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5 capitalize">{member.role}</p>
                      
                      <div className="flex items-center gap-2 mt-1 text-[7px] font-bold uppercase tracking-widest">
                        {member.specialization && (
                          <span className="text-slate-300">{member.specialization.join(", ")}</span>
                        )}
                      </div>
                      
                      {member.role === "doctor" && (
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span className="text-[7px]">{member.rating}</span>
                          </div>
                          <span className="text-emerald-400 text-[8px] font-bold">${member.consultationFee}/CONSULT</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pharmacy Tab */}
        <TabsContent value="pharmacy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {medications.map(med => (
              <Card key={med.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-[10px] text-[#8E939D] group-hover:text-[#00f2ff] transition-colors uppercase">{med.name}</h3>
                    <Badge className={cn(
                      "text-[7px] tracking-widest uppercase border-0",
                      med.stock <= med.reorderLevel ? "bg-red-600/20 text-red-400" :
                      med.stock <= med.reorderLevel * 2 ? "bg-amber-600/20 text-amber-400" :
                      "bg-emerald-600/20 text-emerald-400"
                    )}>
                      {med.stock} UNITS
                    </Badge>
                  </div>
                  
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">{med.genericName} · {med.strength}</p>
                  
                  <div className="space-y-0.5 text-[7px] font-bold uppercase tracking-widest">
                    <div className="flex justify-between">
                      <span className="text-[#5C6270]">FORM</span>
                      <span className="text-slate-300 capitalize">{med.form}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C6270]">EXPIRY</span>
                      <span className="text-slate-300">{med.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C6270]">PRICE</span>
                      <span className="text-emerald-400">${med.sellingPrice}</span>
                    </div>
                  </div>

                  {med.controlled && (
                    <Badge className="mt-1 bg-red-600/20 text-red-400 text-[6px] tracking-widest uppercase border-0">CONTROLLED</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lab Tab */}
        <TabsContent value="lab" className="space-y-4">
          <div className="space-y-2">
            {labTests.map(test => (
              <div key={test.id} className="p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-[11px] text-[#8E939D] group-hover:text-[#00f2ff] transition-colors uppercase">{test.testName}</h3>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PATIENT: {test.patientName} · DR. {test.doctorName}</p>
                  </div>
                  <Badge className={cn(
                    "text-[7px] tracking-widest uppercase border-0",
                    test.status === "completed" ? "bg-emerald-600/20 text-emerald-400" :
                    test.status === "processing" ? "bg-[#00f2ff]/20 text-[#00f2ff]" :
                    "bg-amber-600/20 text-amber-400"
                  )}>
                    {test.status}
                  </Badge>
                </div>

                {test.results && (
                  <div className="mt-2 space-y-1">
                    {test.results.map((result, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest">
                        <span className="w-24 text-[#5C6270]">{result.parameter}</span>
                        <span className="text-slate-300">{result.value}</span>
                        <span className="text-[#5C6270]">({result.referenceRange})</span>
                        {result.flag === "high" && (
                          <Badge className="bg-red-600/20 text-red-400 text-[6px]">HIGH</Badge>
                        )}
                        {result.flag === "low" && (
                          <Badge className="bg-blue-600/20 text-blue-400 text-[6px]">LOW</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Medical Records Tab (Restricted) */}
        {showMedicalRecords && (
          <TabsContent value="records" className="space-y-4">
            <div className="space-y-2">
              {medicalRecords.map(record => (
                <div key={record.id} className="p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-[11px] text-[#8E939D] group-hover:text-[#00f2ff] transition-colors uppercase">{record.patientName}</h3>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DR. {record.doctor} · {record.date}</p>
                    </div>
                    {record.restricted && (
                      <Shield className="h-3 w-3 text-red-400" />
                    )}
                  </div>

                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-1"><span className="text-[#5C6270]">DIAGNOSIS:</span> {record.diagnosis}</p>
                  
                  {record.vitalSigns && (
                    <div className="grid grid-cols-4 gap-2 mt-2 text-[7px] font-bold uppercase tracking-widest">
                      {record.vitalSigns.bloodPressure && (
                        <div>
                          <span className="text-[#5C6270]">BP</span>
                          <p className="text-slate-300">{record.vitalSigns.bloodPressure}</p>
                        </div>
                      )}
                      {record.vitalSigns.heartRate && (
                        <div>
                          <span className="text-[#5C6270]">HR</span>
                          <p className="text-slate-300">{record.vitalSigns.heartRate} BPM</p>
                        </div>
                      )}
                      {record.vitalSigns.temperature && (
                        <div>
                          <span className="text-[#5C6270]">TEMP</span>
                          <p className="text-slate-300">{record.vitalSigns.temperature}°C</p>
                        </div>
                      )}
                      {record.vitalSigns.oxygenSaturation && (
                        <div>
                          <span className="text-[#5C6270]">SpO2</span>
                          <p className="text-slate-300">{record.vitalSigns.oxygenSaturation}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  {record.followUpDate && (
                    <div className="mt-2 pt-2 border-t border-[#00f2ff]/20">
                      <p className="text-[7px] font-bold uppercase tracking-widest text-amber-400">FOLLOW-UP: {record.followUpDate}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Emergency Triage Dialog */}
      <Dialog open={isEmergencyModalOpen} onOpenChange={setIsEmergencyModalOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-red-500/30 text-[#8E939D] max-w-2xl">
          <DialogHeader className="border-b border-red-500/30 pb-3">
            <DialogTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-red-400">
              <Ambulance className="h-5 w-5" />
              EMERGENCY TRIAGE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-red-950/20 border-red-500/30 cursor-pointer hover:bg-red-900/30 transition-all group">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="font-bold text-[#8E939D] text-sm uppercase tracking-widest">MINOR</h3>
                  <p className="text-[8px] text-[#5C6270] uppercase tracking-widest">NON-URGENT</p>
                </CardContent>
              </Card>
              <Card className="bg-red-950/20 border-red-500/30 cursor-pointer hover:bg-red-900/30 transition-all group">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                  <h3 className="font-bold text-[#8E939D] text-sm uppercase tracking-widest">MODERATE</h3>
                  <p className="text-[8px] text-[#5C6270] uppercase tracking-widest">URGENT CARE</p>
                </CardContent>
              </Card>
              <Card className="bg-red-950/20 border-red-500/30 cursor-pointer hover:bg-red-900/30 transition-all group">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2 animate-pulse" />
                  <h3 className="font-bold text-[#8E939D] text-sm uppercase tracking-widest">CRITICAL</h3>
                  <p className="text-[8px] text-[#5C6270] uppercase tracking-widest">IMMEDIATE</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-1">
              <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DESCRIPTION</Label>
              <Textarea
                placeholder="DESCRIBE THE EMERGENCY SITUATION..."
                className="bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[8px] font-bold uppercase tracking-widest placeholder:text-[7px] min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 border-[#00f2ff]/20 text-slate-300 hover:bg-[#00f2ff]/10 text-[10px] font-bold uppercase tracking-widest"
                onClick={() => setIsEmergencyModalOpen(false)}
              >
                CANCEL
              </Button>
              <Button 
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                onClick={() => setIsEmergencyModalOpen(false)}
              >
                ACTIVATE EMERGENCY PROTOCOL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-emerald-400" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">AVG WAIT TIME</span>
              <span className="text-[10px] font-bold text-[#8E939D] ml-auto">8 MIN</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-blue-400" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">TODAY'S PATIENTS</span>
              <span className="text-[10px] font-bold text-[#8E939D] ml-auto">{todayAppointments.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SATISFACTION</span>
              <span className="text-[10px] font-bold text-[#8E939D] ml-auto">4.9/5</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-amber-400" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">NEXT AVAILABLE</span>
              <span className="text-[10px] font-bold text-[#8E939D] ml-auto">DR. CHEN</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}