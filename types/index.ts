export interface DashboardStats {
  attentionNeeded: number
  onTrack: number
  critical: number
  normal: number
  several: number
}

export interface DepartmentSummary {
  id: string
  name: string
  code: string
  color: string
  icon: string
  stats: {
    onTrack?: boolean
    linenInventory?: number
    turndownService?: number
    deepCleaning?: number
    staffUtilization?: number
    openWorkOrders?: number
    criticalIssues?: number
    avgResponseTime?: string
    equipmentHealth?: number
    activeOrders?: number
    delayedOrders?: number
    tablesOccupied?: number
    inventoryAlerts?: number
    incidents?: number
    urgentCases?: number
    camerasOffline?: number
    accessViolations?: number
  }
}

export interface Task {
  id: string
  title: string
  description?: string
  type: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'IN_PROGRESS' | 'URGENT' | 'READY' | 'CLOSED'
  location: string
  locationType: string
  department: {
    id: string
    name: string
    code: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  dueAt?: string
  isVip: boolean
  guestName?: string
  escalationLevel: number
  slaBreached: boolean
}

export interface InventoryAlert {
  id: string
  sku: string
  name: string
  category: string
  currentStock: number
  minStock: number
  department: {
    name: string
    code: string
  }
  alertStatus: 'NORMAL' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK'
}

export interface GuestSentiment {
  averageRating: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  totalReviews: number
  keywordClusters: {
    positive: string[]
    negative: string[]
  }
  aiInsight: string
}

export interface RealTimeEvent {
  id: string
  type: 'task' | 'incident' | 'inventory' | 'guest' | 'system'
  message: string
  timestamp: string
  department?: string
  priority?: string
}

export interface WorkloadData {
  department: string
  percentage: number
  count: number
  color: string
}

export interface WeeklyTrend {
  day: string
  tasks: number
  completed: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: {
    id: string
    name: string
    level: number
  }
  department?: {
    id: string
    name: string
    code: string
  }
  isActive: boolean
  lastLoginAt?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  message: string
  code: string
  status: number
}