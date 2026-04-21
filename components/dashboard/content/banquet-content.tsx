"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, Users, Clock, DollarSign, MapPin,
  PartyPopper, Wine, Music, Utensils, Camera,
  Plus, Search, Filter, MoreHorizontal, CheckCircle2,
  AlertCircle, Clock3, ChevronRight, ArrowUpRight,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type EventStatus = "confirmed" | "pending" | "in-progress" | "completed" | "cancelled"
type EventType = "wedding" | "corporate" | "social" | "conference" | "private"

interface BanquetEvent {
  id: string
  name: string
  clientName: string
  type: EventType
  status: EventStatus
  date: string
  startTime: string
  endTime: string
  guests: number
  venue: string
  budget: number
  spent: number
  coordinator: string
  phone: string
  email: string
  specialRequests?: string
}

interface Venue {
  id: string
  name: string
  capacity: number
  currentEvent?: string
  nextEvent?: string
  status: "available" | "occupied" | "setup" | "cleaning"
}

export function BanquetContent() {
  const [activeTab, setActiveTab] = useState("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState<BanquetEvent[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents([
        { 
          id: "1", 
          name: "Johnson Wedding Reception", 
          clientName: "Sarah & Michael Johnson",
          type: "wedding",
          status: "in-progress",
          date: "2024-03-02",
          startTime: "18:00",
          endTime: "23:00",
          guests: 120,
          venue: "Grand Ballroom",
          budget: 25000,
          spent: 18500,
          coordinator: "Emma Wilson",
          phone: "+1 (555) 123-4567",
          email: "sarah.johnson@email.com",
          specialRequests: "Vegetarian menu, DJ until midnight"
        },
        { 
          id: "2", 
          name: "TechCorp Annual Dinner", 
          clientName: "TechCorp Inc.",
          type: "corporate",
          status: "confirmed",
          date: "2024-03-03",
          startTime: "19:00",
          endTime: "22:00",
          guests: 80,
          venue: "Crystal Hall",
          budget: 15000,
          spent: 12000,
          coordinator: "James Mitchell",
          phone: "+1 (555) 987-6543",
          email: "events@techcorp.com"
        },
        { 
          id: "3", 
          name: "Birthday Celebration", 
          clientName: "Robert Chen",
          type: "social",
          status: "pending",
          date: "2024-03-05",
          startTime: "20:00",
          endTime: "01:00",
          guests: 50,
          venue: "Skyline Terrace",
          budget: 8000,
          spent: 0,
          coordinator: "Lisa Park",
          phone: "+1 (555) 456-7890",
          email: "robert.chen@email.com",
          specialRequests: "Live band, champagne tower"
        },
        { 
          id: "4", 
          name: "Medical Conference", 
          clientName: "Health Association",
          type: "conference",
          status: "confirmed",
          date: "2024-03-07",
          startTime: "09:00",
          endTime: "17:00",
          guests: 200,
          venue: "Grand Ballroom",
          budget: 35000,
          spent: 28000,
          coordinator: "David Brown",
          phone: "+1 (555) 234-5678",
          email: "conference@healthassoc.org"
        },
        { 
          id: "5", 
          name: "Private Dinner Party", 
          clientName: "Williams Family",
          type: "private",
          status: "completed",
          date: "2024-03-01",
          startTime: "19:30",
          endTime: "22:30",
          guests: 20,
          venue: "Private Dining Room",
          budget: 5000,
          spent: 4800,
          coordinator: "Anna White",
          phone: "+1 (555) 876-5432",
          email: "williams@email.com"
        },
      ])

      setVenues([
        { id: "1", name: "Grand Ballroom", capacity: 300, currentEvent: "Johnson Wedding", status: "occupied" },
        { id: "2", name: "Crystal Hall", capacity: 150, nextEvent: "TechCorp Dinner", status: "available" },
        { id: "3", name: "Skyline Terrace", capacity: 100, status: "available" },
        { id: "4", name: "Private Dining Room", capacity: 30, status: "cleaning" },
        { id: "5", name: "Garden Pavilion", capacity: 200, status: "setup" },
      ])
      
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "in-progress": return "bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20"
      case "completed": return "bg-slate-500/10 text-[#8E939D] border-slate-500/20"
      case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20"
    }
  }

  const getTypeIcon = (type: EventType) => {
    switch (type) {
      case "wedding": return <PartyPopper className="h-4 w-4" />
      case "corporate": return <Users className="h-4 w-4" />
      case "social": return <Wine className="h-4 w-4" />
      case "conference": return <Calendar className="h-4 w-4" />
      case "private": return <Utensils className="h-4 w-4" />
    }
  }

  const getVenueStatusColor = (status: Venue["status"]) => {
    switch (status) {
      case "available": return "border-emerald-500/30"
      case "occupied": return "border-red-500/30"
      case "setup": return "border-amber-500/30"
      case "cleaning": return "border-[#00f2ff]/30"
    }
  }

  const getVenueStatusBadge = (status: Venue["status"]) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
      case "occupied": return "bg-red-500/10 text-red-400 border-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
      case "setup": return "bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
      case "cleaning": return "bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
    }
  }

  const todayEvents = events.filter(e => e.date === "2024-03-02")
  const upcomingEvents = events.filter(e => e.date > "2024-03-02")
  const totalRevenue = events.reduce((sum, e) => sum + e.spent, 0)
  const pendingEvents = events.filter(e => e.status === "pending").length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <PartyPopper className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            BANQUET & EVENTS <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> EVENT MANAGEMENT
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">Event planning and banquet management</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Calendar className="h-3 w-3 mr-2 text-[#00f2ff]" />
            MAR 02, 2026
          </Button>
          <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            <Plus className="mr-1 h-3 w-3" />
            NEW EVENT
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TODAY'S EVENTS", val: todayEvents.length, icon: Calendar, status: 'info' },
          { label: "TOTAL GUESTS", val: todayEvents.reduce((sum, e) => sum + e.guests, 0), icon: Users, status: 'info' },
          { label: "REVENUE (MTD)", val: `$${(totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign, status: 'good' },
          { label: "PENDING", val: pendingEvents, icon: AlertCircle, status: 'warning' }
        ].map((stat, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{stat.label}</p>
                  <p className={`text-2xl font-bold tracking-tight ${
                    stat.status === 'good' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' :
                    stat.status === 'warning' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
                    'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                  }`}>{stat.val}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${
                  stat.status === 'good' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]' :
                  stat.status === 'warning' ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]' :
                  'text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]'
                } opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Venue Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {venues.map((venue) => (
          <Card key={venue.id} className={`bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] transition-all group relative overflow-hidden ${getVenueStatusColor(venue.status)}`}>
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{venue.name}</span>
                <Badge className={`text-[8px] uppercase tracking-widest ${getVenueStatusBadge(venue.status)}`}>
                  {venue.status}
                </Badge>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{`CAPACITY: ${venue.capacity}`}</p>
              {venue.currentEvent && (
                <p className="text-[9px] text-[#00f2ff] mt-1 truncate font-bold">{`NOW: ${venue.currentEvent}`}</p>
              )}
              {venue.nextEvent && (
                <p className="text-[9px] text-[#5C6270] mt-1 truncate">{`NEXT: ${venue.nextEvent}`}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1">
          <TabsTrigger 
            value="today" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]"
          >
            TODAY'S EVENTS
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]"
          >
            UPCOMING
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]"
          >
            ALL EVENTS
          </TabsTrigger>
          <TabsTrigger 
            value="venues" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]"
          >
            VENUES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">MARCH 2, 2024</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 w-48 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[10px] font-bold uppercase tracking-widest placeholder:text-[8px] placeholder:tracking-widest"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10">
                  <Filter className="mr-1 h-3 w-3" />
                  FILTER
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {isLoading ? (
                  <>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-[#00f2ff]/5 rounded-xl animate-pulse" />
                    ))}
                  </>
                ) : todayEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-[#5C6270] opacity-50" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270]">No events scheduled for today</p>
                  </div>
                ) : (
                  <>
                    {todayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 hover:shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all group">
                        <div className={`p-2 rounded-lg ${getStatusColor(event.status)}`}>
                          {getTypeIcon(event.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{event.name}</h3>
                            <Badge className={`${getStatusColor(event.status)} text-[8px] uppercase tracking-widest border-0 shadow-[0_0_8px_rgba(0,242,255,0.1)]`}>
                              {event.status}
                            </Badge>
                            {event.type === "wedding" && (
                              <Badge className="bg-pink-500/10 text-pink-400 border-0 text-[8px] uppercase tracking-widest shadow-[0_0_8px_rgba(236,72,153,0.2)]">
                                WEDDING
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                              <Clock className="h-3 w-3 text-[#00f2ff]" />
                              <span>{event.startTime} - {event.endTime}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                              <MapPin className="h-3 w-3 text-[#00f2ff]" />
                              <span>{event.venue}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                              <Users className="h-3 w-3 text-[#00f2ff]" />
                              <span>{event.guests} GUESTS</span>
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                              <DollarSign className="h-3 w-3 text-[#00f2ff]" />
                              <span>${event.spent.toLocaleString()} / ${event.budget.toLocaleString()}</span>
                            </span>
                          </div>
  
                          {event.specialRequests && (
                            <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400 mt-2 drop-shadow-[0_0_5px_rgba(251,191,36,0.25)]">
                              ⚡ {event.specialRequests}
                            </p>
                          )}
                        </div>
  
                        <div className="text-right min-w-[100px]">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <Avatar className="h-6 w-6 border border-[#00f2ff]/30">
                              <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[8px] font-bold">
                                {event.coordinator.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">{event.coordinator}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] h-7">
                            DETAILS <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">UPCOMING EVENTS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group">
                    <div className="text-center min-w-[50px]">
                      <div className="text-lg font-bold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    
                    <div className={`p-2 rounded-lg ${getStatusColor(event.status)}`}>
                      {getTypeIcon(event.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{event.name}</h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{event.clientName}</p>
                    </div>
  
                    <div className="text-right">
                      <Badge className={`${getStatusColor(event.status)} text-[8px] uppercase tracking-widest border-0`}>
                        {event.status}
                      </Badge>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-1">{event.guests} GUESTS</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 p-8 text-center">
            <Calendar className="h-12 w-12 text-[#5C6270] mx-auto mb-4" />
            <h3 className="text-lg font-bold uppercase tracking-widest text-[#8E939D]">All Events</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-2">Full event list with advanced filtering coming soon</p>
          </Card>
        </TabsContent>

        <TabsContent value="venues">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 p-8 text-center">
            <MapPin className="h-12 w-12 text-[#5C6270] mx-auto mb-4" />
            <h3 className="text-lg font-bold uppercase tracking-widest text-[#8E939D]">Venue Management</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-2">Detailed venue configuration and pricing coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">Event Types</p>
                <div className="flex items-center gap-6 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">{events.filter(e => e.type === "wedding").length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">WEDDINGS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">{events.filter(e => e.type === "corporate").length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">CORPORATE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">{events.filter(e => e.type === "social").length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">SOCIAL</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">Occupancy Rate</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">78%</p>
                  <ArrowUpRight className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]" />
                </div>
                <Progress value={78} className="mt-2 h-1 bg-[#00f2ff]/20 [&>div]:bg-[#00f2ff] [&>div]:shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">Avg Event Value</p>
                <p className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                  {`$${events.length > 0 ? Math.round(events.reduce((sum, e) => sum + e.budget, 0) / events.length).toLocaleString() : "0"}`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-400/50 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}