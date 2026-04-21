"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  ChefHat, Flame, Clock, AlertCircle, CheckCircle2,
  Thermometer, Utensils, Package, AlertTriangle,
  Plus, Search, Filter, Timer, TrendingUp,
  ArrowUpRight, ArrowDownRight, Users, Receipt,
  Settings, X, Printer, Camera, ThumbsUp, ThumbsDown,
  Pizza, Coffee, Wine, Beer, Cake, Salad,
  Fish, Beef, Egg, Refrigerator, Zap, Gauge,
  Bell
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

type OrderStatus = "pending" | "preparing" | "ready" | "hold" | "completed" | "cancelled"
type Station = "grill" | "fry" | "salad" | "dessert" | "pantry" | "pizza" | "pasta"
type Priority = "low" | "medium" | "high" | "rush"
type OutletType = "fine-dining" | "buffet" | "casual" | "beach" | "bar" | "room-service" | "banquet"

interface KitchenOrder {
  id: string
  ticketNumber: string
  source: string
  sourceType: OutletType
  roomNumber?: string
  guestName: string
  guestId?: string
  isVip: boolean
  vipLevel?: "platinum" | "gold" | "silver"
  items: KitchenItem[]
  status: OrderStatus
  station: Station
  orderTime: string
  priority: Priority
  notes?: string
  startedAt?: string
  completedAt?: string
  estimatedTime: number
  elapsedTime: number
  targetTime: string
  stationAssigned?: string
  chefAssigned?: string
  allergy?: string[]
  eventName?: string
  guestsCount?: number
}

interface KitchenItem {
  id: string
  name: string
  quantity: number
  modifiers?: string[]
  station: Station
  recipeId?: string
  prepTime?: number
  special?: string
}

interface StationStatus {
  id: string
  name: Station
  displayName: string
  activeOrders: number
  avgTime: number
  temperature?: number
  staff: number
  status: "normal" | "busy" | "overloaded"
  capacity: number
  orders: KitchenOrder[]
}

interface Outlet {
  id: string
  name: string
  type: OutletType
  active: boolean
  kitchenType: "shared" | "independent"
  stations: Station[]
}

interface Recipe {
  id: string
  name: string
  category: string
  outlet: string
  sellingPrice: number
  costPrice: number
  margin: number
  prepTime: number
  station: Station
  ingredients: Ingredient[]
  instructions: string
}

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
}

interface WasteLog {
  id: string
  itemName: string
  quantity: number
  reason: "overcooked" | "expired" | "returned" | "damaged"
  date: string
  chef: string
  approved: boolean
  photo?: string
}

export function KitchenContent() {
  const [activeTab, setActiveTab] = useState("live")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all")
  const [selectedStation, setSelectedStation] = useState<Station | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [stations, setStations] = useState<StationStatus[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal States
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [isWasteLogOpen, setIsWasteLogOpen] = useState(false)
  const [isRecipeOpen, setIsRecipeOpen] = useState(false)
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false)
  const [emergencyReason, setEmergencyReason] = useState("")

  const { config, loading: configLoading } = useHotelConfig()

  // Load data based on hotel config
  useEffect(() => {
    setTimeout(() => {
      // Generate outlets from config
      const configuredOutlets: Outlet[] = [
        { id: "1", name: "Main Restaurant", type: "fine-dining", active: true, kitchenType: "independent", stations: ["grill", "fry", "salad", "dessert", "pantry"] },
        { id: "2", name: "Italian Restaurant", type: "fine-dining", active: true, kitchenType: "independent", stations: ["pasta", "pizza", "grill", "dessert"] },
        { id: "3", name: "Asian Restaurant", type: "fine-dining", active: true, kitchenType: "shared", stations: ["grill", "fry", "pantry"] },
        { id: "4", name: "Beach Restaurant", type: "beach", active: true, kitchenType: "independent", stations: ["grill", "fry", "salad"] },
        { id: "5", name: "Room Service", type: "room-service", active: true, kitchenType: "shared", stations: ["pantry", "grill", "fry", "salad", "dessert"] },
        { id: "6", name: "Banquet Hall", type: "banquet", active: true, kitchenType: "independent", stations: ["grill", "fry", "salad", "dessert", "pantry"] }
      ]
      setOutlets(configuredOutlets)

      // Generate orders from all outlets
      const generatedOrders: KitchenOrder[] = [
        // Main Restaurant Orders
        {
          id: "1",
          ticketNumber: "K2045",
          source: "Main Restaurant",
          sourceType: "fine-dining",
          roomNumber: "1205",
          guestName: "Mr. Anderson",
          isVip: true,
          vipLevel: "platinum",
          items: [
            { id: "i1", name: "Grilled Ribeye", quantity: 1, modifiers: ["Medium rare", "No sauce"], station: "grill", prepTime: 18 },
            { id: "i2", name: "Truffle Fries", quantity: 1, station: "fry", prepTime: 8 }
          ],
          status: "preparing",
          station: "grill",
          orderTime: "12:30",
          priority: "rush",
          notes: "VIP guest - priority",
          startedAt: "12:32",
          estimatedTime: 18,
          elapsedTime: 8,
          targetTime: "12:48",
          chefAssigned: "Chef Maria",
          allergy: ["Nuts"]
        },
        {
          id: "2",
          ticketNumber: "K2046",
          source: "Main Restaurant",
          sourceType: "fine-dining",
          roomNumber: "808",
          guestName: "Ms. Johnson",
          isVip: false,
          items: [
            { id: "i3", name: "Caesar Salad", quantity: 1, modifiers: ["Extra croutons"], station: "salad", prepTime: 6 },
            { id: "i4", name: "Soup of the Day", quantity: 1, station: "pantry", prepTime: 8 }
          ],
          status: "pending",
          station: "salad",
          orderTime: "12:35",
          priority: "medium",
          estimatedTime: 14,
          elapsedTime: 5,
          targetTime: "12:49"
        },
        
        // Italian Restaurant Orders
        {
          id: "3",
          ticketNumber: "I2047",
          source: "Italian Restaurant",
          sourceType: "fine-dining",
          roomNumber: "1502",
          guestName: "Dr. Smith",
          isVip: true,
          vipLevel: "gold",
          items: [
            { id: "i5", name: "Spaghetti Carbonara", quantity: 1, station: "pasta", prepTime: 12 },
            { id: "i6", name: "Margherita Pizza", quantity: 1, modifiers: ["Extra cheese"], station: "pizza", prepTime: 15 },
            { id: "i7", name: "Tiramisu", quantity: 1, station: "dessert", prepTime: 5 }
          ],
          status: "preparing",
          station: "pasta",
          orderTime: "12:28",
          priority: "high",
          startedAt: "12:30",
          estimatedTime: 32,
          elapsedTime: 12,
          targetTime: "13:00",
          chefAssigned: "Chef Giovanni"
        },
        
        // Beach Restaurant Orders
        {
          id: "4",
          ticketNumber: "B2048",
          source: "Beach Restaurant",
          sourceType: "beach",
          guestName: "Family Chen",
          isVip: false,
          items: [
            { id: "i8", name: "Grilled Fish", quantity: 2, station: "grill", prepTime: 15 },
            { id: "i9", name: "Beach Fries", quantity: 2, station: "fry", prepTime: 8 },
            { id: "i10", name: "Fresh Coconut", quantity: 2, station: "pantry", prepTime: 3 }
          ],
          status: "ready",
          station: "grill",
          orderTime: "12:25",
          priority: "medium",
          startedAt: "12:27",
          estimatedTime: 26,
          elapsedTime: 18,
          targetTime: "12:51",
          completedAt: "12:43"
        },
        
        // Room Service Orders
        {
          id: "5",
          ticketNumber: "RS2049",
          source: "Room Service",
          sourceType: "room-service",
          roomNumber: "2101",
          guestName: "Mr. Williams",
          isVip: true,
          vipLevel: "silver",
          items: [
            { id: "i11", name: "Club Sandwich", quantity: 2, station: "pantry", prepTime: 10 },
            { id: "i12", name: "Caesar Salad", quantity: 1, station: "salad", prepTime: 6 },
            { id: "i13", name: "Fresh Juice", quantity: 2, station: "pantry", prepTime: 3 }
          ],
          status: "pending",
          station: "pantry",
          orderTime: "12:40",
          priority: "high",
          estimatedTime: 19,
          elapsedTime: 0,
          targetTime: "12:59",
          notes: "VIP guest - priority delivery"
        },
        
        // Banquet Order
        {
          id: "6",
          ticketNumber: "BN2050",
          source: "Banquet Hall",
          sourceType: "banquet",
          guestName: "Wedding - Smith/Johnson",
          isVip: true,
          items: [
            { id: "i14", name: "Beef Wellington", quantity: 85, station: "grill", prepTime: 25 },
            { id: "i15", name: "Grilled Salmon", quantity: 65, station: "grill", prepTime: 18 },
            { id: "i16", name: "Vegetable Medley", quantity: 150, station: "pantry", prepTime: 15 },
            { id: "i17", name: "Wedding Cake", quantity: 1, station: "dessert", prepTime: 60 }
          ],
          status: "preparing",
          station: "grill",
          orderTime: "11:00",
          priority: "high",
          startedAt: "11:30",
          estimatedTime: 120,
          elapsedTime: 90,
          targetTime: "13:00",
          eventName: "Smith-Johnson Wedding",
          guestsCount: 150
        }
      ]
      setOrders(generatedOrders)

      // Calculate station statuses
      const stationMap = new Map<Station, KitchenOrder[]>()
      generatedOrders.forEach(order => {
        if (!stationMap.has(order.station)) {
          stationMap.set(order.station, [])
        }
        stationMap.get(order.station)?.push(order)
      })

      const stationStatuses: StationStatus[] = [
        { id: "s1", name: "grill", displayName: "Grill Station", activeOrders: stationMap.get("grill")?.filter(o => o.status !== "completed" && o.status !== "ready").length || 0, avgTime: 16, temperature: 450, staff: 3, status: "busy", capacity: 5, orders: stationMap.get("grill") || [] },
        { id: "s2", name: "fry", displayName: "Fry Station", activeOrders: stationMap.get("fry")?.filter(o => o.status !== "completed").length || 0, avgTime: 8, temperature: 375, staff: 2, status: "normal", capacity: 4, orders: stationMap.get("fry") || [] },
        { id: "s3", name: "salad", displayName: "Cold Prep", activeOrders: stationMap.get("salad")?.filter(o => o.status !== "completed").length || 0, avgTime: 6, temperature: 38, staff: 2, status: "normal", capacity: 4, orders: stationMap.get("salad") || [] },
        { id: "s4", name: "dessert", displayName: "Dessert", activeOrders: stationMap.get("dessert")?.filter(o => o.status !== "completed").length || 0, avgTime: 5, temperature: 35, staff: 2, status: "normal", capacity: 4, orders: stationMap.get("dessert") || [] },
        { id: "s5", name: "pantry", displayName: "Pantry", activeOrders: stationMap.get("pantry")?.filter(o => o.status !== "completed").length || 0, avgTime: 7, temperature: 40, staff: 3, status: "normal", capacity: 6, orders: stationMap.get("pantry") || [] },
        { id: "s6", name: "pasta", displayName: "Pasta Station", activeOrders: stationMap.get("pasta")?.filter(o => o.status !== "completed").length || 0, avgTime: 12, temperature: 85, staff: 2, status: "normal", capacity: 3, orders: stationMap.get("pasta") || [] },
        { id: "s7", name: "pizza", displayName: "Pizza Station", activeOrders: stationMap.get("pizza")?.filter(o => o.status !== "completed").length || 0, avgTime: 15, temperature: 550, staff: 2, status: "normal", capacity: 3, orders: stationMap.get("pizza") || [] }
      ]
      setStations(stationStatuses)

      // Sample recipes
      setRecipes([
        { id: "r1", name: "Grilled Ribeye", category: "Main", outlet: "Main Restaurant", sellingPrice: 42, costPrice: 18, margin: 57, prepTime: 18, station: "grill", ingredients: [{ id: "ing1", name: "Ribeye", quantity: 250, unit: "g", cost: 15 }], instructions: "Season and grill to order" }
      ])

      setIsLoading(false)
    }, 500)
  }, [])

  // Calculate KPIs
  const activeOrders = useMemo(() => 
    orders.filter(o => !["completed", "cancelled"].includes(o.status)), 
    [orders]
  )
  
  const delayedOrders = useMemo(() => 
    activeOrders.filter(o => {
      const now = new Date()
      const target = new Date(`1970/01/01 ${o.targetTime}`).getTime()
      const current = now.getTime()
      return current > target
    }),
    [activeOrders]
  )

  const completedToday = orders.filter(o => o.status === "completed" || o.status === "ready").length
  const avgPrepTime = useMemo(() => {
    const completed = orders.filter(o => o.completedAt && o.startedAt)
    if (completed.length === 0) return 12
    const total = completed.reduce((sum, o) => sum + o.elapsedTime, 0)
    return Math.round(total / completed.length)
  }, [orders])

  const foodCost = 28.5
  const wasteToday = 3.2

  // Filter orders by outlet and station
  const filteredOrders = useMemo(() => {
    let filtered = orders
    
    if (selectedOutlet !== "all") {
      filtered = filtered.filter(o => o.source === selectedOutlet)
    }
    
    if (selectedStation !== "all") {
      filtered = filtered.filter(o => o.station === selectedStation)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.roomNumber && o.roomNumber.includes(searchQuery))
      )
    }
    
    return filtered
  }, [orders, selectedOutlet, selectedStation, searchQuery])

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "preparing": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "ready": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "hold": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "completed": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
      case "cancelled": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "low": return "bg-slate-500/10 text-[#8E939D]"
      case "medium": return "bg-blue-500/10 text-blue-400"
      case "high": return "bg-amber-500/10 text-amber-400"
      case "rush": return "bg-red-500/10 text-red-400 animate-pulse"
    }
  }

  const getStationStatusColor = (status: StationStatus["status"]) => {
    switch (status) {
      case "normal": return "bg-emerald-500/20 border-emerald-500/30"
      case "busy": return "bg-amber-500/20 border-amber-500/30"
      case "overloaded": return "bg-red-500/20 border-red-500/30"
    }
  }

  const getOutletIcon = (type: OutletType) => {
    switch (type) {
      case "fine-dining": return <Utensils className="h-4 w-4" />
      case "buffet": return <Coffee className="h-4 w-4" />
      case "casual": return <Beer className="h-4 w-4" />
      case "beach": return <Fish className="h-4 w-4" />
      case "bar": return <Wine className="h-4 w-4" />
      case "room-service": return <Bell className="h-4 w-4" />
      case "banquet": return <Users className="h-4 w-4" />
    }
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { 
              ...order, 
              status: newStatus,
              completedAt: newStatus === "completed" || newStatus === "ready" ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : order.completedAt
            }
          : order
      )
    )
  }

  const handleEmergencyMode = () => {
    // Create emergency incident
    const incident = {
      id: `EM-${Date.now()}`,
      reason: emergencyReason,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }
    
    // In real app, this would trigger alerts to GM, F&B Director
    console.log("Emergency mode activated:", incident)
    
    setIsEmergencyOpen(false)
    setEmergencyReason("")
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#8E939D] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <ChefHat className="h-6 w-6 text-orange-400" />
            </div>
            Kitchen Command Center
          </h1>
          <p className="text-sm text-[#8E939D] mt-1">
            {outlets.filter(o => o.active).length} active outlets · {activeOrders.length} active orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-[#00f2ff]/20 bg-[#00f2ff]/5 hover:bg-slate-700 text-slate-300"
            onClick={() => setIsEmergencyOpen(true)}
          >
            <AlertCircle className="mr-2 h-4 w-4 text-red-400" />
            Emergency Mode
          </Button>
          <Dialog open={isRecipeOpen} onOpenChange={setIsRecipeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#00f2ff]/20 bg-[#00f2ff]/5 hover:bg-slate-700 text-slate-300">
                <Settings className="mr-2 h-4 w-4" />
                Recipes
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Recipe Management</DialogTitle>
              </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-[#8E939D]">{recipe.name}</h3>
                        <Badge className="bg-blue-600/20 text-blue-400">{recipe.category}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-[#5C6270]">Selling Price</span>
                          <p className="text-slate-300">${recipe.sellingPrice}</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">Cost Price</span>
                          <p className="text-slate-300">${recipe.costPrice}</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">Margin</span>
                          <p className="text-emerald-400">{recipe.margin}%</p>
                        </div>
                      </div>
                      <div className="text-xs text-[#8E939D]">
                        <p className="mb-1">Ingredients:</p>
                        {recipe.ingredients.map(ing => (
                          <div key={ing.id} className="flex items-center gap-2 ml-2">
                            <span>• {ing.name}: {ing.quantity}{ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-[#8E939D]">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#8E939D]">Create Kitchen Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-[#8E939D]">Ticket creation form would go here</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Emergency Mode Dialog */}
      <Dialog open={isEmergencyOpen} onOpenChange={setIsEmergencyOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Emergency Mode Activation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-300">
              This will alert GM, F&B Director, and create an incident report.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-300">Emergency Reason</Label>
              <Select value={emergencyReason} onValueChange={setEmergencyReason}>
                <SelectTrigger className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                  <SelectItem value="fire">Fire Alarm</SelectItem>
                  <SelectItem value="power">Power Failure</SelectItem>
                  <SelectItem value="delay">Major Delay</SelectItem>
                  <SelectItem value="vip">VIP Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                onClick={() => setIsEmergencyOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-[#8E939D]"
                onClick={handleEmergencyMode}
                disabled={!emergencyReason}
              >
                Activate Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Order Monitor - Top */}
      <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {outlets.filter(o => o.active).map(outlet => {
              const outletOrders = activeOrders.filter(o => o.source === outlet.name)
              return (
                <div key={outlet.id} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getOutletIcon(outlet.type)}
                    <span className="text-xs text-[#8E939D]">{outlet.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-[#8E939D]">{outletOrders.length}</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-[#5C6270]">
                      {outletOrders.filter(o => o.status === "preparing").length}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-[#5C6270]">
                      {outletOrders.filter(o => o.status === "ready").length}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
          <CardContent className="p-4">
            <p className="text-xs text-[#5C6270]">Avg Prep Time</p>
            <p className="text-2xl font-bold text-blue-400">{avgPrepTime}m</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
              <ArrowDownRight className="h-3 w-3" />
              -1.2m vs target
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
          <CardContent className="p-4">
            <p className="text-xs text-[#5C6270]">Orders Delayed</p>
            <p className="text-2xl font-bold text-amber-400">{delayedOrders.length}</p>
            <p className="text-xs text-[#8E939D] mt-1">{Math.round(delayedOrders.length / activeOrders.length * 100)}% of active</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
          <CardContent className="p-4">
            <p className="text-xs text-[#5C6270]">Top Selling</p>
            <p className="text-lg font-bold text-[#8E939D] truncate">Grilled Ribeye</p>
            <p className="text-xs text-[#8E939D] mt-1">24 orders today</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
          <CardContent className="p-4">
            <p className="text-xs text-[#5C6270]">Food Cost %</p>
            <p className="text-2xl font-bold text-emerald-400">{foodCost}%</p>
            <p className="text-xs text-[#8E939D] mt-1">Target: 28%</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
          <CardContent className="p-4">
            <p className="text-xs text-[#5C6270]">Waste Today</p>
            <p className="text-2xl font-bold text-amber-400">{wasteToday}%</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
              <ArrowUpRight className="h-3 w-3" />
              +0.5% vs yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 flex-wrap">
          <TabsTrigger value="live" className="data-[state=active]:bg-slate-700">
            Live Orders
          </TabsTrigger>
          <TabsTrigger value="stations" className="data-[state=active]:bg-slate-700">
            Stations
          </TabsTrigger>
          <TabsTrigger value="prep" className="data-[state=active]:bg-slate-700">
            Prep List
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="waste" className="data-[state=active]:bg-slate-700">
            Waste
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-[200px] bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectValue placeholder="All Outlets" />
              </SelectTrigger>
              <SelectContent className="bg-[#00f2ff]/10 border-[#00f2ff]/20">
                <SelectItem value="all">All Outlets</SelectItem>
                {outlets.filter(o => o.active).map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.name}>{outlet.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-[#00f2ff]/5 rounded-lg p-1 border border-[#00f2ff]/15">
              <button
                onClick={() => setSelectedStation("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                  selectedStation === "all"
                    ? "bg-slate-700 text-[#8E939D]"
                    : "text-[#8E939D] hover:text-[#8E939D]"
                }`}
              >
                All Stations
              </button>
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station.name)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    selectedStation === station.name
                      ? "bg-slate-700 text-[#8E939D]"
                      : "text-[#8E939D] hover:text-[#8E939D]"
                  }`}
                >
                  {station.displayName}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270]" />
              <Input
                placeholder="Search ticket or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#00f2ff]/5 border-[#00f2ff]/20"
              />
            </div>
          </div>

          {/* Live Order Grid - Kitchen Display System */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders
              .filter(o => !["completed", "cancelled"].includes(o.status))
              .sort((a, b) => {
                // Rush orders first, then by priority
                if (a.priority === "rush") return -1
                if (b.priority === "rush") return 1
                if (a.priority === "high") return -1
                if (b.priority === "high") return 1
                return 0
              })
              .map((order) => (
                <Card 
                  key={order.id} 
                  className={`bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 cursor-pointer hover:border-orange-500/50 transition-all ${
                    order.priority === "rush" ? "ring-2 ring-red-500/50" : ""
                  }`}
                  onClick={() => {
                    setSelectedOrder(order)
                    setIsOrderDetailOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#8E939D]">#{order.ticketNumber}</span>
                          <Badge className={`${getPriorityColor(order.priority)} uppercase text-xs`}>
                            {order.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-[#8E939D]">{order.source}</span>
                          {order.roomNumber && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-[#8E939D]">Room {order.roomNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(order.status)} capitalize`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-[#00f2ff]/5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#8E939D]" />
                        <span className="text-xs text-[#8E939D]">Ordered: {order.orderTime}</span>
                      </div>
                      <div className={`text-lg font-mono font-bold ${
                        order.elapsedTime > order.estimatedTime ? "text-red-400" : "text-[#8E939D]"
                      }`}>
                        {order.elapsedTime}/{order.estimatedTime}m
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-sm font-medium text-[#8E939D] min-w-[20px]">{item.quantity}x</span>
                          <div className="flex-1">
                            <span className="text-sm text-[#8E939D]">{item.name}</span>
                            {item.modifiers && (
                              <p className="text-xs text-amber-400 mt-0.5">
                                {item.modifiers.join(", ")}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300 capitalize">
                            {item.station}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Allergies */}
                    {order.allergy && order.allergy.length > 0 && (
                      <div className="mb-3 p-1.5 rounded-lg bg-red-950/20 border border-red-500/30">
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Allergy: {order.allergy.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div className="mb-3 p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                        <p className="text-xs text-amber-400">{order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {order.status === "pending" && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateOrderStatus(order.id, "preparing")
                          }}
                        >
                          <Flame className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-[#8E939D]"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateOrderStatus(order.id, "ready")
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Ready
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-[#8E939D]"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateOrderStatus(order.id, "completed")
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#00f2ff]/20 bg-[#00f2ff]/5 text-slate-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateOrderStatus(order.id, "hold")
                        }}
                      >
                        Hold
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-[#00f2ff]/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            order.elapsedTime > order.estimatedTime 
                              ? "bg-red-500" 
                              : order.elapsedTime > order.estimatedTime * 0.8 
                                ? "bg-amber-500" 
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${(order.elapsedTime / order.estimatedTime) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="stations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map(station => (
              <Card key={station.id} className={`bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 ${getStationStatusColor(station.status)}`}>
                <CardHeader>
                  <CardTitle className="text-[#8E939D] flex items-center justify-between">
                    <span>{station.displayName}</span>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-[#8E939D]" />
                      <span className="text-sm font-normal">{station.activeOrders}/{station.capacity}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {station.temperature && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8E939D]">Temperature</span>
                        <span className="text-slate-300">{station.temperature}°F</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8E939D]">Staff</span>
                      <span className="text-slate-300">{station.staff} chefs</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8E939D]">Avg Prep Time</span>
                      <span className="text-slate-300">{station.avgTime}m</span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-slate-300 mt-2">Current Orders</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {station.orders
                        .filter(o => !["completed", "cancelled"].includes(o.status))
                        .map(order => (
                          <div key={order.id} className="p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[#8E939D]">#{order.ticketNumber}</span>
                              <Badge className={`${getPriorityColor(order.priority)} text-xs`}>
                                {order.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#8E939D]">{order.guestName}</span>
                              <span className={`${order.elapsedTime > order.estimatedTime ? "text-red-400" : "text-[#8E939D]"}`}>
                                {order.elapsedTime}/{order.estimatedTime}m
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prep">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Daily Prep List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Grill Station", "Fry Station", "Cold Prep", "Dessert", "Pantry"].map(station => (
                  <div key={station} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                    <h4 className="font-medium text-[#8E939D] mb-2">{station}</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-[#8E939D]">Ribeye</span>
                        <p className="text-slate-300">8 portions</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">Salmon</span>
                        <p className="text-slate-300">12 portions</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">Chicken</span>
                        <p className="text-slate-300">15 portions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">Salmon - 2 portions left</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-amber-400">Ribeye - 8 portions left</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-amber-400">Lobster - 5 portions left</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
              <CardHeader>
                <CardTitle className="text-[#8E939D]">Today's Waste Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#8E939D]">Grilled Salmon</span>
                      <Badge className="bg-amber-600/20 text-amber-400">2 portions</Badge>
                    </div>
                    <p className="text-xs text-[#8E939D]">Reason: Overcooked • Chef: Maria G.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#8E939D]">Caesar Salad</span>
                      <Badge className="bg-amber-600/20 text-amber-400">1 portion</Badge>
                    </div>
                    <p className="text-xs text-[#8E939D]">Reason: Returned • Chef: John D.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
              <CardHeader>
                <CardTitle className="text-[#8E939D]">Log Waste</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => setIsWasteLogOpen(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Log Waste Item
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Chef Performance Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Chef Maria G.", speed: 98, errors: 1, waste: 2, orders: 45, rating: 4.9 },
                  { name: "Chef Giovanni", speed: 92, errors: 2, waste: 3, orders: 38, rating: 4.7 },
                  { name: "Chef John D.", speed: 88, errors: 3, waste: 4, orders: 42, rating: 4.5 },
                  { name: "Chef Lisa W.", speed: 94, errors: 1, waste: 1, orders: 36, rating: 4.8 }
                ].map((chef, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                    <div className="w-6 text-center">
                      {idx === 0 && <span className="text-yellow-400">🥇</span>}
                      {idx === 1 && <span className="text-[#8E939D]">🥈</span>}
                      {idx === 2 && <span className="text-amber-600">🥉</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-[#8E939D]">{chef.name}</h4>
                        <Badge className="bg-emerald-600/20 text-emerald-400">{chef.rating} ★</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-[#5C6270]">Speed</span>
                          <p className="text-slate-300">{chef.speed}%</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">Errors</span>
                          <p className="text-slate-300">{chef.errors}</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">Waste</span>
                          <p className="text-slate-300">{chef.waste}%</p>
                        </div>
                        <div>
                          <span className="text-[#5C6270]">Orders</span>
                          <p className="text-slate-300">{chef.orders}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#8E939D] flex items-center gap-2">
              Ticket #{selectedOrder?.ticketNumber}
              {selectedOrder?.isVip && (
                <Badge className="bg-yellow-500/20 text-yellow-400">VIP</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                <div>
                  <p className="text-xs text-[#5C6270]">Source</p>
                  <p className="text-sm font-medium text-[#8E939D]">{selectedOrder.source}</p>
                </div>
                <div>
                  <p className="text-xs text-[#5C6270]">Guest</p>
                  <p className="text-sm font-medium text-[#8E939D]">{selectedOrder.guestName}</p>
                </div>
                {selectedOrder.roomNumber && (
                  <div>
                    <p className="text-xs text-[#5C6270]">Room</p>
                    <p className="text-sm font-medium text-[#8E939D]">{selectedOrder.roomNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#5C6270]">Order Time</p>
                  <p className="text-sm font-medium text-[#8E939D]">{selectedOrder.orderTime}</p>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <span className="text-sm text-[#8E939D]">{item.quantity}x {item.name}</span>
                        {item.modifiers && (
                          <p className="text-xs text-amber-400 mt-0.5">
                            {item.modifiers.join(", ")}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-slate-600">
                        {item.station}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Preparation Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#5C6270]">Started</div>
                    <div className="flex-1 text-sm text-slate-300">{selectedOrder.startedAt || "Not started"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#5C6270]">Target</div>
                    <div className="flex-1 text-sm text-slate-300">{selectedOrder.targetTime}</div>
                  </div>
                  {selectedOrder.completedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-20 text-xs text-[#5C6270]">Completed</div>
                      <div className="flex-1 text-sm text-slate-300">{selectedOrder.completedAt}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedOrder.status === "pending" && (
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "preparing")
                      setIsOrderDetailOpen(false)
                    }}
                  >
                    <Flame className="mr-2 h-4 w-4" />
                    Start Cooking
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "ready")
                      setIsOrderDetailOpen(false)
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Ready
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#00f2ff]/20 bg-[#00f2ff]/10 text-slate-300"
                  onClick={() => setIsOrderDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Waste Log Dialog */}
      <Dialog open={isWasteLogOpen} onOpenChange={setIsWasteLogOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/20 text-[#8E939D]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#8E939D]">Log Waste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-[#8E939D]">Waste logging form would go here</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}