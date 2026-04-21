"use client"

import { useState, useEffect } from "react"
import { 
  Shield, ShieldAlert, ShieldCheck, Camera, MapPin,
  Bell, Users, Clock, AlertTriangle, CheckCircle2,
  Phone, Radio, Eye, EyeOff, Scan, Fingerprint, Flame,
  Plus, Search, Filter, TrendingUp, ArrowUpRight,
  Activity, FileText, Siren, DoorOpen, Car, Crown, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type IncidentStatus = "active" | "resolved" | "investigating" | "false-alarm"
type IncidentType = "intrusion" | "fire" | "medical" | "disturbance" | "theft" | "safety"
type PatrolStatus = "on-duty" | "off-duty" | "break" | "emergency"

interface SecurityIncident {
  id: string
  type: IncidentType
  status: IncidentStatus
  location: string
  reportedAt: string
  resolvedAt?: string
  description: string
  reportedBy: string
  assignedTo?: string
  priority: "low" | "medium" | "high" | "critical"
  notes?: string
}

interface SecurityOfficer {
  id: string
  name: string
  badge: string
  status: PatrolStatus
  location: string
  phone: string
  shift: string
  lastCheckIn: string
  incidentsHandled: number
}

interface CameraFeed {
  id: string
  name: string
  location: string
  status: "online" | "offline" | "maintenance"
  isRecording: boolean
  lastMotion?: string
}

interface AccessLog {
  id: string
  personName: string
  type: "guest" | "staff" | "visitor" | "delivery"
  location: string
  action: "entry" | "exit"
  timestamp: string
  method: "keycard" | "biometric" | "manual"
}

export function SecurityContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [officers, setOfficers] = useState<SecurityOfficer[]>([])
  const [cameras, setCameras] = useState<CameraFeed[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setIncidents([
        { id: "1", type: "disturbance", status: "investigating", location: "Floor 15, Room 1508", reportedAt: "14:32", description: "Noise complaint from neighboring room", reportedBy: "Front Desk", assignedTo: "Officer Johnson", priority: "medium", notes: "Guest requested quiet hours enforcement" },
        { id: "2", type: "safety", status: "resolved", location: "Parking Garage B2", reportedAt: "13:15", resolvedAt: "13:45", description: "Slippery floor near elevator", reportedBy: "Guest", assignedTo: "Officer Chen", priority: "low" },
        { id: "3", type: "intrusion", status: "false-alarm", location: "Staff Area - Kitchen", reportedAt: "12:00", resolvedAt: "12:05", description: "Unauthorized access alarm triggered", reportedBy: "System", assignedTo: "Officer Martinez", priority: "high", notes: "False alarm - authorized staff member" },
        { id: "4", type: "theft", status: "investigating", location: "Lobby - Concierge", reportedAt: "11:20", description: "Missing luggage from storage area", reportedBy: "Concierge", assignedTo: "Officer Johnson", priority: "high", notes: "Reviewing CCTV footage" }
      ])

      setOfficers([
        { id: "1", name: "Officer Johnson", badge: "SEC-001", status: "on-duty", location: "Lobby", phone: "Ext. 9911", shift: "Day", lastCheckIn: "2 min ago", incidentsHandled: 3 },
        { id: "2", name: "Officer Chen", badge: "SEC-002", status: "on-duty", location: "Parking", phone: "Ext. 9912", shift: "Day", lastCheckIn: "5 min ago", incidentsHandled: 2 },
        { id: "3", name: "Officer Martinez", badge: "SEC-003", status: "break", location: "Break Room", phone: "Ext. 9913", shift: "Day", lastCheckIn: "15 min ago", incidentsHandled: 1 },
        { id: "4", name: "Officer Williams", badge: "SEC-004", status: "on-duty", location: "Pool Area", phone: "Ext. 9914", shift: "Day", lastCheckIn: "1 min ago", incidentsHandled: 0 },
        { id: "5", name: "Officer Park", badge: "SEC-005", status: "off-duty", location: "-", phone: "Ext. 9915", shift: "Night", lastCheckIn: "-", incidentsHandled: 0 }
      ])

      setCameras([
        { id: "1", name: "CAM-Lobby-01", location: "Main Entrance", status: "online", isRecording: true, lastMotion: "2 min ago" },
        { id: "2", name: "CAM-Lobby-02", location: "Reception Desk", status: "online", isRecording: true, lastMotion: "5 min ago" },
        { id: "3", name: "CAM-Elevator-01", location: "Elevator Bank A", status: "online", isRecording: true, lastMotion: "1 min ago" },
        { id: "4", name: "CAM-Parking-01", location: "Parking B1", status: "maintenance", isRecording: false },
        { id: "5", name: "CAM-Pool-01", location: "Pool Deck", status: "online", isRecording: true, lastMotion: "12 min ago" },
        { id: "6", name: "CAM-Gym-01", location: "Fitness Center", status: "online", isRecording: true, lastMotion: "8 min ago" }
      ])

      setAccessLogs([
        { id: "1", personName: "Mr. Anderson", type: "guest", location: "Main Entrance", action: "entry", timestamp: "14:30", method: "keycard" },
        { id: "2", personName: "Staff - Maria G.", type: "staff", location: "Service Entrance", action: "entry", timestamp: "14:25", method: "biometric" },
        { id: "3", personName: "Delivery - FedEx", type: "delivery", location: "Loading Dock", action: "entry", timestamp: "14:20", method: "manual" },
        { id: "4", personName: "Visitor - John Smith", type: "visitor", location: "Main Entrance", action: "entry", timestamp: "14:15", method: "manual" },
        { id: "5", personName: "Ms. Johnson", type: "guest", location: "Main Entrance", action: "exit", timestamp: "14:10", method: "keycard" }
      ])
      
      setIsLoading(false)
    }, 500)
  }, [])

  const getIncidentTypeColor = (type: IncidentType) => {
    switch (type) {
      case "intrusion": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "fire": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "medical": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "disturbance": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "theft": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "safety": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    }
  }

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case "active": return "bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
      case "investigating": return "bg-amber-500/10 text-amber-400"
      case "resolved": return "bg-emerald-500/10 text-emerald-400"
      case "false-alarm": return "bg-slate-500/10 text-[#8E939D]"
    }
  }

  const getOfficerStatusColor = (status: PatrolStatus) => {
    switch (status) {
      case "on-duty": return "bg-emerald-500/10 text-emerald-400 border-0"
      case "break": return "bg-amber-500/10 text-amber-400 border-0"
      case "emergency": return "bg-red-500/10 text-red-400 animate-pulse border-0 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
      case "off-duty": return "bg-slate-500/10 text-[#8E939D] border-0"
    }
  }

  const getPriorityColor = (priority: SecurityIncident["priority"]) => {
    switch (priority) {
      case "low": return "bg-slate-500/10 text-[#8E939D]"
      case "medium": return "bg-blue-500/10 text-blue-400"
      case "high": return "bg-amber-500/10 text-amber-400"
      case "critical": return "bg-red-500/10 text-red-400"
    }
  }

  const activeIncidents = incidents.filter(i => i.status === "active" || i.status === "investigating")
  const resolvedToday = incidents.filter(i => i.status === "resolved" || i.status === "false-alarm").length
  const officersOnDuty = officers.filter(o => o.status === "on-duty").length
  const camerasOnline = cameras.filter(c => c.status === "online").length

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <Shield className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            SECURITY <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> COMMAND CENTER
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
            SECURITY OPERATIONS & INCIDENT MANAGEMENT
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Camera className="mr-1 h-3 w-3" />
            CCTV
          </Button>
          <Button className="bg-red-600/20 hover:bg-red-600/30 text-red-400 h-8 text-[10px] font-bold uppercase tracking-widest border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <Siren className="mr-1 h-3 w-3" />
            EMERGENCY
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {activeIncidents.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="h-6 w-6 text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <div className="flex-1">
            <p className="font-bold uppercase tracking-widest text-[9px] text-red-400">
              {activeIncidents.length} ACTIVE INCIDENT{activeIncidents.length > 1 ? "S" : ""} REQUIRING ATTENTION
            </p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-red-400/70">
              {activeIncidents.map(i => i.location).join(", ")}
            </p>
          </div>
          <Button size="sm" className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-500/40">
            VIEW DETAILS
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "ACTIVE INCIDENTS", val: activeIncidents.length, color: "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]", icon: ShieldAlert },
          { label: "RESOLVED TODAY", val: resolvedToday, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]", icon: ShieldCheck },
          { label: "OFFICERS ON DUTY", val: officersOnDuty, color: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]", icon: Users },
          { label: "CAMERAS ONLINE", val: `${camerasOnline}/${cameras.length}`, color: "text-emerald-400", icon: Camera },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">{stat.label}</p>
                  <p className={cn("text-lg font-bold tracking-tight", stat.color)}>{stat.val}</p>
                </div>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              {stat.label === "CAMERAS ONLINE" && (
                <Progress value={(camerasOnline / cameras.length) * 100} className="mt-2 h-1 bg-[#00f2ff]/20 [&>div]:bg-[#00f2ff] [&>div]:shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1">
          <TabsTrigger value="dashboard" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            DASHBOARD
          </TabsTrigger>
          <TabsTrigger value="incidents" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            INCIDENTS
          </TabsTrigger>
          <TabsTrigger value="officers" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            OFFICERS
          </TabsTrigger>
          <TabsTrigger value="access" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            ACCESS CONTROL
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Incidents */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-400" /> LIVE INCIDENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {incidents.slice(0, 4).map((incident) => (
                  <div key={incident.id} className={cn(
                    "p-3 rounded-xl border transition-all group relative overflow-hidden",
                    incident.status === "investigating" ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" : "border-[#00f2ff]/15 bg-[#00f2ff]/5 hover:border-[#00f2ff]/40"
                  )}>
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${getIncidentTypeColor(incident.type)}`}>
                          {incident.type === "intrusion" && <DoorOpen className="h-3 w-3" />}
                          {incident.type === "fire" && <Siren className="h-3 w-3" />}
                          {incident.type === "medical" && <Activity className="h-3 w-3" />}
                          {incident.type === "disturbance" && <AlertTriangle className="h-3 w-3" />}
                          {incident.type === "theft" && <Eye className="h-3 w-3" />}
                          {incident.type === "safety" && <ShieldCheck className="h-3 w-3" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D] capitalize">{incident.type}</span>
                            <Badge className={`${getStatusColor(incident.status)} text-[6px] tracking-widest uppercase border-0`}>
                              {incident.status}
                            </Badge>
                          </div>
                          <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">{incident.location}</p>
                          <p className="text-[7px] text-[#5C6270] mt-0.5">{incident.reportedAt} • {incident.reportedBy}</p>
                        </div>
                      </div>
                      <Badge className={`${getPriorityColor(incident.priority)} text-[6px] uppercase tracking-widest border-0`}>
                        {incident.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Camera Feeds */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-400" /> CAMERA STATUS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-2 gap-2">
                  {cameras.map((camera) => (
                    <div key={camera.id} className={cn(
                      "p-2 rounded-lg border transition-all group relative overflow-hidden",
                      camera.status === "online" ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50" :
                      camera.status === "maintenance" ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" :
                      "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                    )}>
                      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="flex items-center justify-between mb-1 relative z-10">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#8E939D]">{camera.name}</span>
                        <div className={cn("h-1.5 w-1.5 rounded-full",
                          camera.status === "online" ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)] animate-pulse" : 
                          camera.status === "maintenance" ? "bg-amber-400" : "bg-red-400"
                        )} />
                      </div>
                      <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">{camera.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {camera.isRecording ? (
                          <Badge className="text-[6px] tracking-widest uppercase bg-red-500/20 text-red-400 border-0 shadow-[0_0_5px_rgba(239,68,68,0.2)]">
                            <Scan className="h-2 w-2 mr-0.5" /> REC
                          </Badge>
                        ) : (
                          <Badge className="text-[6px] tracking-widest uppercase bg-slate-700/50 text-[#8E939D] border-0">OFF</Badge>
                        )}
                        {camera.lastMotion && (
                          <span className="text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">MOTION: {camera.lastMotion}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5C6270]" />
              <Input
                placeholder="SEARCH INCIDENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
              />
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10">
              <Filter className="mr-1 h-3 w-3" /> FILTER
            </Button>
          </div>

          <div className="space-y-2">
            {incidents.map((incident) => (
              <div key={incident.id} className="p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getIncidentTypeColor(incident.type)}`}>
                      {incident.type === "intrusion" && <DoorOpen className="h-4 w-4" />}
                      {incident.type === "fire" && <Siren className="h-4 w-4" />}
                      {incident.type === "medical" && <Activity className="h-4 w-4" />}
                      {incident.type === "disturbance" && <AlertTriangle className="h-4 w-4" />}
                      {incident.type === "theft" && <Eye className="h-4 w-4" />}
                      {incident.type === "safety" && <ShieldCheck className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[10px] uppercase tracking-widest text-[#8E939D] capitalize">{incident.type}</h3>
                        <Badge className={`${getStatusColor(incident.status)} text-[7px] tracking-widest uppercase border-0`}>
                          {incident.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(incident.priority)} text-[6px] uppercase tracking-widest border-0`}>
                          {incident.priority}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-1">{incident.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">
                        <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{incident.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{incident.reportedAt}</span>
                        <span>BY: {incident.reportedBy}</span>
                      </div>
                      {incident.notes && (
                        <p className="text-[7px] font-bold uppercase tracking-widest text-amber-400 mt-1">⚠ {incident.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    {incident.assignedTo && (
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Avatar className="h-6 w-6 border border-[#00f2ff]/30">
                          <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[7px] font-bold">
                            {incident.assignedTo.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-slate-300">{incident.assignedTo}</span>
                      </div>
                    )}
                    {incident.resolvedAt && (
                      <p className="text-[7px] text-emerald-400 font-bold uppercase tracking-widest">RESOLVED: {incident.resolvedAt}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Officers Tab */}
        <TabsContent value="officers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {officers.map((officer) => (
              <div key={officer.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Avatar className="h-10 w-10 border border-[#00f2ff]/30 relative z-10">
                  <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold">
                    {officer.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[11px] text-[#8E939D] group-hover:text-[#00f2ff] transition-colors uppercase">{officer.name}</h4>
                    <Badge className={`${getOfficerStatusColor(officer.status)} text-[7px] tracking-widest uppercase border-0`}>
                      {officer.status}
                    </Badge>
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">BADGE: {officer.badge}</p>
                  <div className="flex items-center gap-3 mt-1 text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">
                    <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{officer.location}</span>
                    <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{officer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">
                    <span>SHIFT: {officer.shift}</span>
                    <span>CHECK-IN: {officer.lastCheckIn}</span>
                    <span>INCIDENTS: {officer.incidentsHandled}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-4">
          <div className="space-y-2">
            {accessLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className={cn("p-1.5 rounded-lg",
                  log.action === "entry" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {log.action === "entry" ? <DoorOpen className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{log.personName}</span>
                    <Badge variant="secondary" className="bg-slate-700/50 text-[#8E939D] text-[6px] tracking-widest uppercase border-0 capitalize">
                      {log.type}
                    </Badge>
                  </div>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">{log.location} • {log.timestamp}</p>
                </div>
                <Badge variant="secondary" className="bg-slate-700/50 text-[#8E939D] text-[6px] tracking-widest uppercase border-0">
                  {log.method === "keycard" && <Scan className="h-2 w-2 mr-0.5" />}
                  {log.method === "biometric" && <Fingerprint className="h-2 w-2 mr-0.5" />}
                  {log.method}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-3 relative z-10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-2">INCIDENTS BY TYPE</p>
            <div className="space-y-1">
              {["disturbance", "safety", "theft", "intrusion"].map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300 capitalize">{type}</span>
                  <span className="text-[8px] font-bold text-[#8E939D]">{incidents.filter(i => i.type === type).length}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-3 relative z-10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-2">RESPONSE TIME</p>
            <div className="space-y-2">
              <div><div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest mb-0.5"><span className="text-slate-300">AVG RESPONSE</span><span className="text-emerald-400">3.2 MIN</span></div><Progress value={85} className="h-1 bg-[#00f2ff]/20 [&>div]:bg-emerald-400" /></div>
              <div><div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest mb-0.5"><span className="text-slate-300">RESOLUTION RATE</span><span className="text-emerald-400">94%</span></div><Progress value={94} className="h-1 bg-[#00f2ff]/20 [&>div]:bg-emerald-400" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-3 relative z-10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-2">EMERGENCY CONTACTS</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 rounded bg-red-500/5 border border-red-500/20"><div className="flex items-center gap-1"><Siren className="h-2.5 w-2.5 text-red-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-slate-300">POLICE</span></div><span className="text-[7px] font-bold text-red-400">911</span></div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#00f2ff]/5"><div className="flex items-center gap-1"><Activity className="h-2.5 w-2.5 text-blue-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-slate-300">MEDICAL</span></div><span className="text-[7px] font-bold text-[#8E939D]">EXT. 4500</span></div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#00f2ff]/5"><div className="flex items-center gap-1"><Flame className="h-2.5 w-2.5 text-orange-400" /><span className="text-[7px] font-bold uppercase tracking-widest text-slate-300">FIRE DEPT</span></div><span className="text-[7px] font-bold text-[#8E939D]">911</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}