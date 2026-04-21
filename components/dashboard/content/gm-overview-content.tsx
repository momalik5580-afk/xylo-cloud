'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  // Main icons
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Users,
  UserPlus,
  Hotel,
  BedDouble,
  Coffee,
  Wine,
  Wrench,
  Shield,
  Heart,
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
  
  // Action icons
  Bell,
  BellRing,
  FileText,
  ClipboardList,
  ClipboardCheck,
  Send,
  MessageSquare,
  Plus,
  Edit,
  
  // Chart icons
  LineChart,
  BarChart3,
  PieChart,
  
  // Status icons
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

export function GMOverviewContent() {
  const [selectedDate, setSelectedDate] = useState('2026-03-02');

  // ==========================================
  // 1️⃣ TOP KPI DATA
  // ==========================================
  
  const kpis = {
    occupancy: { value: 78, target: 85, status: 'warning' },
    adr: { value: 320, target: 330, status: 'warning' },
    revpar: { value: 250, target: 280, status: 'warning' },
    vipGuests: { value: 12, status: 'info' },
    totalRevenue: { value: 120450, status: 'good' },
    activeStaff: { value: 895, status: 'good' }
  };

  // ==========================================
  // 2️⃣ DEPARTMENT SNAPSHOTS
  // ==========================================
  
  const departments = {
    frontOffice: {
      cleaned: 410,
      dirty: 25,
      outOfOrder: 5,
      guestIssues: 3,
      checkIns: 124,
      checkOuts: 98
    },
    housekeeping: {
      roomsCleaned: 385,
      roomsPending: 15,
      recleanPercentage: 3.2,
      vipRooms: 8,
      inspected: 42
    },
    fAndB: {
      covers: 320,
      revenue: 42500,
      foodCost: 32,
      beverageCost: 22,
      avgCheck: 132,
      reservations: 145
    },
    spa: {
      treatments: 42,
      revenue: 8450,
      vipBookings: 5,
      therapistUtilization: 78,
      retailSales: 1250
    },
    engineering: {
      openTickets: 8,
      criticalIssues: 1,
      preventiveMaint: 5,
      responseTime: 18
    },
    security: {
      incidentsToday: 2,
      cctvAlerts: 1,
      patrolsActive: 12,
      accessViolations: 0
    }
  };

  // ==========================================
  // 3️⃣ ALERTS PANEL
  // ==========================================
  
  const alerts = [
    { 
      id: 'ALT-001',
      priority: 'high',
      message: 'AC Unit Failure in Room 410',
      department: 'Engineering',
      time: '5 min ago',
      actionable: true
    },
    { 
      id: 'ALT-002',
      priority: 'high',
      message: 'Overbook Alert at Sea View Restaurant',
      department: 'F&B',
      time: '15 min ago',
      actionable: true
    },
    { 
      id: 'ALT-003',
      priority: 'medium',
      message: 'Finance Report Variance - Payroll +3.2%',
      department: 'Finance',
      time: '1 hour ago',
      actionable: true
    },
    { 
      id: 'ALT-004',
      priority: 'low',
      message: 'Housekeeping behind schedule - Floor 8',
      department: 'Housekeeping',
      time: '2 hours ago',
      actionable: true
    },
    { 
      id: 'ALT-005',
      priority: 'info',
      message: 'VIP Arrival: Mr. Smith - Suite 101',
      department: 'Front Office',
      time: '3 hours ago',
      actionable: false
    }
  ];

  // ==========================================
  // 4️⃣ RECENT ACTIVITIES
  // ==========================================
  
  const activities = [
    {
      id: 'ACT-001',
      time: '08:45 AM',
      description: 'VIP Suite 305 Ready for Mrs. Lee',
      department: 'Housekeeping',
      status: 'success'
    },
    {
      id: 'ACT-002',
      time: '08:30 AM',
      description: 'AC Repair Room 410 Assigned',
      department: 'Engineering',
      status: 'success'
    },
    {
      id: 'ACT-003',
      time: '08:15 AM',
      description: 'Late Checkout Request for Room 215',
      department: 'Front Office',
      status: 'warning'
    },
    {
      id: 'ACT-004',
      time: '08:00 AM',
      description: 'Daily Revenue Report Reviewed',
      department: 'Finance',
      status: 'success'
    },
    {
      id: 'ACT-005',
      time: '07:45 AM',
      description: 'Staff Meeting - Banquet Hall',
      department: 'HR',
      status: 'info'
    },
    {
      id: 'ACT-006',
      time: '07:30 AM',
      description: 'Kitchen Equipment Malfunction',
      department: 'Engineering',
      status: 'critical'
    }
  ];

  // ==========================================
  // 5️⃣ VIP GUESTS MONITORING
  // ==========================================
  
  const vipGuests = [
    {
      id: 'VIP-001',
      name: 'Mr. Smith',
      suite: '101',
      arrival: '2:00 PM',
      notes: 'Birthday Setup - Cake & Champagne',
      department: 'Housekeeping',
      status: 'pending'
    },
    {
      id: 'VIP-002',
      name: 'Ms. Lee',
      suite: '305',
      arrival: '12:30 PM',
      notes: 'Vegan Menu - No Pork',
      department: 'F&B',
      status: 'in-progress'
    },
    {
      id: 'VIP-003',
      name: 'Sheikh Al-Rashid',
      suite: '1508',
      arrival: '3:00 PM',
      notes: 'Private Elevator - Security Team',
      department: 'Security',
      status: 'pending'
    },
    {
      id: 'VIP-004',
      name: 'Mrs. Chen',
      suite: '1203',
      arrival: '4:30 PM',
      notes: 'Allergies: Shellfish',
      department: 'F&B',
      status: 'pending'
    }
  ];

  // ==========================================
  // 6️⃣ PERFORMANCE & FORECAST
  // ==========================================
  
  const forecast = {
    occupancyTrend: [72, 75, 78, 82, 85, 83, 80, 78, 76, 74, 78, 82, 85, 88],
    revenueForecast: [285, 292, 298, 305, 312, 308, 295, 288, 282, 278, 285, 295, 305, 315],
    next30Days: 82,
    next60Days: 78,
    next90Days: 74,
    vsBudget: '+3.2%'
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const getKpiStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]';
      case 'warning': return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]';
      case 'critical': return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'info': return 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]';
      default: return 'text-[#8E939D]';
    }
  };

  const getKpiStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">OK</Badge>;
      case 'warning': return <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest">WARNING</Badge>;
      case 'critical': return <Badge className="bg-red-500/10 text-red-500 border-0 shadow-[0_0_10px_rgba(239,68,68,0.2)] text-[8px] uppercase tracking-widest animate-pulse">CRITICAL</Badge>;
      case 'info': return <Badge className="bg-purple-500/10 text-purple-400 border-0 shadow-[0_0_10px_rgba(192,132,252,0.2)] text-[8px] uppercase tracking-widest">INFO</Badge>;
      default: return null;
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]" />;
      case 'info': return <Info className="h-4 w-4 text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.4)]" />;
      default: return <Clock className="h-4 w-4 text-[#8E939D]" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">HIGH</Badge>;
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.2)]">MEDIUM</Badge>;
      case 'low': return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.2)]">LOW</Badge>;
      case 'info': return <Badge className="bg-slate-800/50 text-[#8E939D] border-slate-600/30 text-[8px] uppercase tracking-widest">INFO</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
          <Crown className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
          CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> GM OVERVIEW
        </h1>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Calendar className="h-3 w-3 mr-2 text-[#00f2ff]" />
            {selectedDate}
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8">
            <Clock className="h-3 w-3 mr-2 text-[#00f2ff]" />
            SYNC
          </Button>
        </div>
      </div>

      {/* 1️⃣ Top KPI Bar - Full Width */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "OCCUPANCY", val: `${kpis.occupancy.value}%`, target: `${kpis.occupancy.target}%`, status: kpis.occupancy.status },
          { label: "ADR", val: `$${kpis.adr.value}`, target: `$${kpis.adr.target}`, status: kpis.adr.status },
          { label: "REVPAR", val: `$${kpis.revpar.value}`, target: `$${kpis.revpar.target}`, status: kpis.revpar.status },
          { label: "VIP GUESTS", val: kpis.vipGuests.value, icon: Crown, status: 'info' },
          { label: "REVENUE", val: `$${(kpis.totalRevenue.value/1000).toFixed(0)}K`, icon: DollarSign, customBadge: "TODAY", status: 'good' },
          { label: "ACV STAFF", val: kpis.activeStaff.value, icon: Users, customBadge: "ON DUTY", status: 'info' }
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{kpi.label}</p>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold tracking-tight ${getKpiStatusColor(kpi.status)}`}>{kpi.val}</p>
                  {kpi.target && (
                    <div className="text-right">
                      <p className="text-[8px] uppercase font-bold tracking-widest text-[#5C6270]">TARGET</p>
                      <p className="text-[10px] font-bold text-[#8E939D]">{kpi.target}</p>
                    </div>
                  )}
                  {kpi.icon && (
                    <kpi.icon className={`h-5 w-5 ${getKpiStatusColor(kpi.status)} opacity-80`} />
                  )}
                </div>
                <div className="mt-1">
                  {kpi.customBadge ? (
                    <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">
                      {kpi.customBadge}
                    </Badge>
                  ) : (
                    getKpiStatusBadge(kpi.status)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Department Snapshots */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 2️⃣ Department Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'fo', title: 'FRONT OFFICE', icon: Hotel, iconColor: 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]',
                stats: [
                  { label: 'CLEANED', val: departments.frontOffice.cleaned, color: 'text-[#0ea5e9]' },
                  { label: 'DIRTY', val: departments.frontOffice.dirty, color: 'text-amber-400' },
                  { label: 'O.O.O.', val: departments.frontOffice.outOfOrder, color: 'text-red-500' },
                  { label: 'ISSUES', val: departments.frontOffice.guestIssues, color: 'text-amber-400' }
                ],
                footer: `CHECK-INS: ${departments.frontOffice.checkIns} // CHECK-OUTS: ${departments.frontOffice.checkOuts}`
              },
              {
                id: 'hk', title: 'HOUSEKEEPING', icon: BedDouble, iconColor: 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]',
                stats: [
                  { label: 'CLEANED', val: departments.housekeeping.roomsCleaned, color: 'text-[#00f2ff]' },
                  { label: 'PENDING', val: departments.housekeeping.roomsPending, color: 'text-amber-400' },
                  { label: 'RE-CLEAN', val: `${departments.housekeeping.recleanPercentage}%`, color: 'text-amber-400' },
                  { label: 'VIP ROOMS', val: departments.housekeeping.vipRooms, color: 'text-purple-400' }
                ],
                footer: `INSPECTED: ${departments.housekeeping.inspected}`
              },
              {
                id: 'fb', title: 'F&B OPERATIONS', icon: Coffee, iconColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]',
                stats: [
                  { label: 'COVERS', val: departments.fAndB.covers, color: 'text-[#8E939D]' },
                  { label: 'REVENUE', val: `$${(departments.fAndB.revenue/1000).toFixed(0)}K`, color: 'text-[#00f2ff]' },
                  { label: 'FOOD COST', val: `${departments.fAndB.foodCost}%`, color: 'text-amber-400' },
                  { label: 'BEV COST', val: `${departments.fAndB.beverageCost}%`, color: 'text-[#0ea5e9]' }
                ],
                footer: `AVG CHECK: $${departments.fAndB.avgCheck} // RESERVATIONS: ${departments.fAndB.reservations}`
              },
              {
                id: 'spa', title: 'SPA & WELLNESS', icon: Heart, iconColor: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]',
                stats: [
                  { label: 'TREATMENTS', val: departments.spa.treatments, color: 'text-[#8E939D]' },
                  { label: 'REVENUE', val: `$${(departments.spa.revenue/1000).toFixed(0)}K`, color: 'text-[#00f2ff]' },
                  { label: 'VIP', val: departments.spa.vipBookings, color: 'text-purple-400' },
                  { label: 'UTILIZATION', val: `${departments.spa.therapistUtilization}%`, color: 'text-[#0ea5e9]' }
                ]
              },
              {
                id: 'eng', title: 'ENGINEERING', icon: Wrench, iconColor: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]',
                stats: [
                  { label: 'OPEN TKTS', val: departments.engineering.openTickets, color: 'text-amber-400' },
                  { label: 'CRITICAL', val: departments.engineering.criticalIssues, color: 'text-red-500' },
                  { label: 'PREVENTIVE', val: departments.engineering.preventiveMaint, color: 'text-[#00f2ff]' },
                  { label: 'RESPONSE', val: `${departments.engineering.responseTime}M`, color: 'text-[#0ea5e9]' }
                ]
              },
              {
                id: 'sec', title: 'SECURITY', icon: Shield, iconColor: 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
                stats: [
                  { label: 'INCIDENTS', val: departments.security.incidentsToday, color: 'text-amber-400' },
                  { label: 'CCTV ALERTS', val: departments.security.cctvAlerts, color: 'text-red-500' },
                  { label: 'PATROLS', val: departments.security.patrolsActive, color: 'text-[#00f2ff]' },
                  { label: 'VIOLATIONS', val: departments.security.accessViolations, color: 'text-[#8E939D]' }
                ]
              }
            ].map(dept => (
              <Card key={dept.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
                  <CardTitle className="text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">
                    <dept.icon className={`h-4 w-4 ${dept.iconColor}`} />
                    {dept.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    {dept.stats.map((s, i) => (
                      <div key={i} className="flex flex-col gap-1 p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color.includes('drop-shadow') ? s.color : s.color + ' drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]'}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  {dept.footer && (
                    <div className="mt-4 pt-3 border-t border-[#00f2ff]/10 text-[8px] uppercase font-bold tracking-widest text-[#00f2ff]/50 group-hover:text-[#00f2ff] transition-colors text-right">
                      {dept.footer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 4️⃣ Recent Activities Timeline */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">RECENT ACTIVITIES</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:bg-[#00f2ff]/10 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)] group cursor-default">
                    <div className="w-16 text-[9px] font-bold tracking-widest text-[#5C6270] mt-0.5 group-hover:text-[#00f2ff]/70 transition-colors">{activity.time}</div>
                    <div className="mt-0.5">{getActivityIcon(activity.status)}</div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{activity.description}</p>
                      <p className="text-[8px] uppercase font-bold tracking-widest text-[#5C6270] mt-1">{activity.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Alerts & VIPs */}
        <div className="flex flex-col gap-6">
          {/* 3️⃣ Alerts Panel */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>ALERTS</span>
                <BellRing className="h-4 w-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)] cursor-pointer group/alert hover:shadow-[0_0_15px_rgba(0,242,255,0.15)]">
                    <div className="flex items-start gap-3">
                      {alert.priority === 'high' && <AlertCircle className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)] mt-0.5" />}
                      {alert.priority === 'medium' && <AlertTriangle className="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)] mt-0.5" />}
                      {alert.priority === 'low' && <Info className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)] mt-0.5" />}
                      {alert.priority === 'info' && <Info className="h-4 w-4 text-[#8E939D] mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover/alert:text-[#00f2ff] transition-colors">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{alert.department}</span>
                          <span className="text-[8px] text-slate-600">/</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{alert.time}</span>
                        </div>
                      </div>
                      {getPriorityBadge(alert.priority)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5️⃣ VIP Guests Monitoring */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_4px_rgba(0,242,255,0.2)]" />
                VIP GUESTS
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {vipGuests.map((vip) => (
                  <div key={vip.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 hover:shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all cursor-pointer group/vip">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover/vip:text-[#00f2ff] transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">{vip.name}</span>
                      <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">SUITE {vip.suite}</Badge>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">ARRIVAL: <span className="text-slate-300">{vip.arrival}</span></p>
                    <p className="text-[9px] font-bold tracking-wide text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.25)] mb-3">{vip.notes}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-600/50 text-[8px] uppercase tracking-widest font-bold text-[#8E939D] bg-slate-800/50">{vip.department}</Badge>
                      {vip.status === 'pending' && <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest animate-pulse">PENDING</Badge>}
                      {vip.status === 'in-progress' && <Badge className="bg-blue-500/10 text-blue-400 border-0 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-[8px] uppercase tracking-widest">IN PROGRESS</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 6️⃣ Performance & Forecast */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 flex-1 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#0ea5e9]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-4 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">PERFORMANCE & FORECAST</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {/* Occupancy Trend */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C6270]">OCCUPANCY TREND</span>
                  <Badge className="bg-[#0ea5e9]/10 text-[#0ea5e9] border-0 shadow-[0_0_10px_rgba(14,165,233,0.2)] text-[8px] uppercase tracking-widest">78% AVG</Badge>
                </div>
                <div className="h-16 flex items-end gap-1.5 group/chart">
                  {forecast.occupancyTrend.slice(-7).map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group/bar cursor-pointer">
                      <div 
                        className="w-full bg-[#00f2ff]/20 border border-[#00f2ff]/30 rounded-t group-hover/bar:bg-[#00f2ff]/60 group-hover/bar:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all"
                        style={{ height: `${val * 0.7}px` }}
                      />
                      <span className="text-[8px] text-[#5C6270] font-bold tracking-wider mt-1.5 group-hover/bar:text-[#00f2ff] transition-colors">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Forecast */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C6270]">REVENUE FORECAST</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">NEXT 30 DAYS</Badge>
                </div>
                <div className="h-16 flex items-end gap-1.5 group/chart">
                  {forecast.revenueForecast.slice(-7).map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group/bar cursor-pointer">
                      <div 
                        className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-t group-hover/bar:bg-emerald-500/60 group-hover/bar:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all"
                        style={{ height: `${val * 0.15}px` }}
                      />
                      <span className="text-[8px] text-[#5C6270] font-bold tracking-wider mt-1.5 group-hover/bar:text-emerald-400 transition-colors">{val}K</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#00f2ff]/10">
                <div className="text-center p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 transition-colors cursor-default">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">30 DAY</p>
                  <p className="text-lg font-bold text-[#0ea5e9] drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]">{forecast.next30Days}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-amber-400/30 hover:bg-amber-400/10 transition-colors cursor-default">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">60 DAY</p>
                  <p className="text-lg font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{forecast.next60Days}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-emerald-400/30 hover:bg-emerald-400/10 transition-colors cursor-default">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">90 DAY</p>
                  <p className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{forecast.next90Days}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 7️⃣ Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Button className="bg-[#0a0c10] border border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 hover:border-[#0ea5e9]/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] text-[#0ea5e9] h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <ClipboardList className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]" />
          ASSIGN TASK
        </Button>
        <Button className="bg-[#0a0c10] border border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] text-amber-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <Bell className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
          SEND ALERT
        </Button>
        <Button className="bg-[#0a0c10] border border-purple-400/30 hover:bg-purple-400/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <FileText className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" />
          VIEW REPORTS
        </Button>
        <Button className="bg-[#0a0c10] border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] text-[#00f2ff] h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <Edit className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />
          QUICK NOTES
        </Button>
      </div>
    </div>
  );
}

// Missing import
import { Crown } from 'lucide-react';