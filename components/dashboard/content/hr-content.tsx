"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Users, UserPlus, UserMinus, UserCheck, UserX,
  Briefcase, Building2, Calendar, Clock, DollarSign,
  TrendingUp, ArrowUpRight, ArrowDownRight, Search,
  Filter, Plus, Download, Printer, Eye, EyeOff,
  MoreHorizontal, Edit, Trash2, Copy, RefreshCw,
  Star, Award, Crown, Target, Shield,
  FileText, ClipboardList, CheckCircle2, AlertCircle,
  AlertTriangle, Info, Mail, Phone, MessageSquare,
  GraduationCap, BookOpen, Video, Presentation,
  Wallet, CreditCard, Banknote, Receipt,
  Timer, AlarmClock, Coffee, Sunrise, Sunset,
  Lock, Key, Fingerprint, 
  Folder, FolderOpen, FolderCheck, FileSignature,
  BarChart3, PieChart, LineChart, Activity,
  ThumbsUp, ThumbsDown, Medal, Trophy,
  Zap, Flame, Gauge, Network
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

// ==========================================
// TYPES
// ==========================================

type EmployeeStatus = "active" | "inactive" | "suspended" | "on-leave" | "terminated"
type EmploymentType = "full-time" | "part-time" | "contract" | "intern" | "seasonal"
type Department = "rooms" | "fandb" | "kitchen" | "engineering" | "security" | "spa" | "sales" | "finance" | "hr" | "executive" | "it" | "housekeeping"
type RoleLevel = "staff" | "supervisor" | "manager" | "director" | "executive" | "admin"
type LeaveType = "annual" | "sick" | "emergency" | "maternity" | "paternity" | "bereavement" | "unpaid"
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"
type RecruitmentStatus = "draft" | "published" | "screening" | "interviewing" | "offered" | "filled" | "cancelled"
type PerformanceRating = 1 | 2 | 3 | 4 | 5

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: Department
  departmentName: string
  role: string
  roleLevel: RoleLevel
  status: EmployeeStatus
  employmentType: EmploymentType
  joinDate: string
  probationEndDate?: string
  contractEndDate?: string
  managerId?: string
  managerName?: string
  location: string
  nationality: string
  languages: string[]
  dateOfBirth: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  address: string
  documents: {
    contract: boolean
    idCopy: boolean
    visa: boolean
    insurance: boolean
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    branchCode: string
  }
  salary: {
    basic: number
    housing?: number
    transportation?: number
    other?: number
    total: number
  }
  avatar?: string
}

interface Recruitment {
  id: string
  position: string
  department: Department
  departmentName: string
  roleLevel: RoleLevel
  type: EmploymentType
  headcount: number
  filled: number
  status: RecruitmentStatus
  priority: "critical" | "high" | "medium" | "low"
  postedDate: string
  closingDate?: string
  applications: number
  screening: number
  interviewed: number
  offered: number
  accepted: number
  salary: {
    min: number
    max: number
  }
  requirements: string[]
  description: string
  hiringManager: string
  location: string
}

interface Applicant {
  id: string
  recruitmentId: string
  position: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: "new" | "screening" | "interview" | "offered" | "accepted" | "rejected" | "withdrawn"
  appliedDate: string
  resume: string
  coverLetter?: string
  interviewDate?: string
  interviewer?: string
  rating?: number
  feedback?: string
  notes?: string
}

interface Leave {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  status: LeaveStatus
  startDate: string
  endDate: string
  days: number
  reason?: string
  appliedOn: string
  approvedBy?: string
  approvedOn?: string
  notes?: string
}

interface Training {
  id: string
  title: string
  description: string
  category: "induction" | "technical" | "service" | "leadership" | "compliance" | "language"
  provider: "internal" | "external"
  instructor: string
  duration: number // hours
  startDate: string
  endDate: string
  location: string
  capacity: number
  enrolled: number
  completed: number
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  mandatory: boolean
  department?: Department[]
  certifications?: string[]
}

interface TrainingEnrollment {
  id: string
  trainingId: string
  employeeId: string
  employeeName: string
  status: "enrolled" | "in-progress" | "completed" | "no-show" | "cancelled"
  completedDate?: string
  score?: number
  feedback?: string
}

interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewerId: string
  reviewerName: string
  period: string
  reviewDate: string
  dueDate: string
  status: "draft" | "submitted" | "approved" | "acknowledged"
  ratings: {
    jobKnowledge: PerformanceRating
    qualityOfWork: PerformanceRating
    productivity: PerformanceRating
    communication: PerformanceRating
    teamwork: PerformanceRating
    initiative: PerformanceRating
    customerFocus: PerformanceRating
    leadership?: PerformanceRating
  }
  overallRating: PerformanceRating
  strengths: string[]
  improvements: string[]
  goals: {
    goal: string
    target: string
    deadline: string
    status: "pending" | "in-progress" | "completed"
  }[]
  comments?: string
  employeeComments?: string
}

interface PayrollEntry {
  id: string
  employeeId: string
  employeeName: string
  month: string
  year: number
  basic: number
  allowances: {
    housing?: number
    transportation?: number
    meal?: number
    other?: number
  }
  overtime: {
    hours: number
    amount: number
  }
  bonuses: number
  deductions: {
    tax: number
    pension?: number
    insurance?: number
    loan?: number
    other?: number
  }
  netPay: number
  paymentDate: string
  status: "pending" | "processed" | "paid" | "cancelled"
}

interface Attendance {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn?: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours: number
  overtime: number
  status: "present" | "absent" | "late" | "half-day" | "holiday" | "leave"
  notes?: string
}

interface Disciplinary {
  id: string
  employeeId: string
  employeeName: string
  type: "verbal-warning" | "written-warning" | "final-warning" | "suspension" | "termination"
  date: string
  reason: string
  description: string
  issuedBy: string
  acknowledged: boolean
  acknowledgedDate?: string
  notes?: string
  documents?: string[]
}

interface Document {
  id: string
  employeeId: string
  employeeName: string
  type: "contract" | "id" | "visa" | "insurance" | "certificate" | "other"
  name: string
  uploadDate: string
  expiryDate?: string
  status: "valid" | "expiring-soon" | "expired"
  url: string
  notes?: string
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function HRContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<Department | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | "all">("all")
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([])
  const [recruitments, setRecruitments] = useState<Recruitment[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [trainingEnrollments, setTrainingEnrollments] = useState<TrainingEnrollment[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [disciplinary, setDisciplinary] = useState<Disciplinary[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false)
  const [isNewRecruitmentOpen, setIsNewRecruitmentOpen] = useState(false)
  const [isEmployeeDetailOpen, setIsEmployeeDetailOpen] = useState(false)
  const [isLeaveRequestOpen, setIsLeaveRequestOpen] = useState(false)
  const [isTrainingOpen, setIsTrainingOpen] = useState(false)
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedRecruitment, setSelectedRecruitment] = useState<Recruitment | null>(null)
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "rooms" as Department,
    role: "",
    roleLevel: "staff" as RoleLevel,
    employmentType: "full-time" as EmploymentType,
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0,
    nationality: "",
    languages: [""],
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: ""
  })

  const { config, loading: configLoading } = useHotelConfig()

  // ==========================================
  // MOCK DATA (Replace with API calls)
  // ==========================================
  
  useEffect(() => {
    setTimeout(() => {
      // Employees
      setEmployees([
        {
          id: "emp1",
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@xylo.com",
          phone: "+971 50 123 4567",
          department: "rooms",
          departmentName: "Rooms Division",
          role: "Front Office Manager",
          roleLevel: "manager",
          status: "active",
          employmentType: "full-time",
          joinDate: "2022-03-15",
          probationEndDate: "2022-06-15",
          managerId: "emp6",
          managerName: "Sarah Johnson",
          location: "Main Building",
          nationality: "British",
          languages: ["English", "French"],
          dateOfBirth: "1985-07-22",
          emergencyContact: {
            name: "Jane Smith",
            relationship: "Spouse",
            phone: "+971 50 987 6543"
          },
          address: "123 Hotel Staff Accommodation, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 12000,
            housing: 6000,
            transportation: 2000,
            total: 20000
          },
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        {
          id: "emp2",
          employeeId: "EMP002",
          firstName: "Maria",
          lastName: "Santos",
          email: "maria.santos@xylo.com",
          phone: "+971 50 234 5678",
          department: "housekeeping",
          departmentName: "Housekeeping",
          role: "Housekeeping Supervisor",
          roleLevel: "supervisor",
          status: "active",
          employmentType: "full-time",
          joinDate: "2023-01-10",
          managerId: "emp7",
          managerName: "Elena Petrova",
          location: "Main Building",
          nationality: "Filipino",
          languages: ["English", "Tagalog"],
          dateOfBirth: "1990-11-05",
          emergencyContact: {
            name: "Carlos Santos",
            relationship: "Brother",
            phone: "+971 50 876 5432"
          },
          address: "456 Staff Village, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 6000,
            housing: 3000,
            transportation: 1000,
            total: 10000
          }
        },
        {
          id: "emp3",
          employeeId: "EMP003",
          firstName: "Ahmed",
          lastName: "Hassan",
          email: "ahmed.hassan@xylo.com",
          phone: "+971 50 345 6789",
          department: "kitchen",
          departmentName: "Kitchen",
          role: "Sous Chef",
          roleLevel: "manager",
          status: "active",
          employmentType: "full-time",
          joinDate: "2021-08-20",
          managerId: "emp8",
          managerName: "Chef Michael",
          location: "Main Kitchen",
          nationality: "Egyptian",
          languages: ["Arabic", "English"],
          dateOfBirth: "1988-03-12",
          emergencyContact: {
            name: "Fatima Hassan",
            relationship: "Spouse",
            phone: "+971 50 765 4321"
          },
          address: "789 Staff Quarters, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 15000,
            housing: 7000,
            transportation: 2000,
            other: 500,
            total: 24500
          }
        },
        {
          id: "emp4",
          employeeId: "EMP004",
          firstName: "Lisa",
          lastName: "Chen",
          email: "lisa.chen@xylo.com",
          phone: "+971 50 456 7890",
          department: "sales",
          departmentName: "Sales & Marketing",
          role: "Sales Manager",
          roleLevel: "manager",
          status: "active",
          employmentType: "full-time",
          joinDate: "2022-11-01",
          managerId: "emp9",
          managerName: "David Kim",
          location: "Sales Office",
          nationality: "Singaporean",
          languages: ["English", "Mandarin"],
          dateOfBirth: "1992-09-18",
          emergencyContact: {
            name: "Wei Chen",
            relationship: "Father",
            phone: "+65 9123 4567"
          },
          address: "101 Staff Tower, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 18000,
            housing: 8000,
            transportation: 2000,
            other: 5000,
            total: 33000
          }
        },
        {
          id: "emp5",
          employeeId: "EMP005",
          firstName: "Robert",
          lastName: "Wilson",
          email: "robert.wilson@xylo.com",
          phone: "+971 50 567 8901",
          department: "engineering",
          departmentName: "Engineering",
          role: "Chief Engineer",
          roleLevel: "director",
          status: "active",
          employmentType: "full-time",
          joinDate: "2020-05-10",
          managerId: "emp10",
          managerName: "Michael Brown",
          location: "Engineering Office",
          nationality: "American",
          languages: ["English"],
          dateOfBirth: "1978-12-03",
          emergencyContact: {
            name: "Sarah Wilson",
            relationship: "Spouse",
            phone: "+1 555-1234"
          },
          address: "202 Staff Villas, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 25000,
            housing: 12000,
            transportation: 3000,
            total: 40000
          }
        },
        {
          id: "emp6",
          employeeId: "EMP006",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@xylo.com",
          phone: "+971 50 678 9012",
          department: "executive",
          departmentName: "Executive Office",
          role: "Director of Rooms",
          roleLevel: "director",
          status: "active",
          employmentType: "full-time",
          joinDate: "2019-02-20",
          location: "Executive Office",
          nationality: "Australian",
          languages: ["English"],
          dateOfBirth: "1982-07-30",
          emergencyContact: {
            name: "Mark Johnson",
            relationship: "Spouse",
            phone: "+971 50 789 0123"
          },
          address: "303 Executive Villas, Dubai",
          documents: {
            contract: true,
            idCopy: true,
            visa: true,
            insurance: true
          },
          salary: {
            basic: 32000,
            housing: 15000,
            transportation: 4000,
            total: 51000
          }
        }
      ])

      // Recruitments
      setRecruitments([
        {
          id: "rec1",
          position: "Executive Chef",
          department: "kitchen",
          departmentName: "Kitchen",
          roleLevel: "director",
          type: "full-time",
          headcount: 1,
          filled: 0,
          status: "interviewing",
          priority: "critical",
          postedDate: "2024-02-01",
          closingDate: "2024-03-15",
          applications: 12,
          screening: 8,
          interviewed: 4,
          offered: 0,
          accepted: 0,
          salary: {
            min: 35000,
            max: 45000
          },
          requirements: ["10+ years experience", "Michelin experience", "Leadership skills"],
          description: "Lead our culinary team across 5 restaurants",
          hiringManager: "GM Office",
          location: "Main Kitchen"
        },
        {
          id: "rec2",
          position: "Front Desk Agent",
          department: "rooms",
          departmentName: "Rooms Division",
          roleLevel: "staff",
          type: "full-time",
          headcount: 3,
          filled: 1,
          status: "screening",
          priority: "high",
          postedDate: "2024-02-15",
          applications: 45,
          screening: 30,
          interviewed: 0,
          offered: 1,
          accepted: 1,
          salary: {
            min: 5000,
            max: 7000
          },
          requirements: ["Customer service experience", "Languages", "PMS knowledge"],
          description: "Welcome and check-in guests",
          hiringManager: "Front Office Manager",
          location: "Front Desk"
        },
        {
          id: "rec3",
          position: "Sous Chef",
          department: "kitchen",
          departmentName: "Kitchen",
          roleLevel: "manager",
          type: "full-time",
          headcount: 1,
          filled: 0,
          status: "published",
          priority: "medium",
          postedDate: "2024-02-20",
          applications: 8,
          screening: 5,
          interviewed: 0,
          offered: 0,
          accepted: 0,
          salary: {
            min: 18000,
            max: 25000
          },
          requirements: ["5+ years experience", "Italian cuisine", "Team management"],
          description: "Support Executive Chef in kitchen operations",
          hiringManager: "Executive Chef",
          location: "Main Kitchen"
        }
      ])

      // Applicants
      setApplicants([
        {
          id: "app1",
          recruitmentId: "rec1",
          position: "Executive Chef",
          firstName: "Marco",
          lastName: "Bianchi",
          email: "marco.bianchi@email.com",
          phone: "+39 123 4567",
          status: "interview",
          appliedDate: "2024-02-05",
          resume: "marco_resume.pdf",
          interviewDate: "2024-03-01",
          interviewer: "GM",
          rating: 4,
          feedback: "Strong culinary background, good leadership"
        },
        {
          id: "app2",
          recruitmentId: "rec1",
          position: "Executive Chef",
          firstName: "Pierre",
          lastName: "Dubois",
          email: "pierre.dubois@email.com",
          phone: "+33 123 4567",
          status: "screening",
          appliedDate: "2024-02-10",
          resume: "pierre_resume.pdf"
        },
        {
          id: "app3",
          recruitmentId: "rec2",
          position: "Front Desk Agent",
          firstName: "Anna",
          lastName: "Kowalski",
          email: "anna.k@email.com",
          phone: "+48 123 4567",
          status: "offered",
          appliedDate: "2024-02-16",
          resume: "anna_resume.pdf",
          rating: 5,
          feedback: "Excellent communication, speaks 3 languages"
        }
      ])

      // Leaves
      setLeaves([
        {
          id: "lv1",
          employeeId: "emp2",
          employeeName: "Maria Santos",
          type: "annual",
          status: "approved",
          startDate: "2024-03-10",
          endDate: "2024-03-17",
          days: 7,
          reason: "Family visit",
          appliedOn: "2024-02-01",
          approvedBy: "Elena Petrova",
          approvedOn: "2024-02-03"
        },
        {
          id: "lv2",
          employeeId: "emp3",
          employeeName: "Ahmed Hassan",
          type: "sick",
          status: "approved",
          startDate: "2024-02-28",
          endDate: "2024-03-02",
          days: 3,
          reason: "Flu",
          appliedOn: "2024-02-28",
          approvedBy: "Chef Michael",
          approvedOn: "2024-02-28"
        },
        {
          id: "lv3",
          employeeId: "emp4",
          employeeName: "Lisa Chen",
          type: "emergency",
          status: "pending",
          startDate: "2024-03-05",
          endDate: "2024-03-07",
          days: 2,
          reason: "Family emergency",
          appliedOn: "2024-03-01"
        }
      ])

      // Trainings
      setTrainings([
        {
          id: "tr1",
          title: "Service Excellence - Forbes Standards",
          description: "5-star service standards and guest interaction",
          category: "service",
          provider: "internal",
          instructor: "Sarah Johnson",
          duration: 8,
          startDate: "2024-03-15",
          endDate: "2024-03-15",
          location: "Training Room A",
          capacity: 20,
          enrolled: 18,
          completed: 0,
          status: "scheduled",
          mandatory: true,
          department: ["rooms", "fandb", "spa"]
        },
        {
          id: "tr2",
          title: "Food Safety Level 2",
          description: "HACCP certification for kitchen staff",
          category: "compliance",
          provider: "external",
          instructor: "Health Authority",
          duration: 16,
          startDate: "2024-03-10",
          endDate: "2024-03-12",
          location: "Training Room B",
          capacity: 15,
          enrolled: 12,
          completed: 0,
          status: "scheduled",
          mandatory: true,
          department: ["kitchen"],
          certifications: ["Food Safety Certificate"]
        },
        {
          id: "tr3",
          title: "Leadership Essentials",
          description: "Management skills for new supervisors",
          category: "leadership",
          provider: "internal",
          instructor: "HR Director",
          duration: 12,
          startDate: "2024-02-20",
          endDate: "2024-02-22",
          location: "Training Room A",
          capacity: 12,
          enrolled: 10,
          completed: 8,
          status: "in-progress",
          mandatory: false
        }
      ])

      // Performance Reviews
      setPerformanceReviews([
        {
          id: "pr1",
          employeeId: "emp2",
          employeeName: "Maria Santos",
          reviewerId: "emp7",
          reviewerName: "Elena Petrova",
          period: "Q1 2024",
          reviewDate: "2024-03-01",
          dueDate: "2024-03-15",
          status: "approved",
          ratings: {
            jobKnowledge: 4,
            qualityOfWork: 4,
            productivity: 5,
            communication: 4,
            teamwork: 5,
            initiative: 4,
            customerFocus: 5
          },
          overallRating: 4,
          strengths: ["Team player", "Attention to detail", "Reliable"],
          improvements: ["Time management", "Documentation"],
          goals: [
            {
              goal: "Improve inspection scores",
              target: "95%",
              deadline: "2024-06-30",
              status: "in-progress"
            }
          ]
        }
      ])

      // Attendance (last 7 days)
      const attendanceData: Attendance[] = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        employees.forEach(emp => {
          if (emp.status === "active") {
            const rand = Math.random()
            attendanceData.push({
              id: `att-${emp.id}-${dateStr}`,
              employeeId: emp.id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              date: dateStr,
              clockIn: "09:00",
              clockOut: "18:00",
              totalHours: 9,
              overtime: 0,
              status: rand < 0.1 ? "absent" : rand < 0.15 ? "late" : "present"
            })
          }
        })
      }
      setAttendance(attendanceData)

      // Disciplinary
      setDisciplinary([
        {
          id: "disc1",
          employeeId: "emp3",
          employeeName: "Ahmed Hassan",
          type: "verbal-warning",
          date: "2024-02-15",
          reason: "Tardiness",
          description: "Late to shift 3 times in one week",
          issuedBy: "Chef Michael",
          acknowledged: true,
          acknowledgedDate: "2024-02-15"
        }
      ])

      // Documents
      setDocuments([
        {
          id: "doc1",
          employeeId: "emp1",
          employeeName: "John Smith",
          type: "contract",
          name: "Employment Contract - John Smith.pdf",
          uploadDate: "2022-03-10",
          expiryDate: "2025-03-09",
          status: "valid",
          url: "/docs/contract1.pdf"
        },
        {
          id: "doc2",
          employeeId: "emp1",
          employeeName: "John Smith",
          type: "visa",
          name: "Residence Visa - John Smith.pdf",
          uploadDate: "2022-03-15",
          expiryDate: "2024-05-20",
          status: "expiring-soon",
          url: "/docs/visa1.pdf"
        }
      ])

      setIsLoading(false)
    }, 500)
  }, [])

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === "active").length
  const onLeave = leaves.filter(l => l.status === "approved" && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length
  const openPositions = recruitments.filter(r => r.status !== "filled" && r.status !== "cancelled").reduce((sum, r) => sum + (r.headcount - r.filled), 0)
  const pendingLeaves = leaves.filter(l => l.status === "pending").length
  const upcomingTrainings = trainings.filter(t => t.status === "scheduled" && new Date(t.startDate) > new Date()).length
  const pendingReviews = performanceReviews.filter(pr => pr.status === "draft" || pr.status === "submitted").length

  const laborCost = employees.reduce((sum, e) => sum + e.salary.total, 0)
  const avgSalary = Math.round(laborCost / employees.length)

  // Department distribution
  const departmentStats = useMemo(() => {
    const stats: Record<string, { total: number; active: number }> = {}
    employees.forEach(emp => {
      if (!stats[emp.department]) {
        stats[emp.department] = { total: 0, active: 0 }
      }
      stats[emp.department].total++
      if (emp.status === "active") {
        stats[emp.department].active++
      }
    })
    return stats
  }, [employees])

  // ==========================================
  // FILTERS
  // ==========================================

  const filteredEmployees = useMemo(() => {
    let filtered = employees
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(e => e.department === selectedDepartment)
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(e => e.status === selectedStatus)
    }
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }, [employees, selectedDepartment, selectedStatus, searchQuery])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreateEmployee = () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email) {
      alert("Please fill in all required fields")
      return
    }

    const employee: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP${(employees.length + 1).toString().padStart(3, '0')}`,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      phone: newEmployee.phone,
      department: newEmployee.department,
      departmentName: newEmployee.department,
      role: newEmployee.role || "Staff",
      roleLevel: newEmployee.roleLevel,
      status: "active",
      employmentType: newEmployee.employmentType,
      joinDate: newEmployee.joinDate,
      location: "Main Building",
      nationality: newEmployee.nationality || "Not specified",
      languages: newEmployee.languages[0] ? newEmployee.languages : ["English"],
      dateOfBirth: "1990-01-01",
      emergencyContact: {
        name: newEmployee.emergencyContactName || "Not provided",
        relationship: newEmployee.emergencyContactRelationship || "Not provided",
        phone: newEmployee.emergencyContactPhone || "Not provided"
      },
      address: "Staff Accommodation",
      documents: {
        contract: false,
        idCopy: false,
        visa: false,
        insurance: false
      },
      salary: {
        basic: newEmployee.salary,
        total: newEmployee.salary
      }
    }

    setEmployees([employee, ...employees])
    setIsNewEmployeeOpen(false)
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "rooms",
      role: "",
      roleLevel: "staff",
      employmentType: "full-time",
      joinDate: new Date().toISOString().split('T')[0],
      salary: 0,
      nationality: "",
      languages: [""],
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: ""
    })
  }

  const handleApproveLeave = (leaveId: string) => {
    setLeaves(prev =>
      prev.map(l =>
        l.id === leaveId
          ? { ...l, status: "approved", approvedBy: "HR Manager", approvedOn: new Date().toISOString().split('T')[0] }
          : l
      )
    )
  }

  const handleRejectLeave = (leaveId: string) => {
    setLeaves(prev =>
      prev.map(l =>
        l.id === leaveId ? { ...l, status: "rejected" } : l
      )
    )
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400"
      case "inactive": return "bg-slate-500/20 text-[#8E939D]"
      case "suspended": return "bg-red-500/20 text-red-400"
      case "on-leave": return "bg-amber-500/20 text-amber-400"
      case "terminated": return "bg-slate-500/20 text-[#8E939D]"
    }
  }

  const getRoleLevelColor = (level: RoleLevel) => {
    switch (level) {
      case "staff": return "bg-slate-500/20 text-[#8E939D]"
      case "supervisor": return "bg-blue-500/20 text-blue-400"
      case "manager": return "bg-purple-500/20 text-purple-400"
      case "director": return "bg-amber-500/20 text-amber-400"
      case "executive": return "bg-red-500/20 text-red-400"
      case "admin": return "bg-emerald-500/20 text-emerald-400"
    }
  }

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case "annual": return "bg-blue-500/20 text-blue-400"
      case "sick": return "bg-amber-500/20 text-amber-400"
      case "emergency": return "bg-red-500/20 text-red-400"
      case "maternity": return "bg-purple-500/20 text-purple-400"
      case "paternity": return "bg-cyan-500/20 text-cyan-400"
      case "bereavement": return "bg-slate-500/20 text-[#8E939D]"
      case "unpaid": return "bg-slate-500/20 text-[#8E939D]"
    }
  }

  const getLeaveStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-400"
      case "approved": return "bg-emerald-500/20 text-emerald-400"
      case "rejected": return "bg-red-500/20 text-red-400"
      case "cancelled": return "bg-slate-500/20 text-[#8E939D]"
    }
  }

  const getRecruitmentPriorityColor = (priority: Recruitment["priority"]) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400"
      case "high": return "bg-orange-500/20 text-orange-400"
      case "medium": return "bg-yellow-500/20 text-yellow-400"
      case "low": return "bg-blue-500/20 text-blue-400"
    }
  }

  const getDepartmentIcon = (dept: Department) => {
    switch (dept) {
      case "rooms": return "🏨"
      case "fandb": return "🍽️"
      case "kitchen": return "👨‍🍳"
      case "engineering": return "🔧"
      case "security": return "🛡️"
      case "spa": return "🧖"
      case "sales": return "📈"
      case "finance": return "💰"
      case "hr": return "👥"
      case "executive": return "👑"
      case "it": return "💻"
      case "housekeeping": return "🧹"
    }
  }

  if (isLoading || configLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
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
            <Users className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> HUMAN RESOURCES
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] mt-2 group-hover:text-[#00f2ff]/70 transition-colors">
            {activeEmployees} ACTIVE <span className="text-[#00f2ff]/30 mx-1">/</span> {openPositions} OPEN <span className="text-[#00f2ff]/30 mx-1">/</span> {pendingLeaves} PENDING
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isNewRecruitmentOpen} onOpenChange={setIsNewRecruitmentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0a0c10] border border-purple-400/30 hover:bg-purple-400/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400 h-10 text-[10px] font-bold uppercase tracking-widest transition-all">
                <Briefcase className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" />
                NEW POSITION
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Create New Position</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-[11px] tracking-wide text-[#8E939D]">Position creation form would go here</p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewEmployeeOpen} onOpenChange={setIsNewEmployeeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0a0c10] border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] text-[#00f2ff] h-10 text-[10px] font-bold uppercase tracking-widest transition-all">
                <UserPlus className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />
                ADD EMPLOYEE
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Add New Employee</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="employee@xylo.com"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+971 50 123 4567"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-300">Department</Label>
                    <Select 
                      value={newEmployee.department} 
                      onValueChange={(v: Department) => setNewEmployee({...newEmployee, department: v})}
                    >
                      <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectItem value="rooms">Rooms Division</SelectItem>
                        <SelectItem value="fandb">Food & Beverage</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="spa">Spa & Wellness</SelectItem>
                        <SelectItem value="sales">Sales & Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-300">Job Title</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Front Desk Agent"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="roleLevel" className="text-slate-300">Level</Label>
                    <Select 
                      value={newEmployee.roleLevel} 
                      onValueChange={(v: RoleLevel) => setNewEmployee({...newEmployee, roleLevel: v})}
                    >
                      <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType" className="text-slate-300">Employment Type</Label>
                    <Select 
                      value={newEmployee.employmentType} 
                      onValueChange={(v: EmploymentType) => setNewEmployee({...newEmployee, employmentType: v})}
                    >
                      <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="joinDate" className="text-slate-300">Join Date</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={newEmployee.joinDate}
                      onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-slate-300">Basic Salary (AED)</Label>
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="100"
                      value={newEmployee.salary || ""}
                      onChange={(e) => setNewEmployee({...newEmployee, salary: parseInt(e.target.value) || 0})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Emergency Contact</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Name"
                      value={newEmployee.emergencyContactName}
                      onChange={(e) => setNewEmployee({...newEmployee, emergencyContactName: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                    <Input
                      placeholder="Relationship"
                      value={newEmployee.emergencyContactRelationship}
                      onChange={(e) => setNewEmployee({...newEmployee, emergencyContactRelationship: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                    <Input
                      placeholder="Phone"
                      value={newEmployee.emergencyContactPhone}
                      onChange={(e) => setNewEmployee({...newEmployee, emergencyContactPhone: e.target.value})}
                      className="bg-[#00f2ff]/10 border-[#00f2ff]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/20">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300 hover:bg-slate-700"
                  onClick={() => setIsNewEmployeeOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                  onClick={handleCreateEmployee}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1️⃣ Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "TOTAL EMP", val: totalEmployees, color: "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" },
          { label: "ACTIVE", val: activeEmployees, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" },
          { label: "ON LEAVE", val: onLeave, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
          { label: "OPEN POS", val: openPositions, color: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" },
          { label: "PENDING LV", val: pendingLeaves, color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" },
          { label: "TRAININGS", val: upcomingTrainings, color: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]" },
          { label: "REVIEWS DUE", val: pendingReviews, color: "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" }
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10 flex flex-col justify-between h-full">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{kpi.label}</p>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2️⃣ Department Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(departmentStats).map(([dept, stats]) => (
          <Card key={dept} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 group cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <div className="flex items-center justify-between mb-3 border-b border-[#00f2ff]/10 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all flex items-center gap-1.5">
                  <span className="text-[12px]">{getDepartmentIcon(dept as Department)}</span> 
                  {dept.length > 8 ? dept.substring(0,8) + '...' : dept}
                </span>
                <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[8px] tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.2)]">{stats.total}</Badge>
              </div>
              <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest mb-1.5">
                <span className="text-[#5C6270]">ACTIVE</span>
                <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)] text-lg">{stats.active}</span>
              </div>
              <Progress value={(stats.active / stats.total) * 100} className="h-1 bg-[#00f2ff]/10 [&>div]:bg-[#00f2ff]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3️⃣ Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Overview</TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-slate-700">Employees</TabsTrigger>
          <TabsTrigger value="recruitment" className="data-[state=active]:bg-slate-700">Recruitment</TabsTrigger>
          <TabsTrigger value="leaves" className="data-[state=active]:bg-slate-700">Leave Management</TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-slate-700">Training</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">Performance</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-slate-700">Attendance</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-slate-700">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Hires */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 lg:col-span-2 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Recent Hires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.slice(0, 5).map(emp => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 cursor-pointer hover:bg-[#00f2ff]/5"
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setIsEmployeeDetailOpen(true)
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={emp.avatar} />
                        <AvatarFallback className="bg-blue-600/20 text-blue-400">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{emp.firstName} {emp.lastName}</span>
                          <Badge className={getStatusColor(emp.status)}>{emp.status}</Badge>
                        </div>
                        <p className="text-[11px] tracking-wide text-[#8E939D]">{emp.role} · {emp.departmentName}</p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] mt-1">JOINED: {emp.joinDate}</p>
                      </div>
                      <div className="text-right text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                        {emp.roleLevel}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Leaves */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Pending Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaves.filter(l => l.status === "pending").map(leave => (
                    <div key={leave.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#00f2ff]/10">
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{leave.employeeName}</span>
                        <Badge className={getLeaveTypeColor(leave.type)}>{leave.type}</Badge>
                      </div>
                      <p className="text-[11px] tracking-wide text-[#8E939D]">{leave.startDate} - {leave.endDate} ({leave.days} days)</p>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] mt-1">{leave.reason}</p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApproveLeave(leave.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                          onClick={() => handleRejectLeave(leave.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Trainings & Recruitment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Upcoming Training</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainings.filter(t => t.status === "scheduled").slice(0, 3).map(training => (
                    <div key={training.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{training.title}</span>
                        <Badge className="bg-blue-600/20 text-blue-400">{training.category}</Badge>
                      </div>
                      <p className="text-xs text-[#8E939D]">{training.startDate} · {training.enrolled}/{training.capacity} enrolled</p>
                      <Progress value={(training.enrolled / training.capacity) * 100} className="mt-2 h-1.5 bg-slate-700" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Active Recruitment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recruitments.filter(r => r.status !== "filled" && r.status !== "cancelled").map(rec => (
                    <div key={rec.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{rec.position}</span>
                        <Badge className={getRecruitmentPriorityColor(rec.priority)}>{rec.priority}</Badge>
                      </div>
                      <p className="text-xs text-[#8E939D]">{rec.departmentName} · {rec.filled}/{rec.headcount} filled</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-[#5C6270]">{rec.applications} applicants</span>
                        <span className="text-[#5C6270]">{rec.screening} screening</span>
                        <span className="text-[#5C6270]">{rec.interviewed} interviewed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270]" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#00f2ff]/5 border-[#00f2ff]/20"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={(v: any) => setSelectedDepartment(v)}>
              <SelectTrigger className="w-[180px] bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="rooms">Rooms</SelectItem>
                <SelectItem value="fandb">F&B</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="spa">Spa</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
              <SelectTrigger className="w-[150px] bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => (
              <Card
                key={emp.id}
                className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 cursor-pointer hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 group relative overflow-hidden"
                onClick={() => {
                  setSelectedEmployee(emp)
                  setIsEmployeeDetailOpen(true)
                }}
              >
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                      <AvatarImage src={emp.avatar} />
                      <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] font-bold tracking-widest text-[10px]">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between border-b border-[#00f2ff]/10 pb-2 mb-2">
                        <h3 className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{emp.firstName} {emp.lastName}</h3>
                        <Badge className={getStatusColor(emp.status)}>
                          {emp.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors mt-1">{emp.role}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge className={getRoleLevelColor(emp.roleLevel)}>
                          {emp.roleLevel}
                        </Badge>
                        <span className="text-[#5C6270] text-[9px] uppercase tracking-widest font-bold">ID: <span className="text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{emp.employeeId}</span></span>
                      </div>
                      <div className="mt-2 text-xs text-[#5C6270]">
                        <div>📧 {emp.email}</div>
                        <div>📞 {emp.phone}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isLeaveRequestOpen} onOpenChange={setIsLeaveRequestOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]">
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#8E939D]">Request Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-[11px] tracking-wide text-[#8E939D]">Leave request form would go here</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {leaves.map(leave => (
              <div key={leave.id} className="p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all mr-2">{leave.employeeName}</span>
                      <Badge className={getLeaveTypeColor(leave.type)}>{leave.type}</Badge>
                      <Badge className={getLeaveStatusColor(leave.status)}>{leave.status}</Badge>
                    </div>
                    <p className="text-[10px] tracking-wide font-bold text-[#8E939D] group-hover:text-[#0ea5e9] transition-colors mt-2 mb-1">{leave.startDate} <span className="text-[#5C6270]">///</span> {leave.endDate} ({leave.days} days)</p>
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] mt-1">Reason: {leave.reason}</p>
                    <p className="text-xs text-[#5C6270]">Applied: {leave.appliedOn}</p>
                  </div>
                  {leave.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApproveLeave(leave.id)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                        onClick={() => handleRejectLeave(leave.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainings.map(training => (
              <Card key={training.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] hover:bg-[#00f2ff]/5 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{training.title}</h3>
                    <Badge className={
                      training.status === "scheduled" ? "bg-blue-600/20 text-blue-400" :
                      training.status === "in-progress" ? "bg-amber-600/20 text-amber-400" :
                      training.status === "completed" ? "bg-emerald-600/20 text-emerald-400" :
                      "bg-slate-600/20 text-[#8E939D]"
                    }>
                      {training.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] tracking-wide font-bold text-[#8E939D] mb-3 group-hover:text-[#00f2ff]/80 transition-colors">{training.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#5C6270]">DATE</span>
                      <span className="text-[10px] tracking-wide font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{training.startDate} - {training.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#5C6270]">INSTRUCTOR</span>
                      <span className="text-[10px] tracking-wide font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{training.instructor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#5C6270]">ENROLLMENT</span>
                      <span className="text-[10px] tracking-wide font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{training.enrolled}/{training.capacity}</span>
                    </div>
                  </div>
                  <Progress value={(training.enrolled / training.capacity) * 100} className="mt-3 h-1.5 bg-slate-700" />
                  {training.mandatory && (
                    <Badge className="mt-2 bg-red-600/20 text-red-400">Mandatory</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {performanceReviews.map(review => (
              <div key={review.id} className="p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all mr-2">{review.employeeName}</span>
                      <Badge className={
                        review.status === "draft" ? "bg-slate-600/20 text-[#8E939D]" :
                        review.status === "submitted" ? "bg-blue-600/20 text-blue-400" :
                        review.status === "approved" ? "bg-emerald-600/20 text-emerald-400" :
                        "bg-amber-600/20 text-amber-400"
                      }>
                        {review.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] tracking-wide font-bold text-[#8E939D] group-hover:text-[#0ea5e9] transition-colors mt-2">{review.period} <span className="text-[#5C6270]">///</span> REVIEWER: {review.reviewerName}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.overallRating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-slate-600"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-slate-300 ml-2">{review.overallRating}/5</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">Due: {review.dueDate}</div>
                    <Button size="sm" variant="outline" className="mt-2 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).slice(0, 10).map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-transparent hover:border-[#00f2ff]/20 hover:bg-[#00f2ff]/10 hover:shadow-[0_0_10px_rgba(0,242,255,0.1)] transition-all group">
                      <div>
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{att.employeeName}</span>
                        <div className="text-xs text-[#5C6270]">
                          {att.clockIn} - {att.clockOut} · {att.totalHours}h
                        </div>
                      </div>
                      <Badge className={
                        att.status === "present" ? "bg-emerald-600/20 text-emerald-400" :
                        att.status === "late" ? "bg-amber-600/20 text-amber-400" :
                        att.status === "absent" ? "bg-red-600/20 text-red-400" :
                        "bg-blue-600/20 text-blue-400"
                      }>
                        {att.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <Card key={doc.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] hover:bg-[#00f2ff]/5 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{doc.name}</h3>
                    <Badge className={
                      doc.status === "valid" ? "bg-emerald-600/20 text-emerald-400" :
                      doc.status === "expiring-soon" ? "bg-amber-600/20 text-amber-400" :
                      "bg-red-600/20 text-red-400"
                    }>
                      {doc.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] tracking-wide text-[#8E939D]">Employee: {doc.employeeName}</p>
                  <div className="mt-2 text-xs text-[#5C6270]">
                    <div>Type: {doc.type}</div>
                    <div>Uploaded: {doc.uploadDate}</div>
                    {doc.expiryDate && <div>Expires: {doc.expiryDate}</div>}
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Employee Detail Dialog */}
      <Dialog open={isEmployeeDetailOpen} onOpenChange={setIsEmployeeDetailOpen}>
        <DialogContent aria-describedby={undefined} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#8E939D]">Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedEmployee.avatar} />
                  <AvatarFallback className="bg-blue-600/20 text-blue-400 text-xl">
                    {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[#8E939D]">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-[#8E939D]">{selectedEmployee.role} · {selectedEmployee.departmentName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(selectedEmployee.status)}>{selectedEmployee.status}</Badge>
                    <Badge className={getRoleLevelColor(selectedEmployee.roleLevel)}>{selectedEmployee.roleLevel}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#8E939D]">Employee ID</p>
                  <p className="text-[#8E939D]">{selectedEmployee.employeeId}</p>
                </div>
                <div>
                  <p className="text-[#8E939D]">Join Date</p>
                  <p className="text-[#8E939D]">{selectedEmployee.joinDate}</p>
                </div>
                <div>
                  <p className="text-[#8E939D]">Email</p>
                  <p className="text-[#8E939D]">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-[#8E939D]">Phone</p>
                  <p className="text-[#8E939D]">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-[#8E939D]">Manager</p>
                  <p className="text-[#8E939D]">{selectedEmployee.managerName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#8E939D]">Nationality</p>
                  <p className="text-[#8E939D]">{selectedEmployee.nationality}</p>
                </div>
              </div>

              <div className="border-t border-[#00f2ff]/20 pt-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[#8E939D]">Name</p>
                    <p className="text-[#8E939D]">{selectedEmployee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-[#8E939D]">Relationship</p>
                    <p className="text-[#8E939D]">{selectedEmployee.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-[#8E939D]">Phone</p>
                    <p className="text-[#8E939D]">{selectedEmployee.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#00f2ff]/20 pt-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Salary Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[#8E939D]">Basic</p>
                    <p className="text-[#8E939D]">AED {selectedEmployee.salary.basic.toLocaleString()}</p>
                  </div>
                  {selectedEmployee.salary.housing && (
                    <div>
                      <p className="text-[#8E939D]">Housing</p>
                      <p className="text-[#8E939D]">AED {selectedEmployee.salary.housing.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEmployee.salary.transportation && (
                    <div>
                      <p className="text-[#8E939D]">Transport</p>
                      <p className="text-[#8E939D]">AED {selectedEmployee.salary.transportation.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEmployee.salary.other && (
                    <div>
                      <p className="text-[#8E939D]">Other</p>
                      <p className="text-[#8E939D]">AED {selectedEmployee.salary.other.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#8E939D]">Total</p>
                    <p className="text-lg font-bold text-emerald-400">AED {selectedEmployee.salary.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
                <Button variant="outline" className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300">
                  <Clock className="mr-2 h-4 w-4" />
                  Attendance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] group-hover/card:text-[#00f2ff] transition-colors">HEADCOUNT</span>
              <span className="text-sm text-[#8E939D] ml-auto">{activeEmployees}/{totalEmployees}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] group-hover/card:text-[#00f2ff] transition-colors">AVG SALARY</span>
              <span className="text-sm text-[#8E939D] ml-auto">AED {avgSalary.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] group-hover/card:text-[#00f2ff] transition-colors">TRAINING</span>
              <span className="text-sm text-[#8E939D] ml-auto">{upcomingTrainings} upcoming</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] group-hover/card:text-[#00f2ff] transition-colors">TURNOVER</span>
              <span className="text-sm text-[#8E939D] ml-auto">12.5%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}