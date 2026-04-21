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
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Clock,
  Target,
  Award,
  Star,
  
  // Sales icons
  Briefcase,
  Building2,
  Users,
  UserPlus,
  Handshake,
  FileText,
  FileSignature,
  FileCheck,
  FileWarning,
  ClipboardList,
  ClipboardCheck,
  
  // Marketing icons
  Globe,
  Mail,
  MessageSquare,
  Share2,
  ThumbsUp,
  Eye,
  EyeOff,
  Zap,
  Flame,
  Rocket,
  
  // Revenue icons
  Hotel,
  BedDouble,
  Coffee,
  Wine,
  CalendarDays,
  CreditCard,
  Wallet,
  
  // Channel icons
  Wifi,
  WifiOff,
  Network,
  Radio,
  Satellite,
  
  // Alert icons
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  
  // Action icons
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Bell,
  BellRing
} from 'lucide-react';

export function SalesContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('revenue');

  // ==========================================
  // 1️⃣ REVENUE CONTROL PANEL
  // ==========================================
  
  const revenue = {
    today: {
      date: 'March 2, 2026',
      occupancy: 78,
      roomsSold: 390,
      totalRooms: 500,
      adr: 425,
      revpar: 331.50,
      roomRevenue: 165750,
      fAndBRevenue: 108900,
      spaRevenue: 8450,
      totalRevenue: 291100,
      vsBudget: '+5.9%',
      vsLastYear: '+3.2%'
    },
    
    segments: [
      { name: 'Corporate', revenue: 58200, rooms: 124, adr: 469, occupancy: 82, vsBudget: '+4.2%' },
      { name: 'Leisure', revenue: 62400, rooms: 156, adr: 400, occupancy: 75, vsBudget: '+2.1%' },
      { name: 'MICE', revenue: 28500, rooms: 65, adr: 438, occupancy: 90, vsBudget: '+8.5%' },
      { name: 'Contract', revenue: 12450, rooms: 35, adr: 356, occupancy: 70, vsBudget: '-1.2%' },
      { name: 'Wholesale', revenue: 4200, rooms: 10, adr: 420, occupancy: 65, vsBudget: '-3.5%' }
    ],
    
    bookingPace: {
      today: 45,
      yesterday: 38,
      lastWeek: 42,
      forecast: 52,
      pickup: '+18%'
    },
    
    paceChart: [
      { date: 'Mar 3', bookings: 42 },
      { date: 'Mar 4', bookings: 38 },
      { date: 'Mar 5', bookings: 45 },
      { date: 'Mar 6', bookings: 51 },
      { date: 'Mar 7', bookings: 48 },
      { date: 'Mar 8', bookings: 44 },
      { date: 'Mar 9', bookings: 39 }
    ]
  };

  // ==========================================
  // 2️⃣ SALES CRM PANEL
  // ==========================================
  
  const sales = {
    activeAccounts: 245,
    newAccounts: 8,
    targetAccounts: 260,
    
    portfolio: [
      { 
        id: 'ACC-001', 
        name: 'Goldman Sachs', 
        type: 'Corporate', 
        manager: 'Sarah Chen',
        annualRevenue: 450000,
        roomNights: 1250,
        adr: 495,
        lastBooking: 'Feb 28',
        status: 'Active',
        nextReview: 'Mar 15'
      },
      { 
        id: 'ACC-002', 
        name: 'American Express', 
        type: 'Corporate', 
        manager: 'Michael Lee',
        annualRevenue: 380000,
        roomNights: 980,
        adr: 475,
        lastBooking: 'Mar 1',
        status: 'Active',
        nextReview: 'Mar 20'
      },
      { 
        id: 'ACC-003', 
        name: 'JPMorgan Chase', 
        type: 'Corporate', 
        manager: 'Sarah Chen',
        annualRevenue: 295000,
        roomNights: 720,
        adr: 485,
        lastBooking: 'Feb 25',
        status: 'At Risk',
        nextReview: 'Mar 10'
      },
      { 
        id: 'ACC-004', 
        name: 'LVMH', 
        type: 'Luxury', 
        manager: 'David Kim',
        annualRevenue: 520000,
        roomNights: 1100,
        adr: 650,
        lastBooking: 'Mar 2',
        status: 'Active',
        nextReview: 'Mar 18'
      },
      { 
        id: 'ACC-005', 
        name: 'Google', 
        type: 'Corporate', 
        manager: 'Michael Lee',
        annualRevenue: 410000,
        roomNights: 890,
        adr: 510,
        lastBooking: 'Feb 28',
        status: 'Active',
        nextReview: 'Mar 22'
      },
      { 
        id: 'ACC-006', 
        name: 'Signature Travel', 
        type: 'Agency', 
        manager: 'Jennifer Wu',
        annualRevenue: 185000,
        roomNights: 520,
        adr: 445,
        lastBooking: 'Feb 20',
        status: 'Dormant',
        nextReview: 'Mar 25'
      }
    ],
    
    pipeline: {
      leads: 38,
      proposals: 15,
      negotiations: 8,
      won: 4,
      lost: 3,
      value: 1250000
    },
    
    contractExpiry: [
      { account: 'Goldman Sachs', expiry: 'Jun 30, 2026', daysLeft: 120, status: 'Green' },
      { account: 'Amex', expiry: 'Apr 15, 2026', daysLeft: 44, status: 'Yellow' },
      { account: 'JPMorgan', expiry: 'Mar 31, 2026', daysLeft: 29, status: 'Red' },
      { account: 'LVMH', expiry: 'Aug 15, 2026', daysLeft: 166, status: 'Green' }
    ],
    
   conversion: {
  leads: 38,
  meetings: 22,
  proposals: 15,
  won: 4,
  lost: 3,           // ← ADD THIS LINE
  conversionRate: 10.5,
  avgSalesCycle: 45
}
  };

  // ==========================================
  // 3️⃣ MARKETING PANEL
  // ==========================================
  
  const marketing = {
    website: {
      visitors: 4850,
      sessions: 6240,
      bounceRate: 38,
      avgSession: '2:45',
      conversionRate: 2.8,
      directBookings: 42,
      revenue: 28500
    },
    
    campaigns: [
      { 
        name: 'Spring Luxury Escape', 
        channel: 'Email/Paid', 
        spend: 8500,
        impressions: 125000,
        clicks: 3850,
        bookings: 28,
        revenue: 28500,
        roas: 3.35,
        status: 'Active'
      },
      { 
        name: 'Corporate Retreat', 
        channel: 'LinkedIn', 
        spend: 6200,
        impressions: 89000,
        clicks: 1240,
        bookings: 12,
        revenue: 18400,
        roas: 2.97,
        status: 'Active'
      },
      { 
        name: 'Wedding Showcase', 
        channel: 'Instagram', 
        spend: 4200,
        impressions: 156000,
        clicks: 2100,
        bookings: 8,
        revenue: 18500,
        roas: 4.40,
        status: 'Completed'
      },
      { 
        name: 'Summer Campaign', 
        channel: 'Google Ads', 
        spend: 9500,
        impressions: 245000,
        clicks: 5200,
        bookings: 35,
        revenue: 42500,
        roas: 4.47,
        status: 'Planned'
      }
    ],
    
    social: {
      followers: 185000,
      engagement: 4.2,
      posts: 18,
      reach: 245000,
      sentiment: 92
    },
    
    reputation: {
      tripAdvisor: 4.7,
      google: 4.6,
      booking: 9.2,
      yelp: 4.5,
      reviews: 124,
      responseRate: 98
    },
    
    costPerBooking: 185,
    directBookingPercentage: 42
  };

  // ==========================================
  // 4️⃣ REVENUE FORECAST ENGINE
  // ==========================================
  
  const forecast = {
    thirtyDay: {
      occupancy: 82,
      adr: 435,
      revpar: 356.70,
      revenue: 1850000,
      confidence: 92,
      vsBudget: '+4.2%'
    },
    
    sixtyDay: {
      occupancy: 78,
      adr: 428,
      revpar: 333.84,
      revenue: 3520000,
      confidence: 85,
      vsBudget: '+2.8%'
    },
    
    ninetyDay: {
      occupancy: 74,
      adr: 415,
      revpar: 307.10,
      revenue: 4850000,
      confidence: 76,
      vsBudget: '+1.5%'
    },
    
    demand: [
      { date: 'Mar 10-16', demand: 92, rate: 495, events: 'Spring Break' },
      { date: 'Mar 17-23', demand: 78, rate: 425, events: 'Normal' },
      { date: 'Mar 24-30', demand: 85, rate: 450, events: 'Corporate Week' },
      { date: 'Mar 31-Apr 6', demand: 95, rate: 520, events: 'Easter Holiday' },
      { date: 'Apr 7-13', demand: 72, rate: 395, events: 'Low Season' }
    ],
    
    pickup: {
      yesterday: 38,
      today: 45,
      forecast: 52,
      trend: 'Accelerating',
      risk: 'Low'
    },
    
    overbookingRisk: {
      critical: 2,
      high: 3,
      medium: 5,
      low: 12
    }
  };

  // ==========================================
  // 5️⃣ DISTRIBUTION CHANNEL MIX
  // ==========================================
  
  const channels = {
    direct: { percentage: 42, revenue: 122262, commission: 0, net: 122262 },
    corporate: { percentage: 28, revenue: 81508, commission: 0, net: 81508 },
    gds: { percentage: 8, revenue: 23288, commission: 10, net: 20959 },
    ota: { percentage: 15, revenue: 43665, commission: 18, net: 35805 },
    tourOperator: { percentage: 7, revenue: 20377, commission: 15, net: 17320 },
    total: { revenue: 291100, commission: 14246, net: 276854 }
  };

  // ==========================================
  // 6️⃣ COMPETITOR INTELLIGENCE
  // ==========================================
  
  const competitors = [
    { name: 'Four Seasons', occupancy: 82, adr: 595, revpar: 488, ourVsThem: '-$170' },
    { name: 'Ritz-Carlton', occupancy: 79, adr: 550, revpar: 435, ourVsThem: '-$125' },
    { name: 'St. Regis', occupancy: 75, adr: 480, revpar: 360, ourVsThem: '-$55' },
    { name: 'Park Hyatt', occupancy: 76, adr: 445, revpar: 338, ourVsThem: '-$20' }
  ];

  // ==========================================
  // 7️⃣ LOST BUSINESS ANALYSIS
  // ==========================================
  
  const lostBusiness = [
    { account: 'Microsoft', reason: 'Rate', rooms: 120, value: 58000, date: 'Feb 28' },
    { account: 'Meta', reason: 'Availability', rooms: 85, value: 38500, date: 'Feb 25' },
    { account: 'BCG', reason: 'Competitor Rate', rooms: 45, value: 19800, date: 'Feb 22' }
  ];

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Active</Badge>;
      case 'At Risk': return <Badge className="bg-amber-600 hover:bg-amber-700">At Risk</Badge>;
      case 'Dormant': return <Badge className="bg-slate-600 hover:bg-slate-700">Dormant</Badge>;
      case 'Green': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Healthy</Badge>;
      case 'Yellow': return <Badge className="bg-amber-600 hover:bg-amber-700">Expiring Soon</Badge>;
      case 'Red': return <Badge className="bg-red-600 hover:bg-red-700">Critical</Badge>;
      case 'Completed': return <Badge className="bg-blue-600 hover:bg-blue-700">Completed</Badge>;
      case 'Planned': return <Badge className="bg-purple-600 hover:bg-purple-700">Planned</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVarianceBadge = (variance: string) => {
    if (variance.startsWith('+')) {
      return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">{variance}</Badge>;
    } else if (variance.startsWith('-')) {
      return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">{variance}</Badge>;
    } else {
      return <Badge className="bg-slate-600/20 text-[#8E939D] border-slate-600/30">{variance}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'direct': return <Hotel className="h-4 w-4 text-emerald-400" />;
      case 'corporate': return <Briefcase className="h-4 w-4 text-blue-400" />;
      case 'gds': return <Globe className="h-4 w-4 text-purple-400" />;
      case 'ota': return <Wifi className="h-4 w-4 text-amber-400" />;
      case 'tourOperator': return <Users className="h-4 w-4 text-cyan-400" />;
      default: return <CreditCard className="h-4 w-4 text-[#8E939D]" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> SALES & MARKETING
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] mt-2 group-hover:text-[#00f2ff]/70 transition-colors">
            REVENUE <span className="text-[#00f2ff]/30 mx-1">/</span> SALES <span className="text-[#00f2ff]/30 mx-1">/</span> MARKETING <span className="text-[#00f2ff]/30 mx-1">/</span> DISTRIBUTION
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-[#0a0c10] border border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 hover:border-[#0ea5e9]/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] text-[#0ea5e9] h-10 text-[10px] font-bold uppercase tracking-widest transition-all">
            <Calendar className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]" />
            {revenue.today.date.toUpperCase()}
          </Button>
          <Button className="bg-[#0a0c10] border border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] text-amber-400 h-10 text-[10px] font-bold uppercase tracking-widest transition-all">
            <Target className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
            REVENUE REVIEW
          </Button>
        </div>
      </div>

      {/* Live Revenue Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">Occupancy</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#8E939D]">{revenue.today.occupancy}%</span>
              <span className="text-xs text-[#5C6270]">{revenue.today.roomsSold}/{revenue.today.totalRooms}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">ADR</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#8E939D]">${revenue.today.adr}</span>
              {getVarianceBadge('+2.1%')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">RevPAR</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-400">${revenue.today.revpar}</span>
              {getVarianceBadge('+4.8%')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">Room Revenue</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#8E939D]">${(revenue.today.roomRevenue/1000).toFixed(0)}K</span>
              {getVarianceBadge(revenue.today.vsBudget)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">Booking Pace</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-400">{revenue.bookingPace.today}</span>
              <Badge className="bg-emerald-600/20 text-emerald-400">{revenue.bookingPace.pickup}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 flex-wrap">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700">1️⃣ Revenue Control</TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-slate-700">2️⃣ Sales CRM</TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-slate-700">3️⃣ Marketing</TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-slate-700">4️⃣ Forecast Engine</TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-slate-700">5️⃣ Distribution</TabsTrigger>
          <TabsTrigger value="intelligence" className="data-[state=active]:bg-slate-700">6️⃣ Market Intel</TabsTrigger>
        </TabsList>

        {/* 1️⃣ REVENUE CONTROL */}
        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Revenue by Segment</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {revenue.segments.map((segment, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{segment.name}</span>
                        <span className="text-xs text-[#5C6270] ml-2">ADR: ${segment.adr}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-300">${(segment.revenue/1000).toFixed(0)}K</span>
                        {getVarianceBadge(segment.vsBudget)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#8E939D]">
                      <span>{segment.rooms} rooms</span>
                      <span>{segment.occupancy}% occ</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Booking Pace - Next 7 Days</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#8E939D]">Today's Bookings</p>
                  <p className="text-2xl font-bold text-blue-400">{revenue.bookingPace.today}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8E939D]">Forecast</p>
                  <p className="text-2xl font-bold text-emerald-400">{revenue.bookingPace.forecast}</p>
                </div>
                <Badge className="bg-emerald-600/20 text-emerald-400 text-lg p-3">
                  Pickup: {revenue.bookingPace.pickup}
                </Badge>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {revenue.paceChart.map((day, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs text-[#5C6270] mb-1">{day.date.split(' ')[1]}</div>
                    <div className="h-16 bg-[#00f2ff]/5 rounded-lg relative">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-500/50 rounded-lg" 
                        style={{ height: `${(day.bookings / 60) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-300 mt-1">{day.bookings}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2️⃣ SALES CRM */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Active Accounts</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-blue-400">{sales.activeAccounts}</p>
                <p className="text-xs text-emerald-400 mt-1">+{sales.newAccounts} this month</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Pipeline Value</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-emerald-400">${(sales.pipeline.value/1000000).toFixed(1)}M</p>
                <p className="text-xs text-[#8E939D] mt-1">{sales.pipeline.leads} leads · {sales.pipeline.proposals} proposals</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-amber-400">{sales.conversion.conversionRate}%</p>
                <p className="text-xs text-[#8E939D] mt-1">{sales.conversion.won} won · {sales.conversion.lost} lost</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Sales Cycle</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-purple-400">{sales.conversion.avgSalesCycle} days</p>
                <p className="text-xs text-[#8E939D] mt-1">Avg time to close</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>Account Portfolio</span>
                <Badge className="bg-red-600/20 text-red-400">{sales.contractExpiry.filter(c => c.status === 'Red').length} Contracts Expiring</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {sales.portfolio.map((account, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{account.name}</span>
                        <Badge variant="outline" className="border-slate-600 text-xs">{account.type}</Badge>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-xs text-[#8E939D] mt-1">
                        AM: {account.manager} · Last: {account.lastBooking} · Next: {account.nextReview}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">${(account.annualRevenue/1000).toFixed(0)}K</p>
                      <p className="text-xs text-[#5C6270]">{account.roomNights} nights</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Contract Renewal Alerts</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {sales.contractExpiry.map((contract, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{contract.account}</span>
                      <p className="text-xs text-[#8E939D] mt-1">Expires: {contract.expiry}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-300">{contract.daysLeft} days left</span>
                      {getStatusBadge(contract.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3️⃣ MARKETING */}
        <TabsContent value="marketing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Website Visitors</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-blue-400">{marketing.website.visitors}</p>
                <p className="text-xs text-[#8E939D] mt-1">{marketing.website.sessions} sessions</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-emerald-400">{marketing.website.conversionRate}%</p>
                <p className="text-xs text-[#8E939D] mt-1">{marketing.website.directBookings} bookings</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Social Reach</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-purple-400">{marketing.social.reach/1000}K</p>
                <p className="text-xs text-[#8E939D] mt-1">{marketing.social.engagement}% engagement</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Reputation</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-bold text-amber-400">{marketing.reputation.tripAdvisor}/5.0</p>
                <p className="text-xs text-[#8E939D] mt-1">{marketing.reputation.reviews} reviews</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {marketing.campaigns.map((campaign, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{campaign.name}</span>
                        <Badge variant="outline" className="ml-2 border-slate-600 text-xs">{campaign.channel}</Badge>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-[#8E939D]">Spend</span>
                        <p className="text-[#8E939D]">${campaign.spend}</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">Impressions</span>
                        <p className="text-[#8E939D]">{(campaign.impressions/1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">Clicks</span>
                        <p className="text-[#8E939D]">{campaign.clicks}</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">Bookings</span>
                        <p className="text-[#8E939D]">{campaign.bookings}</p>
                      </div>
                      <div>
                        <span className="text-[#8E939D]">ROAS</span>
                        <p className="text-emerald-400">{campaign.roas}x</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4️⃣ FORECAST ENGINE */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">30 Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-2xl font-bold text-[#8E939D]">{forecast.thirtyDay.occupancy}% Occ</p>
                <p className="text-lg text-emerald-400">${forecast.thirtyDay.adr} ADR</p>
                <p className="text-sm text-[#8E939D] mt-2">Revenue: ${(forecast.thirtyDay.revenue/1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-600/20 text-blue-400">{forecast.thirtyDay.confidence}% confidence</Badge>
                  {getVarianceBadge(forecast.thirtyDay.vsBudget)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">60 Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-2xl font-bold text-[#8E939D]">{forecast.sixtyDay.occupancy}% Occ</p>
                <p className="text-lg text-amber-400">${forecast.sixtyDay.adr} ADR</p>
                <p className="text-sm text-[#8E939D] mt-2">Revenue: ${(forecast.sixtyDay.revenue/1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-600/20 text-blue-400">{forecast.sixtyDay.confidence}% confidence</Badge>
                  {getVarianceBadge(forecast.sixtyDay.vsBudget)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">90 Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-2xl font-bold text-[#8E939D]">{forecast.ninetyDay.occupancy}% Occ</p>
                <p className="text-lg text-amber-400">${forecast.ninetyDay.adr} ADR</p>
                <p className="text-sm text-[#8E939D] mt-2">Revenue: ${(forecast.ninetyDay.revenue/1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-600/20 text-blue-400">{forecast.ninetyDay.confidence}% confidence</Badge>
                  {getVarianceBadge(forecast.ninetyDay.vsBudget)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Demand Heat Map</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {forecast.demand.map((period, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{period.date}</span>
                      <p className="text-xs text-[#8E939D] mt-1">{period.events}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#8E939D]">Demand</span>
                          <span className="text-xs text-slate-300">{period.demand}%</span>
                        </div>
                        <Progress value={period.demand} className="h-1.5 bg-slate-700" />
                      </div>
                      <span className="text-lg font-bold text-emerald-400">${period.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Overbooking Risk</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge className="bg-red-600 mb-2">Critical</Badge>
                  <p className="text-2xl font-bold text-red-400">{forecast.overbookingRisk.critical}</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-orange-600 mb-2">High</Badge>
                  <p className="text-2xl font-bold text-orange-400">{forecast.overbookingRisk.high}</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-amber-600 mb-2">Medium</Badge>
                  <p className="text-2xl font-bold text-amber-400">{forecast.overbookingRisk.medium}</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-emerald-600 mb-2">Low</Badge>
                  <p className="text-2xl font-bold text-emerald-400">{forecast.overbookingRisk.low}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5️⃣ DISTRIBUTION CHANNELS */}
        <TabsContent value="channels" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Channel Mix Analysis</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    {getChannelIcon('direct')}
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">Direct</span>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">No commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">${(channels.direct.net/1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#5C6270]">{channels.direct.percentage}% of total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/30 border border-blue-500/30">
                  <div className="flex items-center gap-3">
                    {getChannelIcon('corporate')}
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">Corporate</span>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">Direct contracts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-400">${(channels.corporate.net/1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#5C6270]">{channels.corporate.percentage}% of total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-950/30 border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    {getChannelIcon('gds')}
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">GDS</span>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">10% commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">${(channels.gds.net/1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#5C6270]">{channels.gds.percentage}% of total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    {getChannelIcon('ota')}
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">OTA</span>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">18% commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">${(channels.ota.net/1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#5C6270]">{channels.ota.percentage}% of total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <div className="flex items-center gap-3">
                    {getChannelIcon('tourOperator')}
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">Tour Operators</span>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#5C6270] group-hover:text-[#00f2ff] transition-colors group-hover/card:text-[#00f2ff] mb-2">15% commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">${(channels.tourOperator.net/1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#5C6270]">{channels.tourOperator.percentage}% of total</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#00f2ff]/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#8E939D]">Total Net Revenue</span>
                    <span className="text-2xl font-bold text-emerald-400">${(channels.total.net/1000).toFixed(0)}K</span>
                  </div>
                  <p className="text-xs text-[#8E939D] mt-1">Commission paid: ${(channels.total.commission/1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6️⃣ MARKET INTELLIGENCE */}
        <TabsContent value="intelligence" className="space-y-4">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Competitor Rate Comparison</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{comp.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="text-xs text-[#8E939D]">Occ</span>
                        <p className="text-sm text-slate-300">{comp.occupancy}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-[#8E939D]">ADR</span>
                        <p className="text-sm text-slate-300">${comp.adr}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-[#8E939D]">RevPAR</span>
                        <p className="text-sm text-slate-300">${comp.revpar}</p>
                      </div>
                      <Badge className="bg-red-600/20 text-red-400">{comp.ourVsThem}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Lost Business Analysis</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {lostBusiness.map((lost, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-950/30 border border-red-500/30">
                    <div>
                      <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{lost.account}</span>
                      <p className="text-xs text-[#8E939D] mt-1">Reason: {lost.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-400">{lost.rooms} rooms</p>
                      <p className="text-xs text-[#5C6270]">${(lost.value/1000).toFixed(0)}K value</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}