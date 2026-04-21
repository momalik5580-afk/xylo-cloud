'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  // Main icons
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  CreditCard,
  Wallet,
  Receipt,
  PiggyBank,
  Calculator,
  FileText,
  FileSpreadsheet,
  Building2,
  BarChart3,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Bell,
  BellRing,
  Plus,
  Edit,
  Send,
  ClipboardCheck,
  BadgeDollarSign,
  Coins,
  Landmark,
  ScrollText,
  Scale
} from 'lucide-react';

// ==========================================
// HELPER FUNCTIONS (Same as GM Overview)
// ==========================================

const getKpiStatusColor = (status: string) => {
  switch (status) {
    case 'good': return 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]';
    case 'warning': return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]';
    case 'critical': return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    case 'info': return 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]';
    case 'excellent': return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]';
    default: return 'text-[#8E939D]';
  }
};

const getKpiStatusBadge = (status: string) => {
  switch (status) {
    case 'good': return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">OK</Badge>;
    case 'warning': return <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest">WARNING</Badge>;
    case 'critical': return <Badge className="bg-red-500/10 text-red-500 border-0 shadow-[0_0_10px_rgba(239,68,68,0.2)] text-[8px] uppercase tracking-widest animate-pulse">CRITICAL</Badge>;
    case 'info': return <Badge className="bg-purple-500/10 text-purple-400 border-0 shadow-[0_0_10px_rgba(192,132,252,0.2)] text-[8px] uppercase tracking-widest">INFO</Badge>;
    case 'excellent': return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">EXCELLENT</Badge>;
    default: return null;
  }
};

const getActivityIcon = (status: string) => {
  switch (status) {
    case 'success': return <CheckCircle2 className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />;
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]" />;
    case 'info': return <Info className="h-4 w-4 text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.4)]" />;
    case 'pending': return <Clock className="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />;
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Excellent': return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">EXCELLENT</Badge>;
    case 'Good': return <Badge className="bg-blue-500/10 text-blue-400 border-0 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-[8px] uppercase tracking-widest">GOOD</Badge>;
    case 'At Target': return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">AT TARGET</Badge>;
    case 'Warning': return <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest">WARNING</Badge>;
    case 'High': return <Badge className="bg-orange-500/10 text-orange-400 border-0 shadow-[0_0_10px_rgba(251,146,60,0.2)] text-[8px] uppercase tracking-widest">HIGH</Badge>;
    case 'Complete': return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">COMPLETE</Badge>;
    case 'In Progress': return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">IN PROGRESS</Badge>;
    case 'Pending': return <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest">PENDING</Badge>;
    case 'Compliant': return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">COMPLIANT</Badge>;
    case 'Scheduled': return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">SCHEDULED</Badge>;
    default: return <Badge className="bg-slate-700/50 text-[#8E939D] text-[8px] uppercase tracking-widest border-0">{status}</Badge>;
  }
};

const getVarianceBadge = (variance: string) => {
  if (variance.startsWith('+')) {
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">{variance}</Badge>;
  } else if (variance.startsWith('-')) {
    return <Badge className="bg-red-500/10 text-red-400 border-0 shadow-[0_0_10px_rgba(239,68,68,0.2)] text-[8px] uppercase tracking-widest">{variance}</Badge>;
  }
  return <Badge className="bg-slate-700/50 text-[#8E939D] text-[8px] uppercase tracking-widest border-0">{variance}</Badge>;
};

export function FinanceContent() {
  const [selectedDate] = useState('2026-03-02');

  // ==========================================
  // 1️⃣ TOP KPI DATA
  // ==========================================
  
  const kpis = {
    totalRevenue: { value: 291100, target: 275000, status: 'good' },
    totalBudget: { value: 275000, status: 'info' },
    foodCost: { value: 30.0, target: 28.0, status: 'warning' },
    laborCost: { value: 31.6, target: 35.0, status: 'excellent' },
    gopMargin: { value: 38, target: 36, status: 'good' },
    pendingApprovals: { value: 8, status: 'warning' }
  };

  // ==========================================
  // 2️⃣ FINANCIAL DEPARTMENTS SNAPSHOTS
  // ==========================================
  
  const departments = {
    revenueControl: {
      roomsRevenue: 165750,
      fAndBRevenue: 108900,
      otherRevenue: 16450,
      totalRevenue: 291100,
      budget: 275000,
      variance: '+5.9%'
    },
    costControl: {
      foodCost: 28500,
      laborCost: 92000,
      totalCost: 120500,
      foodCostPct: 30.0,
      laborCostPct: 31.6,
      status: 'warning'
    },
    cashFlow: {
      openingBalance: 125000,
      totalInflow: 255000,
      totalOutflow: 117000,
      closingBalance: 263000,
      forecastVsActual: '+12,000'
    },
    compliance: {
      pendingApprovals: 8,
      complianceIssues: 2,
      lastAudit: 'Feb 15, 2026',
      nextAudit: 'Mar 15, 2026',
      status: 'warning'
    },
    monthEnd: {
      progress: 65,
      tasksComplete: 1,
      tasksTotal: 4,
      targetDate: 'Mar 7, 2026',
      status: 'info'
    },
    budgeting: {
      ytdActual: 24800000,
      ytdBudget: 24000000,
      variance: '+3.3%',
      annualBudget: 98000000,
      projected: 101500000
    }
  };

  // ==========================================
  // 3️⃣ ALERTS PANEL
  // ==========================================
  
  const alerts = [
    { 
      id: 'FIN-001',
      priority: 'high',
      message: 'Food Cost Variance +2% Above Target',
      department: 'Cost Control',
      time: '10 min ago',
      actionable: true
    },
    { 
      id: 'FIN-002',
      priority: 'high',
      message: '8 Pending Payment Approvals',
      department: 'Compliance',
      time: '25 min ago',
      actionable: true
    },
    { 
      id: 'FIN-003',
      priority: 'medium',
      message: 'Room Service Food Cost 33.9%',
      department: 'F&B Cost',
      time: '1 hour ago',
      actionable: true
    },
    { 
      id: 'FIN-004',
      priority: 'medium',
      message: 'Spa Labor Cost 68.6% - Review Needed',
      department: 'Labor Cost',
      time: '2 hours ago',
      actionable: true
    },
    { 
      id: 'FIN-005',
      priority: 'low',
      message: 'Month-End Progress: 65% Complete',
      department: 'Month-End',
      time: '3 hours ago',
      actionable: false
    },
    { 
      id: 'FIN-006',
      priority: 'info',
      message: 'Budget vs Actual: Revenue +3.3% YTD',
      department: 'Budgeting',
      time: '4 hours ago',
      actionable: false
    }
  ];

  // ==========================================
  // 4️⃣ RECENT ACTIVITIES
  // ==========================================
  
  const activities = [
    {
      id: 'ACT-001',
      time: '08:50 AM',
      description: 'Night Audit Completed Successfully',
      department: 'Revenue Control',
      status: 'success'
    },
    {
      id: 'ACT-002',
      time: '08:35 AM',
      description: 'Bank Reconciliation Started',
      department: 'Cash Flow',
      status: 'pending'
    },
    {
      id: 'ACT-003',
      time: '08:20 AM',
      description: 'Spa Payroll Adjustment Processed',
      department: 'Cost Control',
      status: 'warning'
    },
    {
      id: 'ACT-004',
      time: '08:00 AM',
      description: 'Room Service Invoice Flagged',
      department: 'Compliance',
      status: 'warning'
    },
    {
      id: 'ACT-005',
      time: '07:45 AM',
      description: 'Banquet Revenue Posted',
      department: 'Revenue Control',
      status: 'success'
    },
    {
      id: 'ACT-006',
      time: '07:30 AM',
      description: 'Azure Restaurant Settlement Pending',
      department: 'Revenue Control',
      status: 'info'
    }
  ];

  // ==========================================
  // 5️⃣ PENDING ITEMS MONITORING
  // ==========================================
  
  const pendingItems = [
    {
      id: 'PEND-001',
      type: 'Transaction',
      description: 'Restaurant - Azure Settlement',
      amount: 245.50,
      status: 'pending',
      department: 'Revenue',
      time: 'Awaiting settlement'
    },
    {
      id: 'PEND-002',
      type: 'Transaction',
      description: 'Room 1823 - Minibar',
      amount: 78.50,
      status: 'pending',
      department: 'Revenue',
      time: 'Guest checkout tomorrow'
    },
    {
      id: 'PEND-003',
      type: 'Approval',
      description: 'Sysco Foods Payment',
      amount: 45000,
      status: 'scheduled',
      department: 'AP',
      time: 'Due: Mar 4'
    },
    {
      id: 'PEND-004',
      type: 'Approval',
      description: 'Ecolab Payment',
      amount: 12500,
      status: 'scheduled',
      department: 'AP',
      time: 'Due: Mar 5'
    }
  ];

  // ==========================================
  // 6️⃣ PERFORMANCE & FORECAST
  // ==========================================
  
  const forecast = {
    revenueTrend: [265, 272, 278, 285, 291, 288, 280, 291],
    costTrend: [118, 120, 122, 119, 121, 120, 119, 120],
    weeklyProjection: 1850000,
    monthlyProjection: 8500000,
    vsBudget: '+3.3%'
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
          CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> FINANCE OVERVIEW
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
          { label: "TOTAL REVENUE", val: `$${(kpis.totalRevenue.value/1000).toFixed(0)}K`, target: `$${(kpis.totalRevenue.target/1000).toFixed(0)}K`, status: kpis.totalRevenue.status },
          { label: "FOOD COST", val: `${kpis.foodCost.value}%`, target: `${kpis.foodCost.target}%`, status: kpis.foodCost.status },
          { label: "LABOR COST", val: `${kpis.laborCost.value}%`, target: `${kpis.laborCost.target}%`, status: kpis.laborCost.status },
          { label: "GOP MARGIN", val: `${kpis.gopMargin.value}%`, target: `${kpis.gopMargin.target}%`, icon: TrendingUp, status: kpis.gopMargin.status },
          { label: "PENDING APS", val: kpis.pendingApprovals.value, icon: Clock, customBadge: "ACTION REQ", status: kpis.pendingApprovals.status },
          { label: "VARIANCE", val: `+5.9%`, icon: BadgeDollarSign, customBadge: "VS BUDGET", status: 'good' }
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
        {/* Left Column - Financial Department Snapshots */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 2️⃣ Financial Department Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'revenue', title: 'REVENUE CONTROL', icon: BadgeDollarSign, iconColor: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]',
                stats: [
                  { label: 'ROOMS', val: `$${(departments.revenueControl.roomsRevenue/1000).toFixed(0)}K`, color: 'text-blue-400' },
                  { label: 'F&B', val: `$${(departments.revenueControl.fAndBRevenue/1000).toFixed(0)}K`, color: 'text-amber-400' },
                  { label: 'OTHER', val: `$${(departments.revenueControl.otherRevenue/1000).toFixed(0)}K`, color: 'text-purple-400' },
                  { label: 'TOTAL', val: `$${(departments.revenueControl.totalRevenue/1000).toFixed(0)}K`, color: 'text-emerald-400' }
                ],
                footer: `BUDGET: $${(departments.revenueControl.budget/1000).toFixed(0)}K // VARIANCE: +5.9%`
              },
              {
                id: 'cost', title: 'COST CONTROL', icon: Calculator, iconColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]',
                stats: [
                  { label: 'FOOD COST', val: `${departments.costControl.foodCostPct}%`, color: 'text-amber-400' },
                  { label: 'LABOR COST', val: `${departments.costControl.laborCostPct}%`, color: 'text-blue-400' },
                  { label: 'TOTAL COST', val: `$${(departments.costControl.totalCost/1000).toFixed(0)}K`, color: 'text-[#8E939D]' },
                  { label: 'DAILY COST', val: `$${(departments.costControl.foodCost + departments.costControl.laborCost)/1000}K`, color: 'text-red-400' }
                ],
                footer: `STATUS: WARNING - Food Cost Above Target`
              },
              {
                id: 'cashflow', title: 'CASH FLOW', icon: Wallet, iconColor: 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]',
                stats: [
                  { label: 'OPENING', val: `$${(departments.cashFlow.openingBalance/1000).toFixed(0)}K`, color: 'text-[#8E939D]' },
                  { label: 'INFLOW', val: `$${(departments.cashFlow.totalInflow/1000).toFixed(0)}K`, color: 'text-emerald-400' },
                  { label: 'OUTFLOW', val: `$${(departments.cashFlow.totalOutflow/1000).toFixed(0)}K`, color: 'text-red-400' },
                  { label: 'CLOSING', val: `$${(departments.cashFlow.closingBalance/1000).toFixed(0)}K`, color: 'text-[#00f2ff]' }
                ],
                footer: `FORECAST: +$12K Above Projection`
              },
              {
                id: 'compliance', title: 'COMPLIANCE', icon: Shield, iconColor: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]',
                stats: [
                  { label: 'PENDING APS', val: departments.compliance.pendingApprovals, color: 'text-amber-400' },
                  { label: 'ISSUES', val: departments.compliance.complianceIssues, color: 'text-red-400' },
                  { label: 'LAST AUDIT', val: 'Feb 15', color: 'text-[#8E939D]' },
                  { label: 'NEXT AUDIT', val: 'Mar 15', color: 'text-purple-400' }
                ],
                footer: `ACTION REQUIRED: Review Pending Approvals`
              },
              {
                id: 'monthend', title: 'MONTH-END', icon: FileSpreadsheet, iconColor: 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]',
                stats: [
                  { label: 'PROGRESS', val: `${departments.monthEnd.progress}%`, color: 'text-[#00f2ff]' },
                  { label: 'TASKS DONE', val: `${departments.monthEnd.tasksComplete}/${departments.monthEnd.tasksTotal}`, color: 'text-emerald-400' },
                  { label: 'TARGET DATE', val: 'Mar 7', color: 'text-blue-400' },
                  { label: 'STATUS', val: 'In Progress', color: 'text-amber-400' }
                ],
                footer: `INCOME AUDIT: In Progress`
              },
              {
                id: 'budget', title: 'BUDGETING', icon: BarChart3, iconColor: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]',
                stats: [
                  { label: 'YTD ACTUAL', val: `$${(departments.budgeting.ytdActual/1000000).toFixed(1)}M`, color: 'text-emerald-400' },
                  { label: 'YTD BUDGET', val: `$${(departments.budgeting.ytdBudget/1000000).toFixed(1)}M`, color: 'text-[#8E939D]' },
                  { label: 'ANNUAL BUD', val: `$${(departments.budgeting.annualBudget/1000000).toFixed(0)}M`, color: 'text-blue-400' },
                  { label: 'PROJECTED', val: `$${(departments.budgeting.projected/1000000).toFixed(1)}M`, color: 'text-purple-400' }
                ],
                footer: `YTD VARIANCE: +3.3% Above Budget`
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

        {/* Right Column - Alerts & Pending Items */}
        <div className="flex flex-col gap-6">
          {/* 3️⃣ Alerts Panel */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>FINANCIAL ALERTS</span>
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

          {/* 5️⃣ Pending Items Monitoring */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_4px_rgba(0,242,255,0.2)]" />
                PENDING ITEMS
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/10 hover:shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all cursor-pointer group/pending">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover/pending:text-[#00f2ff] transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">{item.description}</span>
                      <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] text-[8px] uppercase tracking-widest">${item.amount.toLocaleString()}</Badge>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">DEPT: <span className="text-slate-300">{item.department}</span></p>
                    <p className="text-[9px] font-bold tracking-wide text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.25)] mb-3">{item.time}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-600/50 text-[8px] uppercase tracking-widest font-bold text-[#8E939D] bg-slate-800/50">{item.type}</Badge>
                      {item.status === 'pending' && <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest animate-pulse">PENDING</Badge>}
                      {item.status === 'scheduled' && <Badge className="bg-blue-500/10 text-blue-400 border-0 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-[8px] uppercase tracking-widest">SCHEDULED</Badge>}
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
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">FINANCIAL PERFORMANCE</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {/* Revenue Trend */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C6270]">REVENUE TREND</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">+$291K AVG</Badge>
                </div>
                <div className="h-16 flex items-end gap-1.5 group/chart">
                  {forecast.revenueTrend.slice(-7).map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group/bar cursor-pointer">
                      <div 
                        className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-t group-hover/bar:bg-emerald-500/60 group-hover/bar:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all"
                        style={{ height: `${val * 0.6}px` }}
                      />
                      <span className="text-[8px] text-[#5C6270] font-bold tracking-wider mt-1.5 group-hover/bar:text-emerald-400 transition-colors">{val}K</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Trend */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C6270]">COST TREND</span>
                  <Badge className="bg-amber-500/10 text-amber-400 border-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[8px] uppercase tracking-widest">$120K AVG</Badge>
                </div>
                <div className="h-16 flex items-end gap-1.5 group/chart">
                  {forecast.costTrend.slice(-7).map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group/bar cursor-pointer">
                      <div 
                        className="w-full bg-amber-500/20 border border-amber-500/30 rounded-t group-hover/bar:bg-amber-500/60 group-hover/bar:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all"
                        style={{ height: `${val * 0.6}px` }}
                      />
                      <span className="text-[8px] text-[#5C6270] font-bold tracking-wider mt-1.5 group-hover/bar:text-amber-400 transition-colors">{val}K</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#00f2ff]/10">
                <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-400/30 hover:bg-emerald-500/10 transition-colors cursor-default">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">WEEKLY</p>
                  <p className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">${(forecast.weeklyProjection/1000).toFixed(0)}K</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 transition-colors cursor-default">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">MONTHLY</p>
                  <p className="text-lg font-bold text-[#0ea5e9] drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]">${(forecast.monthlyProjection/1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#00f2ff]/10 text-center">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-0 shadow-[0_0_10px_rgba(52,211,153,0.2)] text-[8px] uppercase tracking-widest">
                  VS BUDGET: {forecast.vsBudget}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 7️⃣ Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Button className="bg-[#0a0c10] border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] text-emerald-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <ClipboardCheck className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]" />
          APPROVE PAYMENTS
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
