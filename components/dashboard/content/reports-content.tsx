"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, PieChart, LineChart, TrendingUp, TrendingDown,
  Download, Printer, Mail, Calendar, Clock, Filter,
  Search, Eye, EyeOff, Share2, Star, Award,
  DollarSign, Users, BedDouble, Coffee, Wine,
  Wrench, Shield, Heart, Dumbbell, Utensils,
  ChefHat, Sparkles, MessageSquare, FileText,
  FileSpreadsheet, FilePieChart, FileLineChart,
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  CheckCircle2, AlertTriangle, Info, X,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
  Settings, RefreshCw, Home, Building2,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { useHotelConfig } from "@/hooks/use-hotel-config"
import { Skeleton } from "@/components/ui/skeleton"

// ==========================================
// TYPES
// ==========================================

type DateRange = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "this-quarter" | "last-quarter" | "this-year" | "last-year" | "custom"
type ReportType = "flash" | "revenue" | "operations" | "financial" | "hr" | "sales" | "engineering" | "fandb" | "rooms" | "spa" | "gym" | "channel" | "saved"
type ExportFormat = "pdf" | "excel" | "csv" | "email"
type ChartType = "line" | "bar" | "pie" | "table" | "gauge"

interface ReportMetric {
  id: string
  name: string
  value: number
  previousValue: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  changePercent: number
  status: "good" | "warning" | "critical"
}

interface ReportSection {
  id: string
  title: string
  metrics: ReportMetric[]
  chartData?: any[]
  chartType?: ChartType
}

interface SavedReport {
  id: string
  name: string
  type: ReportType
  dateRange: DateRange
  createdAt: string
  lastRun?: string
  schedule?: "daily" | "weekly" | "monthly" | "none"
  recipients?: string[]
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState<ReportType>("flash")
  const [dateRange, setDateRange] = useState<DateRange>("this-month")
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all")
  const [compareWith, setCompareWith] = useState<"previous" | "last-year" | "budget">("previous")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf")
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [scheduleRecipients, setScheduleRecipients] = useState("")
  
  // Report data states
  const [flashReport, setFlashReport] = useState<ReportSection[]>([])
  const [revenueReport, setRevenueReport] = useState<ReportSection[]>([])
  const [operationsReport, setOperationsReport] = useState<ReportSection[]>([])
  const [financialReport, setFinancialReport] = useState<ReportSection[]>([])
  const [hrReport, setHRReport] = useState<ReportSection[]>([])
  const [salesReport, setSalesReport] = useState<ReportSection[]>([])
  const [engineeringReport, setEngineeringReport] = useState<ReportSection[]>([])
  const [fandbReport, setFandBReport] = useState<ReportSection[]>([])
  const [roomsReport, setRoomsReport] = useState<ReportSection[]>([])
  const [spaReport, setSpaReport] = useState<ReportSection[]>([])
  const [gymReport, setGymReport] = useState<ReportSection[]>([])
  const [channelReport, setChannelReport] = useState<ReportSection[]>([])
  
  // Saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: "1",
      name: "Daily Flash Report",
      type: "flash",
      dateRange: "today",
      createdAt: "2024-01-01",
      schedule: "daily",
      recipients: ["gm@xylo.com", "finance@xylo.com"]
    },
    {
      id: "2",
      name: "Monthly P&L Statement",
      type: "financial",
      dateRange: "this-month",
      createdAt: "2024-01-01",
      schedule: "monthly",
      recipients: ["gm@xylo.com", "finance@xylo.com", "owners@xylo.com"]
    },
    {
      id: "3",
      name: "Weekly Operations Review",
      type: "operations",
      dateRange: "this-week",
      createdAt: "2024-01-01",
      schedule: "weekly",
      recipients: ["gm@xylo.com", "hod@xylo.com"]
    }
  ])

  const { config, loading: configLoading } = useHotelConfig()

  // ==========================================
  // GENERATE REPORT DATA
  // ==========================================
  
  useEffect(() => {
    setIsLoading(true)
    
    // Simulate API call to generate report data
    setTimeout(() => {
      generateFlashReport()
      generateRevenueReport()
      generateOperationsReport()
      generateFinancialReport()
      generateHRReport()
      generateSalesReport()
      generateEngineeringReport()
      generateFandBReport()
      generateRoomsReport()
      generateSpaReport()
      generateGymReport()
      generateChannelReport()
      
      setIsLoading(false)
    }, 800)
  }, [dateRange, customStartDate, customEndDate, compareWith])

  const generateFlashReport = () => {
    // Flash Report - Top KPIs for GM
    setFlashReport([
      {
        id: "flash-1",
        title: "Hotel Performance Summary",
        metrics: [
          {
            id: "m1",
            name: "Occupancy",
            value: 78.5,
            previousValue: 75.2,
            target: 82,
            unit: "%",
            trend: "up",
            changePercent: 4.4,
            status: "good"
          },
          {
            id: "m2",
            name: "ADR",
            value: 425,
            previousValue: 410,
            target: 440,
            unit: "$",
            trend: "up",
            changePercent: 3.7,
            status: "good"
          },
          {
            id: "m3",
            name: "RevPAR",
            value: 334,
            previousValue: 308,
            target: 360,
            unit: "$",
            trend: "up",
            changePercent: 8.4,
            status: "good"
          },
          {
            id: "m4",
            name: "Total Revenue",
            value: 291100,
            previousValue: 275000,
            target: 300000,
            unit: "$",
            trend: "up",
            changePercent: 5.9,
            status: "good"
          },
          {
            id: "m5",
            name: "F&B Revenue",
            value: 108900,
            previousValue: 102000,
            target: 115000,
            unit: "$",
            trend: "up",
            changePercent: 6.8,
            status: "good"
          },
          {
            id: "m6",
            name: "GOP Margin",
            value: 38.2,
            previousValue: 37.5,
            target: 40,
            unit: "%",
            trend: "up",
            changePercent: 1.9,
            status: "good"
          }
        ]
      },
      {
        id: "flash-2",
        title: "Guest Satisfaction",
        metrics: [
          {
            id: "m7",
            name: "GSS Score",
            value: 92.5,
            previousValue: 91.8,
            target: 95,
            unit: "%",
            trend: "up",
            changePercent: 0.8,
            status: "good"
          },
          {
            id: "m8",
            name: "Review Rating",
            value: 4.7,
            previousValue: 4.6,
            target: 4.8,
            unit: "/5",
            trend: "up",
            changePercent: 2.2,
            status: "good"
          },
          {
            id: "m9",
            name: "Complaints",
            value: 3,
            previousValue: 5,
            target: 2,
            unit: "count",
            trend: "down",
            changePercent: -40,
            status: "good"
          }
        ]
      },
      {
        id: "flash-3",
        title: "Operational Alerts",
        metrics: [
          {
            id: "m10",
            name: "Maintenance Backlog",
            value: 12,
            previousValue: 15,
            target: 10,
            unit: "tickets",
            trend: "down",
            changePercent: -20,
            status: "warning"
          },
          {
            id: "m11",
            name: "Open Positions",
            value: 8,
            previousValue: 10,
            target: 5,
            unit: "count",
            trend: "down",
            changePercent: -20,
            status: "warning"
          },
          {
            id: "m12",
            name: "Staff Turnover",
            value: 18.5,
            previousValue: 22,
            target: 20,
            unit: "%",
            trend: "down",
            changePercent: -15.9,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateRevenueReport = () => {
    setRevenueReport([
      {
        id: "rev-1",
        title: "Revenue by Department",
        metrics: [
          {
            id: "r1",
            name: "Rooms Revenue",
            value: 165750,
            previousValue: 158000,
            target: 170000,
            unit: "$",
            trend: "up",
            changePercent: 4.9,
            status: "good"
          },
          {
            id: "r2",
            name: "F&B Revenue",
            value: 108900,
            previousValue: 102000,
            target: 115000,
            unit: "$",
            trend: "up",
            changePercent: 6.8,
            status: "good"
          },
          {
            id: "r3",
            name: "Spa Revenue",
            value: 8450,
            previousValue: 7800,
            target: 9000,
            unit: "$",
            trend: "up",
            changePercent: 8.3,
            status: "good"
          },
          {
            id: "r4",
            name: "Other Revenue",
            value: 8000,
            previousValue: 7200,
            target: 8500,
            unit: "$",
            trend: "up",
            changePercent: 11.1,
            status: "good"
          }
        ],
        chartType: "bar"
      },
      {
        id: "rev-2",
        title: "Revenue by Segment",
        metrics: [
          {
            id: "r5",
            name: "Corporate",
            value: 82450,
            previousValue: 78000,
            target: 85000,
            unit: "$",
            trend: "up",
            changePercent: 5.7,
            status: "good"
          },
          {
            id: "r6",
            name: "Leisure",
            value: 87650,
            previousValue: 82000,
            target: 90000,
            unit: "$",
            trend: "up",
            changePercent: 6.9,
            status: "good"
          },
          {
            id: "r7",
            name: "MICE",
            value: 42500,
            previousValue: 40000,
            target: 45000,
            unit: "$",
            trend: "up",
            changePercent: 6.3,
            status: "good"
          },
          {
            id: "r8",
            name: "Contract",
            value: 18500,
            previousValue: 18000,
            target: 20000,
            unit: "$",
            trend: "up",
            changePercent: 2.8,
            status: "warning"
          }
        ],
        chartType: "pie"
      },
      {
        id: "rev-3",
        title: "Channel Mix",
        metrics: [
          {
            id: "r9",
            name: "Direct",
            value: 42,
            previousValue: 40,
            target: 45,
            unit: "%",
            trend: "up",
            changePercent: 5,
            status: "good"
          },
          {
            id: "r10",
            name: "OTA",
            value: 28,
            previousValue: 30,
            target: 25,
            unit: "%",
            trend: "down",
            changePercent: -6.7,
            status: "good"
          },
          {
            id: "r11",
            name: "Corporate",
            value: 18,
            previousValue: 17,
            target: 20,
            unit: "%",
            trend: "up",
            changePercent: 5.9,
            status: "good"
          },
          {
            id: "r12",
            name: "GDS",
            value: 12,
            previousValue: 13,
            target: 10,
            unit: "%",
            trend: "down",
            changePercent: -7.7,
            status: "warning"
          }
        ],
        chartType: "pie"
      }
    ])
  }

  const generateOperationsReport = () => {
    setOperationsReport([
      {
        id: "ops-1",
        title: "Front Office Performance",
        metrics: [
          {
            id: "o1",
            name: "Check-in Time",
            value: 3.5,
            previousValue: 4.2,
            target: 3,
            unit: "min",
            trend: "down",
            changePercent: -16.7,
            status: "good"
          },
          {
            id: "o2",
            name: "Check-out Time",
            value: 2.8,
            previousValue: 3.1,
            target: 2.5,
            unit: "min",
            trend: "down",
            changePercent: -9.7,
            status: "good"
          },
          {
            id: "o3",
            name: "No-show Rate",
            value: 2.8,
            previousValue: 3.2,
            target: 2.5,
            unit: "%",
            trend: "down",
            changePercent: -12.5,
            status: "warning"
          },
          {
            id: "o4",
            name: "Upsell Revenue",
            value: 4250,
            previousValue: 3800,
            target: 5000,
            unit: "$",
            trend: "up",
            changePercent: 11.8,
            status: "good"
          }
        ]
      },
      {
        id: "ops-2",
        title: "Housekeeping Efficiency",
        metrics: [
          {
            id: "o5",
            name: "Cleaning Time",
            value: 24,
            previousValue: 26,
            target: 22,
            unit: "min",
            trend: "down",
            changePercent: -7.7,
            status: "good"
          },
          {
            id: "o6",
            name: "Inspection Pass Rate",
            value: 96.5,
            previousValue: 95.2,
            target: 98,
            unit: "%",
            trend: "up",
            changePercent: 1.4,
            status: "good"
          },
          {
            id: "o7",
            name: "Rooms per Attendant",
            value: 14.2,
            previousValue: 13.8,
            target: 15,
            unit: "rooms",
            trend: "up",
            changePercent: 2.9,
            status: "good"
          },
          {
            id: "o8",
            name: "Reclean %",
            value: 3.2,
            previousValue: 3.5,
            target: 3,
            unit: "%",
            trend: "down",
            changePercent: -8.6,
            status: "good"
          }
        ]
      },
      {
        id: "ops-3",
        title: "Engineering Performance",
        metrics: [
          {
            id: "o9",
            name: "Response Time",
            value: 14,
            previousValue: 16,
            target: 12,
            unit: "min",
            trend: "down",
            changePercent: -12.5,
            status: "good"
          },
          {
            id: "o10",
            name: "PM Completion",
            value: 92,
            previousValue: 88,
            target: 95,
            unit: "%",
            trend: "up",
            changePercent: 4.5,
            status: "good"
          },
          {
            id: "o11",
            name: "Backlog",
            value: 8,
            previousValue: 12,
            target: 5,
            unit: "tickets",
            trend: "down",
            changePercent: -33.3,
            status: "warning"
          }
        ]
      }
    ])
  }

  const generateFinancialReport = () => {
    setFinancialReport([
      {
        id: "fin-1",
        title: "P&L Summary",
        metrics: [
          {
            id: "f1",
            name: "Total Revenue",
            value: 8450000,
            previousValue: 8200000,
            target: 8800000,
            unit: "$",
            trend: "up",
            changePercent: 3,
            status: "good"
          },
          {
            id: "f2",
            name: "Cost of Sales",
            value: 2150000,
            previousValue: 2100000,
            target: 2000000,
            unit: "$",
            trend: "up",
            changePercent: 2.4,
            status: "warning"
          },
          {
            id: "f3",
            name: "Payroll",
            value: 2458000,
            previousValue: 2412000,
            target: 2500000,
            unit: "$",
            trend: "up",
            changePercent: 1.9,
            status: "good"
          },
          {
            id: "f4",
            name: "Operating Expenses",
            value: 1850000,
            previousValue: 1820000,
            target: 1800000,
            unit: "$",
            trend: "up",
            changePercent: 1.6,
            status: "warning"
          },
          {
            id: "f5",
            name: "GOP",
            value: 1992000,
            previousValue: 1868000,
            target: 2500000,
            unit: "$",
            trend: "up",
            changePercent: 6.6,
            status: "good"
          },
          {
            id: "f6",
            name: "GOP Margin",
            value: 23.6,
            previousValue: 22.8,
            target: 28,
            unit: "%",
            trend: "up",
            changePercent: 3.5,
            status: "good"
          }
        ]
      },
      {
        id: "fin-2",
        title: "Payroll Breakdown",
        metrics: [
          {
            id: "f7",
            name: "Rooms Payroll",
            value: 624000,
            previousValue: 610000,
            target: 600000,
            unit: "$",
            trend: "up",
            changePercent: 2.3,
            status: "warning"
          },
          {
            id: "f8",
            name: "F&B Payroll",
            value: 836000,
            previousValue: 820000,
            target: 800000,
            unit: "$",
            trend: "up",
            changePercent: 2,
            status: "warning"
          },
          {
            id: "f9",
            name: "Admin Payroll",
            value: 298000,
            previousValue: 295000,
            target: 300000,
            unit: "$",
            trend: "up",
            changePercent: 1,
            status: "good"
          }
        ]
      },
      {
        id: "fin-3",
        title: "Accounts Receivable",
        metrics: [
          {
            id: "f10",
            name: "Current",
            value: 1250000,
            previousValue: 1200000,
            target: 1300000,
            unit: "$",
            trend: "up",
            changePercent: 4.2,
            status: "good"
          },
          {
            id: "f11",
            name: "30 Days",
            value: 425000,
            previousValue: 400000,
            target: 350000,
            unit: "$",
            trend: "up",
            changePercent: 6.3,
            status: "critical"
          },
          {
            id: "f12",
            name: "60+ Days",
            value: 185000,
            previousValue: 170000,
            target: 100000,
            unit: "$",
            trend: "up",
            changePercent: 8.8,
            status: "critical"
          }
        ]
      }
    ])
  }

  const generateHRReport = () => {
    setHRReport([
      {
        id: "hr-1",
        title: "Workforce Overview",
        metrics: [
          {
            id: "h1",
            name: "Total Headcount",
            value: 687,
            previousValue: 675,
            target: 712,
            unit: "employees",
            trend: "up",
            changePercent: 1.8,
            status: "good"
          },
          {
            id: "h2",
            name: "Active Employees",
            value: 645,
            previousValue: 640,
            target: 680,
            unit: "employees",
            trend: "up",
            changePercent: 0.8,
            status: "good"
          },
          {
            id: "h3",
            name: "Turnover Rate",
            value: 18.5,
            previousValue: 22,
            target: 20,
            unit: "%",
            trend: "down",
            changePercent: -15.9,
            status: "good"
          },
          {
            id: "h4",
            name: "Open Positions",
            value: 28,
            previousValue: 35,
            target: 15,
            unit: "positions",
            trend: "down",
            changePercent: -20,
            status: "warning"
          }
        ]
      },
      {
        id: "hr-2",
        title: "Recruitment",
        metrics: [
          {
            id: "h5",
            name: "Applications",
            value: 156,
            previousValue: 142,
            target: 180,
            unit: "count",
            trend: "up",
            changePercent: 9.9,
            status: "good"
          },
          {
            id: "h6",
            name: "Time-to-Hire",
            value: 24,
            previousValue: 28,
            target: 21,
            unit: "days",
            trend: "down",
            changePercent: -14.3,
            status: "good"
          },
          {
            id: "h7",
            name: "Cost-per-Hire",
            value: 2850,
            previousValue: 2950,
            target: 2500,
            unit: "$",
            trend: "down",
            changePercent: -3.4,
            status: "warning"
          }
        ]
      },
      {
        id: "hr-3",
        title: "Training & Development",
        metrics: [
          {
            id: "h8",
            name: "Training Hours",
            value: 2450,
            previousValue: 2100,
            target: 3000,
            unit: "hours",
            trend: "up",
            changePercent: 16.7,
            status: "good"
          },
          {
            id: "h9",
            name: "Completion Rate",
            value: 87,
            previousValue: 82,
            target: 90,
            unit: "%",
            trend: "up",
            changePercent: 6.1,
            status: "good"
          },
          {
            id: "h10",
            name: "Certifications",
            value: 436,
            previousValue: 410,
            target: 500,
            unit: "count",
            trend: "up",
            changePercent: 6.3,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateSalesReport = () => {
    setSalesReport([
      {
        id: "s1",
        title: "Sales Pipeline",
        metrics: [
          {
            id: "s1-1",
            name: "Leads",
            value: 38,
            previousValue: 35,
            target: 50,
            unit: "count",
            trend: "up",
            changePercent: 8.6,
            status: "good"
          },
          {
            id: "s1-2",
            name: "Proposals",
            value: 15,
            previousValue: 14,
            target: 20,
            unit: "count",
            trend: "up",
            changePercent: 7.1,
            status: "good"
          },
          {
            id: "s1-3",
            name: "Negotiations",
            value: 8,
            previousValue: 7,
            target: 10,
            unit: "count",
            trend: "up",
            changePercent: 14.3,
            status: "good"
          },
          {
            id: "s1-4",
            name: "Won",
            value: 4,
            previousValue: 3,
            target: 6,
            unit: "count",
            trend: "up",
            changePercent: 33.3,
            status: "good"
          }
        ]
      },
      {
        id: "s2",
        title: "Account Performance",
        metrics: [
          {
            id: "s2-1",
            name: "Active Accounts",
            value: 245,
            previousValue: 238,
            target: 260,
            unit: "count",
            trend: "up",
            changePercent: 2.9,
            status: "good"
          },
          {
            id: "s2-2",
            name: "Revenue per Account",
            value: 1850,
            previousValue: 1750,
            target: 2000,
            unit: "$",
            trend: "up",
            changePercent: 5.7,
            status: "good"
          },
          {
            id: "s2-3",
            name: "Retention Rate",
            value: 92,
            previousValue: 90,
            target: 95,
            unit: "%",
            trend: "up",
            changePercent: 2.2,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateEngineeringReport = () => {
    setEngineeringReport([
      {
        id: "e1",
        title: "Work Order Summary",
        metrics: [
          {
            id: "e1-1",
            name: "Open Orders",
            value: 12,
            previousValue: 15,
            target: 10,
            unit: "count",
            trend: "down",
            changePercent: -20,
            status: "warning"
          },
          {
            id: "e1-2",
            name: "Critical Issues",
            value: 2,
            previousValue: 3,
            target: 1,
            unit: "count",
            trend: "down",
            changePercent: -33.3,
            status: "warning"
          },
          {
            id: "e1-3",
            name: "Avg Response",
            value: 14,
            previousValue: 16,
            target: 12,
            unit: "min",
            trend: "down",
            changePercent: -12.5,
            status: "good"
          },
          {
            id: "e1-4",
            name: "PM Completion",
            value: 92,
            previousValue: 88,
            target: 95,
            unit: "%",
            trend: "up",
            changePercent: 4.5,
            status: "good"
          }
        ]
      },
      {
        id: "e2",
        title: "Energy Consumption",
        metrics: [
          {
            id: "e2-1",
            name: "Electricity",
            value: 12450,
            previousValue: 12100,
            target: 11500,
            unit: "kWh",
            trend: "up",
            changePercent: 2.9,
            status: "critical"
          },
          {
            id: "e2-2",
            name: "Water",
            value: 185,
            previousValue: 175,
            target: 160,
            unit: "m³",
            trend: "up",
            changePercent: 5.7,
            status: "critical"
          },
          {
            id: "e2-3",
            name: "Gas",
            value: 450,
            previousValue: 430,
            target: 400,
            unit: "m³",
            trend: "up",
            changePercent: 4.7,
            status: "critical"
          }
        ]
      }
    ])
  }

  const generateFandBReport = () => {
    setFandBReport([
      {
        id: "fb1",
        title: "F&B Performance",
        metrics: [
          {
            id: "fb1-1",
            name: "Total Revenue",
            value: 108900,
            previousValue: 102000,
            target: 115000,
            unit: "$",
            trend: "up",
            changePercent: 6.8,
            status: "good"
          },
          {
            id: "fb1-2",
            name: "Total Covers",
            value: 625,
            previousValue: 590,
            target: 650,
            unit: "covers",
            trend: "up",
            changePercent: 5.9,
            status: "good"
          },
          {
            id: "fb1-3",
            name: "Avg Check",
            value: 174,
            previousValue: 173,
            target: 180,
            unit: "$",
            trend: "up",
            changePercent: 0.6,
            status: "good"
          },
          {
            id: "fb1-4",
            name: "Food Cost %",
            value: 30.5,
            previousValue: 31.2,
            target: 29,
            unit: "%",
            trend: "down",
            changePercent: -2.2,
            status: "warning"
          }
        ]
      },
      {
        id: "fb2",
        title: "Outlet Performance",
        metrics: [
          {
            id: "fb2-1",
            name: "Main Restaurant",
            value: 42500,
            previousValue: 40000,
            target: 45000,
            unit: "$",
            trend: "up",
            changePercent: 6.3,
            status: "good"
          },
          {
            id: "fb2-2",
            name: "Italian Restaurant",
            value: 38200,
            previousValue: 36000,
            target: 40000,
            unit: "$",
            trend: "up",
            changePercent: 6.1,
            status: "good"
          },
          {
            id: "fb2-3",
            name: "Lobby Bar",
            value: 15800,
            previousValue: 15000,
            target: 17000,
            unit: "$",
            trend: "up",
            changePercent: 5.3,
            status: "good"
          },
          {
            id: "fb2-4",
            name: "Banquet",
            value: 12400,
            previousValue: 11000,
            target: 13000,
            unit: "$",
            trend: "up",
            changePercent: 12.7,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateRoomsReport = () => {
    setRoomsReport([
      {
        id: "rm1",
        title: "Rooms Performance",
        metrics: [
          {
            id: "rm1-1",
            name: "Occupancy",
            value: 78.5,
            previousValue: 75.2,
            target: 82,
            unit: "%",
            trend: "up",
            changePercent: 4.4,
            status: "good"
          },
          {
            id: "rm1-2",
            name: "ADR",
            value: 425,
            previousValue: 410,
            target: 440,
            unit: "$",
            trend: "up",
            changePercent: 3.7,
            status: "good"
          },
          {
            id: "rm1-3",
            name: "RevPAR",
            value: 334,
            previousValue: 308,
            target: 360,
            unit: "$",
            trend: "up",
            changePercent: 8.4,
            status: "good"
          },
          {
            id: "rm1-4",
            name: "Room Revenue",
            value: 165750,
            previousValue: 158000,
            target: 170000,
            unit: "$",
            trend: "up",
            changePercent: 4.9,
            status: "good"
          }
        ]
      },
      {
        id: "rm2",
        title: "Booking Statistics",
        metrics: [
          {
            id: "rm2-1",
            name: "No-show Rate",
            value: 2.8,
            previousValue: 3.2,
            target: 2.5,
            unit: "%",
            trend: "down",
            changePercent: -12.5,
            status: "warning"
          },
          {
            id: "rm2-2",
            name: "Cancellation Rate",
            value: 4.2,
            previousValue: 4.5,
            target: 4,
            unit: "%",
            trend: "down",
            changePercent: -6.7,
            status: "warning"
          },
          {
            id: "rm2-3",
            name: "Direct Bookings",
            value: 42,
            previousValue: 40,
            target: 45,
            unit: "%",
            trend: "up",
            changePercent: 5,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateSpaReport = () => {
    setSpaReport([
      {
        id: "sp1",
        title: "Spa Performance",
        metrics: [
          {
            id: "sp1-1",
            name: "Treatments",
            value: 42,
            previousValue: 38,
            target: 45,
            unit: "count",
            trend: "up",
            changePercent: 10.5,
            status: "good"
          },
          {
            id: "sp1-2",
            name: "Revenue",
            value: 8450,
            previousValue: 7800,
            target: 9000,
            unit: "$",
            trend: "up",
            changePercent: 8.3,
            status: "good"
          },
          {
            id: "sp1-3",
            name: "Avg Treatment Value",
            value: 201,
            previousValue: 205,
            target: 220,
            unit: "$",
            trend: "down",
            changePercent: -2,
            status: "warning"
          },
          {
            id: "sp1-4",
            name: "Therapist Utilization",
            value: 78,
            previousValue: 75,
            target: 80,
            unit: "%",
            trend: "up",
            changePercent: 4,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateGymReport = () => {
    setGymReport([
      {
        id: "gy1",
        title: "Gym Performance",
        metrics: [
          {
            id: "gy1-1",
            name: "Daily Check-ins",
            value: 85,
            previousValue: 78,
            target: 100,
            unit: "count",
            trend: "up",
            changePercent: 9,
            status: "good"
          },
          {
            id: "gy1-2",
            name: "Class Attendance",
            value: 42,
            previousValue: 38,
            target: 50,
            unit: "count",
            trend: "up",
            changePercent: 10.5,
            status: "good"
          },
          {
            id: "gy1-3",
            name: "PT Sessions",
            value: 12,
            previousValue: 10,
            target: 15,
            unit: "count",
            trend: "up",
            changePercent: 20,
            status: "good"
          },
          {
            id: "gy1-4",
            name: "Equipment Utilization",
            value: 72,
            previousValue: 68,
            target: 75,
            unit: "%",
            trend: "up",
            changePercent: 5.9,
            status: "good"
          }
        ]
      }
    ])
  }

  const generateChannelReport = () => {
    setChannelReport([
      {
        id: "ch1",
        title: "Communication Activity",
        metrics: [
          {
            id: "ch1-1",
            name: "Messages Sent",
            value: 245,
            previousValue: 220,
            target: 300,
            unit: "count",
            trend: "up",
            changePercent: 11.4,
            status: "good"
          },
          {
            id: "ch1-2",
            name: "Read Rate",
            value: 94,
            previousValue: 92,
            target: 95,
            unit: "%",
            trend: "up",
            changePercent: 2.2,
            status: "good"
          },
          {
            id: "ch1-3",
            name: "Avg Response Time",
            value: 12,
            previousValue: 14,
            target: 10,
            unit: "min",
            trend: "down",
            changePercent: -14.3,
            status: "good"
          },
          {
            id: "ch1-4",
            name: "Active Users",
            value: 124,
            previousValue: 118,
            target: 150,
            unit: "count",
            trend: "up",
            changePercent: 5.1,
            status: "good"
          }
        ]
      }
    ])
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "today": return "Today"
      case "yesterday": return "Yesterday"
      case "this-week": return "This Week"
      case "last-week": return "Last Week"
      case "this-month": return "This Month"
      case "last-month": return "Last Month"
      case "this-quarter": return "This Quarter"
      case "last-quarter": return "Last Quarter"
      case "this-year": return "This Year"
      case "last-year": return "Last Year"
      case "custom": return `${customStartDate ? format(customStartDate, "MMM d, yyyy") : ""} - ${customEndDate ? format(customEndDate, "MMM d, yyyy") : ""}`
      default: return "Select Range"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "text-emerald-400"
      case "warning": return "text-amber-400"
      case "critical": return "text-red-400"
      default: return "text-[#8E939D]"
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-400" />
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-[#8E939D]" />
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === "$") return `$${value.toLocaleString()}`
    if (unit === "%") return `${value}%`
    return value.toLocaleString()
  }

  const handleExportReport = () => {
    setIsExportDialogOpen(false)
    // In real app, trigger download
    alert(`Exporting ${activeTab} report as ${exportFormat.toUpperCase()}`)
  }

  const handleScheduleReport = () => {
    setIsScheduleDialogOpen(false)
    // In real app, save schedule
    alert(`Report scheduled ${scheduleFrequency} to ${scheduleRecipients}`)
  }

  const handleRunSavedReport = (report: SavedReport) => {
    setActiveTab(report.type)
    setDateRange(report.dateRange)
  }

  // ==========================================
  // RENDER REPORT SECTION
  // ==========================================

  const renderReportSection = (section: ReportSection) => (
    <Card key={section.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {section.metrics.map(metric => (
            <div key={metric.id} className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group/metric">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover/metric:text-[#00f2ff] transition-colors">{metric.name}</span>
                <Badge className={metric.status === "good" ? "bg-emerald-600/20 text-emerald-400" : metric.status === "warning" ? "bg-amber-600/20 text-amber-400" : "bg-red-600/20 text-red-400"}>
                  {metric.status}
                </Badge>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-[#8E939D]">{formatValue(metric.value, metric.unit)}</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend, metric.changePercent)}
                  <span className={getStatusColor(metric.status)}>{metric.changePercent > 0 ? "+" : ""}{metric.changePercent}%</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-[#5C6270]">Target: {formatValue(metric.target, metric.unit)}</span>
                <span className="text-[#5C6270]">Previous: {formatValue(metric.previousValue, metric.unit)}</span>
              </div>
            </div>
          ))}
        </div>
        
        {section.chartType && (
          <div className="mt-6 h-48 bg-[#00f2ff]/5 rounded-lg border border-[#00f2ff]/15 flex items-center justify-center">
            <p className="text-[#5C6270] text-[9px] uppercase tracking-widest font-bold group-hover:text-[#00f2ff] transition-colors">{section.chartType} CHART VISUALIZATION WOULD APPEAR HERE</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isLoading || configLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> ANALYTICS & REPORTS
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] mt-2 group-hover:text-[#00f2ff]/70 transition-colors">
            COMPREHENSIVE HOTEL PERFORMANCE DATA FROM ALL DEPARTMENTS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/5 hover:bg-slate-700 text-slate-300">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Export Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Format</Label>
                  <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                    <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filename" className="text-slate-300">File Name</Label>
                  <Input
                    id="filename"
                    defaultValue={`${activeTab}-report-${format(new Date(), "yyyy-MM-dd")}`}
                    className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Include</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="include-charts" defaultChecked />
                      <Label htmlFor="include-charts" className="text-sm text-slate-300">Charts and visualizations</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="include-comparison" defaultChecked />
                      <Label htmlFor="include-comparison" className="text-sm text-slate-300">Comparison data</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="include-notes" />
                      <Label htmlFor="include-notes" className="text-sm text-slate-300">Executive summary notes</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                  onClick={() => setIsExportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                  onClick={handleExportReport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Schedule Button */}
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/5 hover:bg-slate-700 text-slate-300">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Schedule Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-slate-300">Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={(v: any) => setScheduleFrequency(v)}>
                    <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipients" className="text-slate-300">Email Recipients</Label>
                  <Input
                    id="recipients"
                    placeholder="gm@xylo.com, finance@xylo.com"
                    value={scheduleRecipients}
                    onChange={(e) => setScheduleRecipients(e.target.value)}
                    className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                  />
                  <p className="text-xs text-[#5C6270]">Separate multiple emails with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format" className="text-slate-300">Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                  onClick={handleScheduleReport}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Range & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
          <SelectTrigger className="w-[200px] bg-[#00f2ff]/10 border-[#00f2ff]/20">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-quarter">This Quarter</SelectItem>
            <SelectItem value="last-quarter">Last Quarter</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <CalendarComponent
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  className="rounded-md border-[#00f2ff]/20"
                />
              </PopoverContent>
            </Popover>
            <span className="text-[#5C6270]">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <CalendarComponent
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  className="rounded-md border-[#00f2ff]/20"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Select value={compareWith} onValueChange={(v: any) => setCompareWith(v)}>
          <SelectTrigger className="w-[180px] bg-[#00f2ff]/10 border-[#00f2ff]/20">
            <SelectValue placeholder="Compare with" />
          </SelectTrigger>
          <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
            <SelectItem value="previous">Previous Period</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270]" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#00f2ff]/5 border-[#00f2ff]/20"
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 flex-wrap">
          <TabsTrigger value="flash" className="data-[state=active]:bg-slate-700">⚡ Flash Report</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700">💰 Revenue</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700">🔧 Operations</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-slate-700">📊 Financial</TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-slate-700">🏨 Rooms</TabsTrigger>
          <TabsTrigger value="fandb" className="data-[state=active]:bg-slate-700">🍽️ F&B</TabsTrigger>
          <TabsTrigger value="hr" className="data-[state=active]:bg-slate-700">👥 HR</TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-slate-700">📈 Sales</TabsTrigger>
          <TabsTrigger value="engineering" className="data-[state=active]:bg-slate-700">🔧 Engineering</TabsTrigger>
          <TabsTrigger value="spa" className="data-[state=active]:bg-slate-700">🧖 Spa</TabsTrigger>
          <TabsTrigger value="gym" className="data-[state=active]:bg-slate-700">🏋️ Gym</TabsTrigger>
          <TabsTrigger value="channel" className="data-[state=active]:bg-slate-700">📱 Channel</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-slate-700">💾 Saved</TabsTrigger>
        </TabsList>

        {/* Flash Report */}
        <TabsContent value="flash" className="space-y-4">
          {flashReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4">
          {revenueReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Operations Report */}
        <TabsContent value="operations" className="space-y-4">
          {operationsReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Financial Report */}
        <TabsContent value="financial" className="space-y-4">
          {financialReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* HR Report */}
        <TabsContent value="hr" className="space-y-4">
          {hrReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4">
          {salesReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Engineering Report */}
        <TabsContent value="engineering" className="space-y-4">
          {engineeringReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* F&B Report */}
        <TabsContent value="fandb" className="space-y-4">
          {fandbReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Rooms Report */}
        <TabsContent value="rooms" className="space-y-4">
          {roomsReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Spa Report */}
        <TabsContent value="spa" className="space-y-4">
          {spaReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Gym Report */}
        <TabsContent value="gym" className="space-y-4">
          {gymReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Channel Report */}
        <TabsContent value="channel" className="space-y-4">
          {channelReport.map(section => renderReportSection(section))}
        </TabsContent>

        {/* Saved Reports */}
        <TabsContent value="saved" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Saved Reports</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {savedReports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 cursor-pointer hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group/item"
                    onClick={() => handleRunSavedReport(report)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover/item:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{report.name}</span>
                        <Badge className="bg-blue-600/20 text-blue-400">{report.type}</Badge>
                      </div>
                      <p className="text-sm text-[#8E939D] mt-1">
                        Created: {report.createdAt} · Last run: {report.lastRun || "Never"}
                      </p>
                      {report.schedule !== "none" && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-purple-600/20 text-purple-400">{report.schedule}</Badge>
                          <span className="text-xs text-[#5C6270]">
                            Recipients: {report.recipients?.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                        <Eye className="h-4 w-4 mr-2" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Footer */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all mt-4">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-[#8E939D]">Report generated:</span>
              <span className="text-slate-300">{format(new Date(), "MMMM d, yyyy h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600/20 text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Real-time data
              </Badge>
              <Badge className="bg-blue-600/20 text-blue-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                All departments
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}