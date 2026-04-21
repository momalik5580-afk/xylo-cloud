'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server,
  Globe,
  Shield,
  HardDrive,
  Wifi,
  Monitor,
  Printer,
  Camera,
  Phone,
  Database,
  Cloud,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Users,
  Key,
  Lock,
  Unlock,
  Fingerprint,
  WifiOff,
  Signal, 
  Network,
  Radio,
  Gauge,
  BarChart3,
  Activity,
  Calendar,
  Mail,
  MessageSquare,
  Crown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ITContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    systemsOnline: 42,
    totalSystems: 48,
    activeIncidents: 3,
    resolvedToday: 7,
    networkHealth: 98,
    serverLoad: 64,
    wifiClients: 156,
    backupsComplete: 12
  };

  const incidents = [
    { id: 'INC-001', title: 'POS System Down', location: 'Azure Restaurant', priority: 'Critical', status: 'In Progress', assignedTo: 'Mike Chen', time: '5 mins ago', impact: 'F&B Operations', eta: '15 mins' },
    { id: 'INC-002', title: 'WiFi Connectivity Issues', location: 'East Wing Rooms 1200-1250', priority: 'High', status: 'Investigating', assignedTo: 'Sarah Kim', time: '15 mins ago', impact: 'Guest WiFi', eta: '30 mins' },
    { id: 'INC-003', title: 'Printer Offline', location: 'Front Desk', priority: 'Medium', status: 'Pending', assignedTo: 'Unassigned', time: '45 mins ago', impact: 'Check-in Operations', eta: '1 hour' }
  ];

  const networkDevices = [
    { name: 'Core Switch 1', status: 'Online', load: '42%', uptime: '98 days', ip: '10.0.0.1' },
    { name: 'Core Switch 2', status: 'Online', load: '38%', uptime: '98 days', ip: '10.0.0.2' },
    { name: 'Firewall', status: 'Online', load: '56%', uptime: '45 days', ip: '10.0.0.254' },
    { name: 'WiFi Controller', status: 'Online', load: '72%', uptime: '30 days', ip: '10.0.1.10' },
    { name: 'VPN Gateway', status: 'Online', load: '23%', uptime: '60 days', ip: '10.0.1.20' },
    { name: 'Access Point Lobby', status: 'Online', load: '85%', uptime: '14 days', ip: '10.0.5.12' },
    { name: 'Access Point Pool', status: 'Degraded', load: '95%', uptime: '7 days', ip: '10.0.5.15' },
    { name: 'Access Point Ballroom', status: 'Offline', load: '0%', uptime: '0 days', ip: '10.0.5.18' }
  ];

  const servers = [
    { name: 'PMS Server', status: 'Online', cpu: '34%', ram: '8.2/16GB', disk: '245/500GB', role: 'Property Management' },
    { name: 'POS Server', status: 'Online', cpu: '28%', ram: '6.1/16GB', disk: '120/250GB', role: 'F&B Systems' },
    { name: 'AD/DNS', status: 'Online', cpu: '18%', ram: '4.5/8GB', disk: '85/120GB', role: 'Authentication' },
    { name: 'Backup Server', status: 'Online', cpu: '62%', ram: '12/16GB', disk: '1.8/4TB', role: 'Backups' },
    { name: 'Email Server', status: 'Online', cpu: '22%', ram: '5.2/8GB', disk: '210/500GB', role: 'Communications' },
    { name: 'Database Server', status: 'Online', cpu: '58%', ram: '14.5/32GB', disk: '890/2TB', role: 'SQL Database' }
  ];

  const staff = [
    { name: 'Mike Chen', role: 'IT Manager', status: 'On Duty', tasks: 3, phone: 'Ext. 5501', expertise: 'Infrastructure' },
    { name: 'Sarah Kim', role: 'Network Admin', status: 'On Duty', tasks: 2, phone: 'Ext. 5502', expertise: 'Networking' },
    { name: 'James Wilson', role: 'Systems Admin', status: 'On Duty', tasks: 4, phone: 'Ext. 5503', expertise: 'Servers' },
    { name: 'Lisa Rodriguez', role: 'Support Tech', status: 'On Duty', tasks: 5, phone: 'Ext. 5504', expertise: 'End User' },
    { name: 'David Park', role: 'Support Tech', status: 'On Break', tasks: 2, phone: 'Ext. 5505', expertise: 'POS Systems' },
    { name: 'Anna Schmidt', role: 'Security Specialist', status: 'Off Duty', tasks: 0, phone: 'Ext. 5506', expertise: 'Cybersecurity' }
  ];

  const tickets = [
    { id: 'TK-1001', user: 'Front Desk - John', issue: 'Cannot print registration cards', priority: 'High', status: 'In Progress', time: '10 mins' },
    { id: 'TK-1002', user: 'Housekeeping - Maria', issue: 'Tablet not syncing', priority: 'Medium', status: 'Assigned', time: '25 mins' },
    { id: 'TK-1003', user: 'GM Office - Wilson', issue: 'Email not working on phone', priority: 'Low', status: 'Open', time: '1 hour' },
    { id: 'TK-1004', user: 'Restaurant - Carlos', issue: 'POS terminal frozen', priority: 'Critical', status: 'Resolved', time: '2 hours' },
    { id: 'TK-1005', user: 'Engineering - Davis', issue: 'Work order system slow', priority: 'Medium', status: 'In Progress', time: '3 hours' }
  ];

  const licenses = [
    { name: 'Windows Server', total: 20, used: 18, expiry: '2025-12-31' },
    { name: 'Microsoft 365', total: 150, used: 142, expiry: '2025-06-30' },
    { name: 'Antivirus', total: 200, used: 187, expiry: '2025-03-31' },
    { name: 'PMS System', total: 50, used: 45, expiry: '2025-09-30' },
    { name: 'Adobe Creative', total: 10, used: 8, expiry: '2025-01-31' }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[7px] tracking-widest uppercase shadow-[0_0_5px_rgba(239,68,68,0.2)]">CRITICAL</Badge>;
      case 'High': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[7px] tracking-widest uppercase">HIGH</Badge>;
      case 'Medium': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[7px] tracking-widest uppercase">MEDIUM</Badge>;
      case 'Low': return <Badge className="bg-slate-500/20 text-[#8E939D] border-slate-500/30 text-[7px] tracking-widest uppercase">LOW</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Online': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[7px] tracking-widest uppercase">ONLINE</Badge>;
      case 'Offline': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[7px] tracking-widest uppercase">OFFLINE</Badge>;
      case 'Degraded': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[7px] tracking-widest uppercase">DEGRADED</Badge>;
      case 'In Progress': return <Badge className="bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30 text-[7px] tracking-widest uppercase">IN PROGRESS</Badge>;
      case 'Resolved': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[7px] tracking-widest uppercase">RESOLVED</Badge>;
      case 'On Duty': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[7px] tracking-widest uppercase">ON DUTY</Badge>;
      case 'On Break': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[7px] tracking-widest uppercase">ON BREAK</Badge>;
      case 'Off Duty': return <Badge className="bg-slate-500/20 text-[#8E939D] border-slate-500/30 text-[7px] tracking-widest uppercase">OFF DUTY</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <Server className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            IT DEPARTMENT <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> INFRASTRUCTURE
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
            INFRASTRUCTURE · SUPPORT · SYSTEMS
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Download className="mr-1 h-3 w-3" />
            BACKUP
          </Button>
          <Button className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] h-8 text-[10px] font-bold uppercase tracking-widest border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            <Plus className="mr-1 h-3 w-3" />
            NEW TICKET
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "SYSTEMS STATUS", val: `${stats.systemsOnline}/${stats.totalSystems}`, sub: `${(stats.systemsOnline/stats.totalSystems*100).toFixed(0)}% ONLINE`, icon: Monitor, color: "text-emerald-400", badge: stats.activeIncidents > 0 ? `${stats.activeIncidents} INCIDENTS` : null },
          { label: "NETWORK HEALTH", val: `${stats.networkHealth}%`, sub: `${stats.wifiClients} CONNECTED CLIENTS`, icon: Wifi, color: "text-[#00f2ff]", progress: stats.networkHealth },
          { label: "SERVER LOAD", val: `${stats.serverLoad}%`, sub: "PEAK: 78% AT 2PM", icon: Cpu, color: "text-amber-400", progress: stats.serverLoad },
          { label: "BACKUPS", val: `${stats.backupsComplete}/12`, sub: "LAST: 3:00 AM - SUCCESSFUL", icon: Database, color: "text-emerald-400" }
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70">{kpi.label}</CardTitle>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-bold tracking-tight text-[#8E939D]">{kpi.val}</div>
              <p className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">{kpi.sub}</p>
              {kpi.progress && (
                <Progress value={kpi.progress} className="mt-2 h-1 bg-[#00f2ff]/20 [&>div]:bg-[#00f2ff] [&>div]:shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
              )}
              {kpi.badge && (
                <Badge className="mt-1 bg-red-500/20 text-red-400 text-[6px] tracking-widest uppercase border-0">{kpi.badge}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Banner */}
      {incidents.filter(i => i.priority === 'Critical' || i.priority === 'High').length > 0 && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <div className="flex-1">
            <p className="font-bold uppercase tracking-widest text-[8px] text-red-400">
              {incidents.filter(i => i.priority === 'Critical').length} CRITICAL INCIDENTS REQUIRING IMMEDIATE ATTENTION
            </p>
            <p className="text-[7px] font-bold uppercase tracking-widest text-red-400/70">
              POS SYSTEM DOWN · WIFI ISSUES IN EAST WING
            </p>
          </div>
          <Button size="sm" className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[8px] font-bold uppercase tracking-widest border border-red-500/40">
            VIEW INCIDENTS
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#5C6270]" />
          <Input
            placeholder="SEARCH TICKETS, DEVICES, OR STAFF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] text-[9px] font-bold uppercase tracking-widest placeholder:text-[8px]"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10">
          <Filter className="mr-1 h-3 w-3" />
          FILTER
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10">
          <RefreshCw className="mr-1 h-3 w-3" />
          REFRESH
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 rounded-md p-1 flex-wrap">
          <TabsTrigger value="overview" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.1)]">OVERVIEW</TabsTrigger>
          <TabsTrigger value="incidents" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">INCIDENTS</TabsTrigger>
          <TabsTrigger value="network" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">NETWORK</TabsTrigger>
          <TabsTrigger value="servers" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">SERVERS</TabsTrigger>
          <TabsTrigger value="tickets" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">SUPPORT TICKETS</TabsTrigger>
          <TabsTrigger value="staff" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">IT STAFF</TabsTrigger>
          <TabsTrigger value="licenses" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:text-[#00f2ff] data-[state=active]:bg-[#00f2ff]/10">LICENSES</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">ACTIVE INCIDENTS</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {incidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className={cn("p-1.5 rounded-lg",
                      incident.priority === 'Critical' ? "bg-red-500/10" : incident.priority === 'High' ? "bg-orange-500/10" : "bg-amber-500/10"
                    )}>
                      <AlertTriangle className={cn("h-3 w-3",
                        incident.priority === 'Critical' ? "text-red-400" : incident.priority === 'High' ? "text-orange-400" : "text-amber-400"
                      )} />
                    </div>
                    <div>
                      <div className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{incident.title}</div>
                      <div className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">{incident.location} • {incident.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <Badge className="bg-slate-700/50 text-[#8E939D] text-[6px] tracking-widest uppercase border-0">{incident.assignedTo}</Badge>
                    {getPriorityBadge(incident.priority)}
                    {getStatusBadge(incident.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">NETWORK HEALTH</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {networkDevices.slice(0, 5).map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:bg-[#00f2ff]/10 transition-all">
                    <div className="flex items-center gap-2">
                      {device.status === 'Online' ? <Wifi className="h-3 w-3 text-emerald-400" /> : device.status === 'Degraded' ? <WifiOff className="h-3 w-3 text-orange-400" /> : <WifiOff className="h-3 w-3 text-red-400" />}
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">{device.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">{device.load}</span>
                      {getStatusBadge(device.status)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
              <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">RECENT TICKETS</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {tickets.slice(0, 4).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:bg-[#00f2ff]/10 transition-all">
                    <div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-[#8E939D]">{ticket.issue}</div>
                      <div className="text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">{ticket.user} • {ticket.time}</div>
                    </div>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">NETWORK DEVICES</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {networkDevices.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10">
                    <div className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{device.name}</div>
                    <div className="text-[7px] font-bold uppercase tracking-widest text-[#5C6270]">IP: {device.ip} • UPTIME: {device.uptime}</div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-[#8E939D]">LOAD: {device.load}</span>
                    {getStatusBadge(device.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">SERVER STATUS</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {servers.map((server, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-purple-400" />
                      <span className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{server.name}</span>
                      <Badge className="ml-1 border-[#00f2ff]/30 text-[6px] tracking-widest uppercase bg-transparent text-slate-300">{server.role}</Badge>
                    </div>
                    {getStatusBadge(server.status)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[7px] font-bold uppercase tracking-widest relative z-10">
                    <div><span className="text-[#5C6270]">CPU:</span> <span className="text-slate-300 ml-1">{server.cpu}</span></div>
                    <div><span className="text-[#5C6270]">RAM:</span> <span className="text-slate-300 ml-1">{server.ram}</span></div>
                    <div><span className="text-[#5C6270]">DISK:</span> <span className="text-slate-300 ml-1">{server.disk}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">SUPPORT TICKETS</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-[#00f2ff]">{ticket.id}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#8E939D]">{ticket.issue}</span>
                    </div>
                    <div className="text-[6px] font-bold uppercase tracking-widest text-[#5C6270] mt-0.5">{ticket.user}</div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="text-[6px] font-bold uppercase tracking-widest text-[#5C6270]">{ticket.time}</span>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">IT STAFF</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staff.map((member, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h4 className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{member.name}</h4>
                        <p className="text-[7px] text-purple-400 font-bold uppercase tracking-widest">{member.role}</p>
                      </div>
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="mt-2 text-[7px] font-bold uppercase tracking-widest text-[#5C6270] space-y-0.5 relative z-10">
                      <p>📞 {member.phone}</p>
                      <p>🔧 {member.expertise}</p>
                      <p>📋 {member.tasks} ACTIVE TASKS</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 transition-all">
            <CardHeader className="pb-2 border-b border-[#00f2ff]/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff]">SOFTWARE LICENSES</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {licenses.map((license, idx) => {
                const usagePercent = (license.used / license.total) * 100;
                return (
                  <div key={idx} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/10 transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <h4 className="font-bold text-[9px] uppercase tracking-widest text-[#8E939D]">{license.name}</h4>
                      <Badge className="border-[#00f2ff]/30 text-[6px] tracking-widest uppercase bg-transparent text-slate-300">EXP: {license.expiry}</Badge>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest mb-0.5">
                        <span className="text-[#5C6270]">USAGE</span>
                        <span className="text-slate-300">{license.used}/{license.total}</span>
                      </div>
                      <Progress value={usagePercent} className="h-1 bg-[#00f2ff]/20 [&>div]:bg-[#00f2ff] [&>div]:shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}