"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Wrench, AlertTriangle, CheckCircle2, Clock, Calendar,
  TrendingUp, ArrowUpRight, Search, Filter, Plus,
  Download, Printer, Eye, EyeOff, MoreHorizontal,
  Edit, Trash2, Copy, RefreshCw, Power,
  Thermometer, Droplets, Zap, Flame, Wind,
  Gauge, BarChart3, PieChart, LineChart,
  Building2, Hotel, Settings, Shield,
  FileText, ClipboardList, ClipboardCheck,
  Users, Truck, Package, Box,
  Lightbulb, Fan, Snowflake, Waves,
  Battery, Cpu, Cctv, Key,
  Hammer, Paintbrush, HardHat, 
  X, Save, Send, Calendar as CalendarIcon,
  MapPin, User, Phone, Mail, Globe,
  DollarSign, Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// ==========================================
// TYPES (same as original)
// ==========================================

type Priority = "critical" | "high" | "medium" | "low"
type WorkOrderStatus = "open" | "assigned" | "in-progress" | "pending-parts" | "resolved" | "closed" | "cancelled"
type MaintenanceType = "preventive" | "corrective" | "emergency" | "predictive" | "shutdown" | "statutory"
type AssetCriticality = "A" | "B" | "C" | "D"
type EquipmentStatus = "operational" | "maintenance" | "offline" | "standby" | "out-of-service"
type ReportType = "daily" | "weekly" | "monthly" | "quarterly" | "annual"

interface Asset {
  id: string
  assetId: string
  name: string
  model: string
  manufacturer: string
  serialNumber: string
  location: string
  floor?: number
  zone: string
  criticality: AssetCriticality
  status: EquipmentStatus
  installationDate: string
  warrantyExpiry: string
  estimatedLifespan: number
  replacementCost: number
  lastMaintenance: string
  nextMaintenance: string
  maintenanceInterval: number
  documents: string[]
  barcode?: string
  notes?: string
}

interface WorkOrder {
  id: string
  woNumber: string
  title: string
  description: string
  type: MaintenanceType
  priority: Priority
  status: WorkOrderStatus
  assetId?: string
  assetName?: string
  location: string
  reportedBy: string
  reportedAt: string
  assignedTo?: string
  assignedAt?: string
  startedAt?: string
  resolvedAt?: string
  closedAt?: string
  estimatedHours: number
  actualHours?: number
  partsUsed?: {
    partId: string
    partName: string
    quantity: number
    cost: number
  }[]
  cost?: number
  notes?: string
  attachments?: string[]
  guestComplaint?: boolean
  guestName?: string
  roomNumber?: string
}

interface PreventiveMaintenance {
  id: string
  pmNumber: string
  title: string
  description: string
  assetId: string
  assetName: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "semi-annual" | "annual"
  intervalDays?: number
  lastPerformed: string
  nextDue: string
  assignedTo?: string
  estimatedDuration: number
  checklist: {
    item: string
    required: boolean
    completed?: boolean
  }[]
  status: "scheduled" | "overdue" | "completed" | "skipped"
  attachments?: string[]
}

interface EnergyReading {
  timestamp: string
  electricityKwh: number
  waterM3: number
  gasM3?: number
  steamKg?: number
  temperature?: number
  humidity?: number
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  manufacturer: string
  stock: number
  reorderLevel: number
  maxLevel: number
  unit: string
  unitCost: number
  location: string
  lastOrdered?: string
  supplier: string
  leadTime: number
  notes?: string
}

interface StaffMember {
  id: string
  name: string
  role: "engineer" | "technician" | "electrician" | "plumber" | "hvac" | "supervisor"
  skills: string[]
  certifications: string[]
  status: "on-duty" | "off-duty" | "break" | "training"
  currentTask?: string
  completedToday: number
  avatar?: string
}

interface ComplianceItem {
  id: string
  title: string
  category: "fire" | "safety" | "environmental" | "health" | "legal"
  frequency: string
  lastDone: string
  nextDue: string
  status: "compliant" | "due-soon" | "overdue"
  authority?: string
  certificate?: string
  notes?: string
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function EngineeringContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<Priority | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | "all">("all")
  
  // Data states
  const [assets, setAssets] = useState<Asset[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [preventiveMaintenance, setPreventiveMaintenance] = useState<PreventiveMaintenance[]>([])
  const [energyReadings, setEnergyReadings] = useState<EnergyReading[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [compliance, setCompliance] = useState<ComplianceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isNewWorkOrderOpen, setIsNewWorkOrderOpen] = useState(false)
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)
  const [isWorkOrderDetailOpen, setIsWorkOrderDetailOpen] = useState(false)
  const [isPMDetailOpen, setIsPMDetailOpen] = useState(false)
  const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [selectedPM, setSelectedPM] = useState<PreventiveMaintenance | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  // New Work Order Form State
  const [newWorkOrder, setNewWorkOrder] = useState({
    title: "",
    description: "",
    type: "corrective" as MaintenanceType,
    priority: "medium" as Priority,
    location: "",
    assetId: "",
    reportedBy: "",
    guestComplaint: false,
    guestName: "",
    roomNumber: "",
    estimatedHours: 1
  })

  // Report Generation State
  const [reportType, setReportType] = useState<ReportType>("daily")
  const [reportDate, setReportDate] = useState<Date>(new Date())
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel" | "csv">("pdf")

  const { config, loading: configLoading } = useHotelConfig()

  // ==========================================
  // MOCK DATA (Replace with API calls)
  // ==========================================
  
  useEffect(() => {
    setTimeout(() => {
      setAssets([
        { id: "ast1", assetId: "HVAC-001", name: "Chiller #1", model: "York YVAA", manufacturer: "Johnson Controls", serialNumber: "YVAA-2023-1234", location: "Mechanical Room B1", zone: "Basement", criticality: "A", status: "operational", installationDate: "2023-01-15", warrantyExpiry: "2028-01-15", estimatedLifespan: 20, replacementCost: 85000, lastMaintenance: "2024-02-10", nextMaintenance: "2024-03-10", maintenanceInterval: 30, documents: [], notes: "" },
        { id: "ast2", assetId: "ELEV-001", name: "Passenger Elevator 1", model: "Otis Gen2", manufacturer: "Otis", serialNumber: "OTIS-2022-5678", location: "Lobby Tower A", zone: "Public Area", criticality: "A", status: "operational", installationDate: "2022-06-20", warrantyExpiry: "2027-06-20", estimatedLifespan: 25, replacementCost: 120000, lastMaintenance: "2024-02-15", nextMaintenance: "2024-03-15", maintenanceInterval: 30, documents: [], notes: "" },
        { id: "ast3", assetId: "BOIL-001", name: "Boiler #1", model: "Cleaver-Brooks 400", manufacturer: "Cleaver-Brooks", serialNumber: "CB-2021-9012", location: "Boiler Room", zone: "Basement", criticality: "A", status: "maintenance", installationDate: "2021-11-10", warrantyExpiry: "2026-11-10", estimatedLifespan: 15, replacementCost: 65000, lastMaintenance: "2024-02-20", nextMaintenance: "2024-03-20", maintenanceInterval: 30, documents: [], notes: "" }
      ])

      setWorkOrders([
        { id: "wo1", woNumber: "WO-2024-001", title: "Guest room 1205 - No hot water", description: "Guest reported no hot water in shower.", type: "corrective", priority: "high", status: "in-progress", location: "Room 1205", reportedBy: "Front Desk", reportedAt: "2024-03-02T08:30:00", assignedTo: "John Davis", estimatedHours: 2, actualHours: 1.5, partsUsed: [{ partId: "p1", partName: "Water heater element", quantity: 1, cost: 45 }], cost: 95, notes: "", guestComplaint: true, guestName: "Mr. Anderson", roomNumber: "1205" },
        { id: "wo2", woNumber: "WO-2024-002", title: "Lobby AC not cooling", description: "Lobby temperature rising, AC unit blowing warm air", type: "corrective", priority: "critical", status: "assigned", location: "Lobby", reportedBy: "Front Office Manager", reportedAt: "2024-03-02T09:15:00", assignedTo: "Mike Roberts", estimatedHours: 3, notes: "" },
        { id: "wo3", woNumber: "WO-2024-003", title: "Pool pump noisy", description: "Pool pump making grinding noise", type: "preventive", priority: "medium", status: "open", location: "Pool mechanical room", reportedBy: "Pool Attendant", reportedAt: "2024-03-02T10:00:00", estimatedHours: 2 },
        { id: "wo4", woNumber: "WO-2024-004", title: "Kitchen exhaust fan vibration", description: "Exhaust fan vibrating excessively", type: "corrective", priority: "high", status: "pending-parts", location: "Main Kitchen", reportedBy: "Chef", reportedAt: "2024-03-01T14:30:00", assignedTo: "Sarah Kim", estimatedHours: 2, notes: "" },
        { id: "wo5", woNumber: "WO-2024-005", title: "Room 808 light flickering", description: "Guest reported flickering lights", type: "corrective", priority: "low", status: "resolved", location: "Room 808", reportedBy: "Housekeeping", reportedAt: "2024-03-01T11:00:00", assignedTo: "David Lee", estimatedHours: 1, actualHours: 0.5, cost: 22, notes: "" }
      ])

      setPreventiveMaintenance([
        { id: "pm1", pmNumber: "PM-2024-001", title: "Chiller #1 Monthly Inspection", description: "Check refrigerant levels and clean coils", assetId: "ast1", assetName: "Chiller #1", frequency: "monthly", lastPerformed: "2024-02-10", nextDue: "2024-03-10", assignedTo: "Mike Roberts", estimatedDuration: 120, checklist: [], status: "scheduled" },
        { id: "pm2", pmNumber: "PM-2024-002", title: "Elevator #1 Quarterly Safety Check", description: "Full safety inspection and lubrication", assetId: "ast2", assetName: "Passenger Elevator 1", frequency: "quarterly", lastPerformed: "2024-01-15", nextDue: "2024-04-15", assignedTo: "Otis Service", estimatedDuration: 180, checklist: [], status: "scheduled" },
        { id: "pm3", pmNumber: "PM-2024-003", title: "Boiler #1 Annual Service", description: "Complete annual maintenance", assetId: "ast3", assetName: "Boiler #1", frequency: "annual", lastPerformed: "2023-03-20", nextDue: "2024-03-20", assignedTo: "Honeywell Service", estimatedDuration: 480, checklist: [], status: "overdue" }
      ])

      setStaff([
        { id: "st1", name: "John Davis", role: "engineer", skills: ["HVAC", "Electrical"], certifications: [], status: "on-duty", completedToday: 3 },
        { id: "st2", name: "Mike Roberts", role: "technician", skills: ["Plumbing", "General"], certifications: [], status: "on-duty", completedToday: 2 },
        { id: "st3", name: "Sarah Kim", role: "electrician", skills: ["Electrical", "Controls"], certifications: [], status: "on-duty", completedToday: 1 },
        { id: "st4", name: "David Lee", role: "plumber", skills: ["Plumbing"], certifications: [], status: "break", completedToday: 2 },
        { id: "st5", name: "Emma Wilson", role: "hvac", skills: ["HVAC", "Refrigeration"], certifications: [], status: "on-duty", completedToday: 4 }
      ])

      setInventory([
        { id: "inv1", sku: "BULB-LED-001", name: "LED Bulb 9W", category: "Lighting", manufacturer: "Philips", stock: 245, reorderLevel: 50, maxLevel: 300, unit: "pcs", unitCost: 5.5, location: "Store A-12", supplier: "Electrical Supply Co", leadTime: 3 },
        { id: "inv2", sku: "FILTER-AHU-001", name: "AHU Filter 24x24", category: "HVAC", manufacturer: "Camfil", stock: 32, reorderLevel: 20, maxLevel: 60, unit: "pcs", unitCost: 18, location: "Store B-05", supplier: "HVAC Distributors", leadTime: 5 },
        { id: "inv3", sku: "BELT-001", name: "Fan Belt A-45", category: "HVAC", manufacturer: "Gates", stock: 8, reorderLevel: 10, maxLevel: 30, unit: "pcs", unitCost: 12, location: "Store B-06", supplier: "HVAC Distributors", leadTime: 4, notes: "Reorder urgently" }
      ])

      setCompliance([
        { id: "comp1", title: "Fire Alarm System Test", category: "fire", frequency: "Weekly", lastDone: "2024-03-01", nextDue: "2024-03-08", status: "compliant" },
        { id: "comp2", title: "Elevator Annual Certification", category: "safety", frequency: "Annual", lastDone: "2023-06-20", nextDue: "2024-06-20", status: "due-soon" },
        { id: "comp3", title: "Boiler Inspection", category: "safety", frequency: "Annual", lastDone: "2023-03-20", nextDue: "2024-03-20", status: "overdue" }
      ])

      const readings: EnergyReading[] = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        readings.push({
          timestamp: d.toISOString().split('T')[0],
          electricityKwh: 8500 + Math.floor(Math.random() * 1000),
          waterM3: 120 + Math.floor(Math.random() * 20),
          temperature: 22 + Math.floor(Math.random() * 3),
          humidity: 45 + Math.floor(Math.random() * 10)
        })
      }
      setEnergyReadings(readings)

      setIsLoading(false)
    }, 500)
  }, [])

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const openWorkOrders = useMemo(() => workOrders.filter(wo => !["resolved", "closed", "cancelled"].includes(wo.status)).length, [workOrders])
  const criticalWorkOrders = useMemo(() => workOrders.filter(wo => wo.priority === "critical" && !["resolved", "closed", "cancelled"].includes(wo.status)).length, [workOrders])
  const overduePM = useMemo(() => preventiveMaintenance.filter(pm => pm.status === "overdue").length, [preventiveMaintenance])
  const upcomingPM = useMemo(() => preventiveMaintenance.filter(pm => pm.status === "scheduled" && new Date(pm.nextDue) <= new Date(Date.now() + 7*86400000)).length, [preventiveMaintenance])
  const assetsDueForMaintenance = useMemo(() => assets.filter(a => new Date(a.nextMaintenance) <= new Date()).length, [assets])
  const complianceOverdue = useMemo(() => compliance.filter(c => c.status === "overdue").length, [compliance])
  const lowStockItems = useMemo(() => inventory.filter(i => i.stock <= i.reorderLevel).length, [inventory])
  const staffOnDuty = useMemo(() => staff.filter(s => s.status === "on-duty").length, [staff])
  const totalElectricity = useMemo(() => energyReadings.reduce((sum, r) => sum + r.electricityKwh, 0), [energyReadings])
  const totalWater = useMemo(() => energyReadings.reduce((sum, r) => sum + r.waterM3, 0), [energyReadings])

  // ==========================================
  // FILTERS
  // ==========================================

  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrders
    if (selectedPriority !== "all") filtered = filtered.filter(wo => wo.priority === selectedPriority)
    if (selectedStatus !== "all") filtered = filtered.filter(wo => wo.status === selectedStatus)
    if (searchQuery) filtered = filtered.filter(wo => wo.title.toLowerCase().includes(searchQuery.toLowerCase()) || wo.woNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    return filtered
  }, [workOrders, selectedPriority, selectedStatus, searchQuery])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreateWorkOrder = () => {
    if (!newWorkOrder.title || !newWorkOrder.description || !newWorkOrder.location) {
      alert("Please fill in all required fields")
      return
    }
    const woCount = workOrders.length + 1
    const woNumber = `WO-${new Date().getFullYear()}-${woCount.toString().padStart(3, '0')}`
    const workOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      woNumber,
      title: newWorkOrder.title,
      description: newWorkOrder.description,
      type: newWorkOrder.type,
      priority: newWorkOrder.priority,
      status: "open",
      location: newWorkOrder.location,
      reportedBy: newWorkOrder.reportedBy || "Current User",
      reportedAt: new Date().toISOString(),
      estimatedHours: newWorkOrder.estimatedHours,
      guestComplaint: newWorkOrder.guestComplaint,
      guestName: newWorkOrder.guestName || undefined,
      roomNumber: newWorkOrder.roomNumber || undefined,
      assetId: newWorkOrder.assetId || undefined
    }
    setWorkOrders([workOrder, ...workOrders])
    setNewWorkOrder({
      title: "", description: "", type: "corrective", priority: "medium", location: "", assetId: "", reportedBy: "",
      guestComplaint: false, guestName: "", roomNumber: "", estimatedHours: 1
    })
    setIsNewWorkOrderOpen(false)
  }

  const handleGenerateReport = () => {
    alert(`Generating ${reportType} report for ${format(reportDate, 'PPP')} in ${reportFormat.toUpperCase()} format`)
    setIsReportsModalOpen(false)
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(251,146,60,0.2)]"
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case "open": return "bg-slate-500/20 text-[#8E939D]"
      case "assigned": return "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30"
      case "in-progress": return "bg-amber-500/20 text-amber-400"
      case "pending-parts": return "bg-purple-500/20 text-purple-400"
      case "resolved": return "bg-emerald-500/20 text-emerald-400"
      case "closed": return "bg-slate-500/20 text-[#8E939D]"
      case "cancelled": return "bg-red-500/20 text-red-400"
    }
  }

  const getPMStatusColor = (status: PreventiveMaintenance["status"]) => {
    switch (status) {
      case "scheduled": return "bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30"
      case "overdue": return "bg-red-500/20 text-red-400"
      case "completed": return "bg-emerald-500/20 text-emerald-400"
      case "skipped": return "bg-slate-500/20 text-[#8E939D]"
    }
  }

  const getAssetCriticalityColor = (crit: AssetCriticality) => {
    switch (crit) {
      case "A": return "bg-red-500/20 text-red-400"
      case "B": return "bg-orange-500/20 text-orange-400"
      case "C": return "bg-amber-500/20 text-amber-400"
      case "D": return "bg-blue-500/20 text-blue-400"
    }
  }

  if (isLoading || configLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64 bg-[#00f2ff]/5" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full bg-[#00f2ff]/5" />)}
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
            <Wrench className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            ENGINEERING & FACILITIES <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> MAINTENANCE
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
            {assets.length} ASSETS · {openWorkOrders} OPEN WORK ORDERS · {staffOnDuty} STAFF ON DUTY
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
                <BarChart3 className="mr-1 h-3 w-3" />
                REPORTS
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-md">
              <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> GENERATE ENGINEERING REPORT
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">REPORT TYPE</Label>
                  <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                    <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                      <SelectItem value="daily" className="text-[9px] font-bold uppercase">DAILY</SelectItem>
                      <SelectItem value="weekly" className="text-[9px] font-bold uppercase">WEEKLY</SelectItem>
                      <SelectItem value="monthly" className="text-[9px] font-bold uppercase">MONTHLY</SelectItem>
                      <SelectItem value="quarterly" className="text-[9px] font-bold uppercase">QUARTERLY</SelectItem>
                      <SelectItem value="annual" className="text-[9px] font-bold uppercase">ANNUAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DATE</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {reportDate ? format(reportDate, "PPP") : "SELECT DATE"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0a0c10] border-[#00f2ff]/20">
                      <CalendarComponent mode="single" selected={reportDate} onSelect={(date) => date && setReportDate(date)} className="rounded-md" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">FORMAT</Label>
                  <Select value={reportFormat} onValueChange={(v: any) => setReportFormat(v)}>
                    <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                      <SelectItem value="pdf" className="text-[9px] font-bold uppercase">PDF</SelectItem>
                      <SelectItem value="excel" className="text-[9px] font-bold uppercase">EXCEL</SelectItem>
                      <SelectItem value="csv" className="text-[9px] font-bold uppercase">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button variant="outline" className="flex-1 border-[#00f2ff]/20 text-slate-300 hover:bg-[#00f2ff]/10 text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsReportsModalOpen(false)}>CANCEL</Button>
                <Button className="flex-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40" onClick={handleGenerateReport}><Download className="mr-1 h-3 w-3" /> GENERATE</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewWorkOrderOpen} onOpenChange={setIsNewWorkOrderOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                <Plus className="mr-1 h-3 w-3" />
                NEW WORK ORDER
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <Wrench className="h-5 w-5" /> CREATE NEW WORK ORDER
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">TITLE *</Label>
                  <Input placeholder="BRIEF DESCRIPTION" value={newWorkOrder.title} onChange={(e) => setNewWorkOrder({...newWorkOrder, title: e.target.value})} className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">DESCRIPTION *</Label>
                  <Textarea placeholder="DETAILED DESCRIPTION" value={newWorkOrder.description} onChange={(e) => setNewWorkOrder({...newWorkOrder, description: e.target.value})} className="bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[8px] font-bold uppercase tracking-widest placeholder:text-[7px] min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">TYPE</Label>
                    <Select value={newWorkOrder.type} onValueChange={(v: any) => setNewWorkOrder({...newWorkOrder, type: v})}>
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        <SelectItem value="corrective" className="text-[9px] font-bold uppercase">CORRECTIVE</SelectItem>
                        <SelectItem value="preventive" className="text-[9px] font-bold uppercase">PREVENTIVE</SelectItem>
                        <SelectItem value="emergency" className="text-red-400 text-[9px] font-bold uppercase">EMERGENCY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">PRIORITY</Label>
                    <Select value={newWorkOrder.priority} onValueChange={(v: any) => setNewWorkOrder({...newWorkOrder, priority: v})}>
                      <SelectTrigger className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                        <SelectItem value="critical" className="text-red-400 text-[9px] font-bold uppercase">CRITICAL</SelectItem>
                        <SelectItem value="high" className="text-orange-400 text-[9px] font-bold uppercase">HIGH</SelectItem>
                        <SelectItem value="medium" className="text-amber-400 text-[9px] font-bold uppercase">MEDIUM</SelectItem>
                        <SelectItem value="low" className="text-blue-400 text-[9px] font-bold uppercase">LOW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">LOCATION *</Label>
                  <Input placeholder="E.G., ROOM 1205, LOBBY" value={newWorkOrder.location} onChange={(e) => setNewWorkOrder({...newWorkOrder, location: e.target.value})} className="h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="guestComplaint" checked={newWorkOrder.guestComplaint} onCheckedChange={(checked) => setNewWorkOrder({...newWorkOrder, guestComplaint: checked as boolean})} className="border-[#00f2ff]/30 data-[state=checked]:bg-[#00f2ff]" />
                  <Label htmlFor="guestComplaint" className="text-[9px] font-bold uppercase tracking-widest text-slate-300">GUEST COMPLAINT</Label>
                </div>
                {newWorkOrder.guestComplaint && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div className="space-y-1"><Label className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">GUEST NAME</Label><Input placeholder="NAME" value={newWorkOrder.guestName} onChange={(e) => setNewWorkOrder({...newWorkOrder, guestName: e.target.value})} className="h-7 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[8px] font-bold uppercase" /></div>
                    <div className="space-y-1"><Label className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">ROOM NUMBER</Label><Input placeholder="ROOM" value={newWorkOrder.roomNumber} onChange={(e) => setNewWorkOrder({...newWorkOrder, roomNumber: e.target.value})} className="h-7 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[8px] font-bold uppercase" /></div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button variant="outline" className="flex-1 border-[#00f2ff]/20 text-slate-300 hover:bg-[#00f2ff]/10 text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsNewWorkOrderOpen(false)}>CANCEL</Button>
                <Button className="flex-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/40" onClick={handleCreateWorkOrder}><Save className="mr-1 h-3 w-3" /> CREATE</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1️⃣ Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "OPEN WOs", val: openWorkOrders, color: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" },
          { label: "CRITICAL", val: criticalWorkOrders, color: "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
          { label: "OVERDUE PM", val: overduePM, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
          { label: "UPCOMING PM", val: upcomingPM, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" },
          { label: "ASSETS DUE", val: assetsDueForMaintenance, color: "text-amber-400" },
          { label: "COMPLIANCE", val: complianceOverdue, color: "text-red-400" },
          { label: "LOW STOCK", val: lowStockItems, color: "text-amber-400" },
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

      {/* 2️⃣ Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1 flex-wrap">
          <TabsTrigger value="overview" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">OVERVIEW</TabsTrigger>
          <TabsTrigger value="workorders" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">WORK ORDERS</TabsTrigger>
          <TabsTrigger value="preventive" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">PREVENTIVE</TabsTrigger>
          <TabsTrigger value="assets" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">ASSETS</TabsTrigger>
          <TabsTrigger value="energy" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">ENERGY</TabsTrigger>
          <TabsTrigger value="inventory" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">INVENTORY</TabsTrigger>
          <TabsTrigger value="compliance" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">COMPLIANCE</TabsTrigger>
          <TabsTrigger value="staff" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">STAFF</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 lg:col-span-2 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">RECENT WORK ORDERS</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {workOrders.slice(0, 5).map(wo => (
                  <div key={wo.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 cursor-pointer hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group" onClick={() => { setSelectedWorkOrder(wo); setIsWorkOrderDetailOpen(true); }}>
                    <div className={`p-1.5 rounded-lg ${getPriorityColor(wo.priority)}`}>
                      {wo.priority === "critical" ? <AlertTriangle className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="font-bold text-[9px] text-[#8E939D]">{wo.woNumber}</span><Badge className={`${getStatusColor(wo.status)} text-[6px] tracking-widest uppercase border-0`}>{wo.status}</Badge></div>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#8E939D]">{wo.title}</p>
                      <p className="text-[6px] text-[#5C6270] mt-0.5">{wo.location}</p>
                    </div>
                    <div className="text-right text-[7px] font-bold uppercase tracking-widest text-slate-300">{wo.assignedTo || "UNASSIGNED"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">ENERGY & ALERTS</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15"><p className="text-[7px] text-[#5C6270]">ELECTRICITY (7-DAY)</p><p className="text-sm font-bold text-emerald-400">{(totalElectricity/1000).toFixed(1)}K kWh</p><div className="flex items-center gap-1 text-[6px] text-emerald-400"><ArrowUpRight className="h-2 w-2" />+2.3% VS LAST WEEK</div></div>
                <div className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15"><p className="text-[7px] text-[#5C6270]">WATER (7-DAY)</p><p className="text-sm font-bold text-blue-400">{totalWater} M³</p></div>
                <div className="space-y-1 mt-1"><p className="text-[7px] font-bold text-slate-300">CRITICAL ALERTS</p><div className="p-1.5 rounded bg-red-950/20 border border-red-500/30 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-400" /><span className="text-[6px] text-red-400">BOILER #1 OVERDUE MAINTENANCE</span></div></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">STAFF ON DUTY</CardTitle></CardHeader>
              <CardContent className="pt-3 flex flex-wrap gap-2">
                {staff.filter(s => s.status === "on-duty").map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15"><Avatar className="h-6 w-6"><AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[8px] font-bold">{s.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar><div><p className="text-[8px] font-bold text-[#8E939D]">{s.name}</p><p className="text-[6px] text-[#5C6270] uppercase">{s.role}</p></div></div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">UPCOMING PM (7 DAYS)</CardTitle></CardHeader>
              <CardContent className="pt-3 space-y-1">
                {preventiveMaintenance.filter(pm => pm.status === "scheduled" && new Date(pm.nextDue) <= new Date(Date.now() + 7*86400000)).map(pm => (
                  <div key={pm.id} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15"><div><p className="text-[8px] font-bold text-[#8E939D]">{pm.title}</p><p className="text-[6px] text-[#5C6270]">DUE: {pm.nextDue}</p></div><Badge className={`${getPMStatusColor(pm.status)} text-[6px] tracking-widest`}>{pm.frequency}</Badge></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" /><Input placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]" /></div>
            <Select value={selectedPriority} onValueChange={(v: any) => setSelectedPriority(v)}><SelectTrigger className="w-[120px] h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase"><SelectValue placeholder="PRIORITY" /></SelectTrigger><SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20"><SelectItem value="all" className="text-[9px] font-bold uppercase">ALL</SelectItem><SelectItem value="critical" className="text-red-400">CRITICAL</SelectItem><SelectItem value="high" className="text-orange-400">HIGH</SelectItem><SelectItem value="medium" className="text-amber-400">MEDIUM</SelectItem><SelectItem value="low" className="text-blue-400">LOW</SelectItem></SelectContent></Select>
            <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}><SelectTrigger className="w-[120px] h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[9px] font-bold uppercase"><SelectValue placeholder="STATUS" /></SelectTrigger><SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20"><SelectItem value="all">ALL</SelectItem><SelectItem value="open">OPEN</SelectItem><SelectItem value="assigned">ASSIGNED</SelectItem><SelectItem value="in-progress">IN PROGRESS</SelectItem><SelectItem value="pending-parts">PENDING PARTS</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2">
            {filteredWorkOrders.map(wo => (
              <div key={wo.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 cursor-pointer hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group" onClick={() => { setSelectedWorkOrder(wo); setIsWorkOrderDetailOpen(true); }}>
                <div className={`p-2 rounded-lg ${getPriorityColor(wo.priority)}`}>{wo.priority === "critical" ? <AlertTriangle className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}</div>
                <div className="flex-1"><div className="flex items-center gap-2"><span className="font-bold text-[10px] text-[#8E939D]">{wo.woNumber}</span><Badge className={`${getStatusColor(wo.status)} text-[7px] tracking-widest uppercase border-0`}>{wo.status}</Badge>{wo.guestComplaint && <Badge className="bg-red-600/20 text-red-400 text-[6px]">GUEST</Badge>}</div><p className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">{wo.title}</p><div className="flex items-center gap-2 mt-0.5 text-[7px] text-[#5C6270]"><span>{wo.location}</span><span>•</span><span>REPORTED: {new Date(wo.reportedAt).toLocaleDateString()}</span>{wo.assignedTo && <><span>•</span><span>ASSIGNED: {wo.assignedTo}</span></>}</div></div>
                <div className="text-right"><div className="text-[9px] font-bold text-slate-300">{wo.estimatedHours}H EST.</div>{wo.cost && <div className="text-[7px] text-[#5C6270]">${wo.cost}</div>}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Work Order Detail Dialog */}
        <Dialog open={isWorkOrderDetailOpen} onOpenChange={setIsWorkOrderDetailOpen}>
          <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.1)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
            <DialogHeader className="border-b border-[#00f2ff]/20 pb-3">
              <DialogTitle className="text-lg font-bold uppercase tracking-widest text-[#00f2ff]">WORK ORDER DETAILS</DialogTitle>
            </DialogHeader>
            {selectedWorkOrder && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between"><div><p className="text-[8px] text-[#5C6270]">#{selectedWorkOrder.woNumber}</p><h3 className="text-base font-bold text-[#8E939D]">{selectedWorkOrder.title}</h3></div><Badge className={`${getPriorityColor(selectedWorkOrder.priority)} text-[8px] tracking-widest uppercase`}>{selectedWorkOrder.priority}</Badge></div>
                <p className="text-[9px] text-slate-300">{selectedWorkOrder.description}</p>
                <div className="grid grid-cols-2 gap-3 text-[8px] font-bold uppercase tracking-widest"><div><span className="text-[#5C6270]">LOCATION</span><p className="text-slate-300">{selectedWorkOrder.location}</p></div><div><span className="text-[#5C6270]">REPORTED</span><p className="text-slate-300">{new Date(selectedWorkOrder.reportedAt).toLocaleString()}</p></div><div><span className="text-[#5C6270]">ASSIGNED TO</span><p className="text-slate-300">{selectedWorkOrder.assignedTo || "UNASSIGNED"}</p></div><div><span className="text-[#5C6270]">STATUS</span><p className={`capitalize ${getStatusColor(selectedWorkOrder.status)}`}>{selectedWorkOrder.status}</p></div></div>
                <div className="flex gap-3 pt-4"><Button variant="outline" className="border-[#00f2ff]/20 text-slate-300 text-[9px] font-bold uppercase tracking-widest">ASSIGN</Button><Button variant="outline" className="border-[#00f2ff]/20 text-slate-300 text-[9px] font-bold uppercase tracking-widest">UPDATE STATUS</Button></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15"><CardContent className="p-2"><div className="flex items-center gap-2"><Clock className="h-3 w-3 text-emerald-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">AVG RESPONSE</span><span className="text-[9px] font-bold text-[#8E939D] ml-auto">14 MIN</span></div></CardContent></Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15"><CardContent className="p-2"><div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00f2ff]" /><span className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">COMPLETION RATE</span><span className="text-[9px] font-bold text-[#8E939D] ml-auto">87%</span></div></CardContent></Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15"><CardContent className="p-2"><div className="flex items-center gap-2"><Users className="h-3 w-3 text-amber-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">STAFF UTILIZATION</span><span className="text-[9px] font-bold text-[#8E939D] ml-auto">76%</span></div></CardContent></Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15"><CardContent className="p-2"><div className="flex items-center gap-2"><DollarSign className="h-3 w-3 text-purple-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">MTD COST</span><span className="text-[9px] font-bold text-[#8E939D] ml-auto">$24.5K</span></div></CardContent></Card>
      </div>
    </div>
  )
}