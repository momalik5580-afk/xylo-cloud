'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  // Main icons
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  UserCog,
  UserCircle,
  
  // Security icons
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  
  // Action icons
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  
  // Status icons
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  
  // Role icons
  Star,
  Award,
  Crown,
  Briefcase,
  Building2,
  
  // Analytics icons
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  
  // Department icons
  Hotel,
  BedDouble,
  Coffee,
  Wine,
  Wrench,
  Heart,
  Activity,
  
  // Table icons
  Table,
  Grid,
  List,
  Columns,
  
  // Export icons
  FileText,
  FileSpreadsheet,
  
  // Misc
  Mail,
  Phone,
  Globe,
  Settings,
  X
} from 'lucide-react';

// ==========================================
// INTERFACES
// ==========================================

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Staff' | 'Supervisor' | 'Manager' | 'Director' | 'GM' | 'Admin';
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  channels: ('Operations' | 'Executive')[];
  permissions: string[];
  startDate: string;
  endDate?: string;
  twoFactorEnabled: boolean;
  avatar?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  accessLevel: number;
  usersCount: number;
  permissions: Record<string, boolean>;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  actionType: string;
  reference: string;
  department: string;
  channel: string;
  status: string;
}

export function UsersContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('directory');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // ==========================================
  // 1️⃣ USER DIRECTORY DATA
  // ==========================================
  
  const users: User[] = [
    {
      id: 'USR-001',
      name: 'John Smith',
      email: 'john.smith@xylo.com',
      phone: '+971 50 123 4567',
      role: 'Supervisor',
      department: 'Housekeeping',
      status: 'Active',
      lastLogin: '2026-03-02 09:12',
      channels: ['Operations'],
      permissions: ['Task Assign', 'Shift Handover'],
      startDate: '2024-01-15',
      twoFactorEnabled: true
    },
    {
      id: 'USR-002',
      name: 'Sarah Lee',
      email: 'sarah.lee@xylo.com',
      phone: '+971 50 234 5678',
      role: 'Manager',
      department: 'F&B',
      status: 'Active',
      lastLogin: '2026-03-02 08:55',
      channels: ['Operations', 'Executive'],
      permissions: ['Task Assign', 'Report Access', 'Channel Admin'],
      startDate: '2023-06-20',
      twoFactorEnabled: true
    },
    {
      id: 'USR-003',
      name: 'Michael Wilson',
      email: 'michael.wilson@xylo.com',
      phone: '+971 50 345 6789',
      role: 'GM',
      department: 'Executive',
      status: 'Active',
      lastLogin: '2026-03-02 07:30',
      channels: ['Operations', 'Executive'],
      permissions: ['Full System Access', 'Report Access', 'Channel Admin', 'User Management'],
      startDate: '2022-11-01',
      twoFactorEnabled: true
    },
    {
      id: 'USR-004',
      name: 'Maria Santos',
      email: 'maria.santos@xylo.com',
      phone: '+971 50 456 7890',
      role: 'Staff',
      department: 'Housekeeping',
      status: 'Active',
      lastLogin: '2026-03-02 08:15',
      channels: ['Operations'],
      permissions: ['Task Updates'],
      startDate: '2025-02-10',
      twoFactorEnabled: false
    },
    {
      id: 'USR-005',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@xylo.com',
      phone: '+971 50 567 8901',
      role: 'Staff',
      department: 'Engineering',
      status: 'Inactive',
      lastLogin: '2026-02-28 16:20',
      channels: ['Operations'],
      permissions: ['Task Updates'],
      startDate: '2025-01-05',
      endDate: '2026-02-28',
      twoFactorEnabled: false
    },
    {
      id: 'USR-006',
      name: 'Elena Petrova',
      email: 'elena.petrova@xylo.com',
      phone: '+971 50 678 9012',
      role: 'Supervisor',
      department: 'Spa',
      status: 'Suspended',
      lastLogin: '2026-02-27 11:45',
      channels: ['Operations'],
      permissions: ['Task Assign', 'Shift Handover'],
      startDate: '2025-03-15',
      twoFactorEnabled: true
    },
    {
      id: 'USR-007',
      name: 'David Kim',
      email: 'david.kim@xylo.com',
      phone: '+971 50 789 0123',
      role: 'Manager',
      department: 'Engineering',
      status: 'Active',
      lastLogin: '2026-03-02 09:05',
      channels: ['Operations', 'Executive'],
      permissions: ['Task Assign', 'Report Access'],
      startDate: '2024-08-20',
      twoFactorEnabled: true
    },
    {
      id: 'USR-008',
      name: 'Lisa Chen',
      email: 'lisa.chen@xylo.com',
      phone: '+971 50 890 1234',
      role: 'Director',
      department: 'Sales',
      status: 'Active',
      lastLogin: '2026-03-02 08:45',
      channels: ['Operations', 'Executive'],
      permissions: ['Report Access', 'Channel Admin', 'Task Approval'],
      startDate: '2023-04-10',
      twoFactorEnabled: true
    },
    {
      id: 'USR-009',
      name: 'James Wilson',
      email: 'james.wilson@xylo.com',
      phone: '+971 50 901 2345',
      role: 'Admin',
      department: 'IT',
      status: 'Active',
      lastLogin: '2026-03-02 07:15',
      channels: ['Operations', 'Executive'],
      permissions: ['Full System Access', 'User Management', 'Audit Logs', 'Channel Admin'],
      startDate: '2022-01-15',
      twoFactorEnabled: true
    },
    {
      id: 'USR-010',
      name: 'Anna Schmidt',
      email: 'anna.schmidt@xylo.com',
      phone: '+971 50 012 3456',
      role: 'Manager',
      department: 'Front Office',
      status: 'Active',
      lastLogin: '2026-03-02 08:30',
      channels: ['Operations', 'Executive'],
      permissions: ['Task Assign', 'Report Access'],
      startDate: '2024-11-01',
      twoFactorEnabled: true
    }
  ];

  // ==========================================
  // 2️⃣ ROLES & PERMISSIONS
  // ==========================================
  
  const roles: Role[] = [
    {
      id: 'role-001',
      name: 'Staff',
      description: 'Line-level employee - Operations Channel only, Task updates',
      accessLevel: 1,
      usersCount: 320,
      permissions: {
        taskAssignment: false,
        taskUpdates: true,
        reportAccess: false,
        channelAdmin: false,
        auditLogs: false,
        userManagement: false,
        shiftHandover: false,
        taskApproval: false
      }
    },
    {
      id: 'role-002',
      name: 'Supervisor',
      description: 'Floor or outlet supervisor - Operations Channel + Task Assignment + Shift Handover',
      accessLevel: 2,
      usersCount: 120,
      permissions: {
        taskAssignment: true,
        taskUpdates: true,
        reportAccess: false,
        channelAdmin: false,
        auditLogs: false,
        userManagement: false,
        shiftHandover: true,
        taskApproval: false
      }
    },
    {
      id: 'role-003',
      name: 'Manager',
      description: 'Department Manager - Department Channel + Executive Channel + Report Access + Task Approval',
      accessLevel: 3,
      usersCount: 30,
      permissions: {
        taskAssignment: true,
        taskUpdates: true,
        reportAccess: true,
        channelAdmin: true,
        auditLogs: false,
        userManagement: false,
        shiftHandover: true,
        taskApproval: true
      }
    },
    {
      id: 'role-004',
      name: 'Director',
      description: 'Director level - Full system access except user management',
      accessLevel: 4,
      usersCount: 8,
      permissions: {
        taskAssignment: true,
        taskUpdates: true,
        reportAccess: true,
        channelAdmin: true,
        auditLogs: true,
        userManagement: false,
        shiftHandover: true,
        taskApproval: true
      }
    },
    {
      id: 'role-005',
      name: 'GM',
      description: 'General Manager - Full system access, Reports, Decision Logs',
      accessLevel: 5,
      usersCount: 1,
      permissions: {
        taskAssignment: true,
        taskUpdates: true,
        reportAccess: true,
        channelAdmin: true,
        auditLogs: true,
        userManagement: true,
        shiftHandover: true,
        taskApproval: true
      }
    },
    {
      id: 'role-006',
      name: 'Admin',
      description: 'IT Administrator - Full system access, User management, Audit Logs',
      accessLevel: 5,
      usersCount: 2,
      permissions: {
        taskAssignment: true,
        taskUpdates: true,
        reportAccess: true,
        channelAdmin: true,
        auditLogs: true,
        userManagement: true,
        shiftHandover: true,
        taskApproval: true
      }
    }
  ];

  const permissionsList: Permission[] = [
    { id: 'perm-001', name: 'Task Assignment', description: 'Can assign tasks to staff', category: 'Tasks' },
    { id: 'perm-002', name: 'Task Updates', description: 'Can update task status', category: 'Tasks' },
    { id: 'perm-003', name: 'Task Approval', description: 'Can approve completed tasks', category: 'Tasks' },
    { id: 'perm-004', name: 'Shift Handover', description: 'Can submit and view shift handovers', category: 'Operations' },
    { id: 'perm-005', name: 'Report Access', description: 'Can view reports', category: 'Reports' },
    { id: 'perm-006', name: 'Channel Admin', description: 'Can manage channel settings', category: 'Channels' },
    { id: 'perm-007', name: 'Audit Logs', description: 'Can view audit logs', category: 'Security' },
    { id: 'perm-008', name: 'User Management', description: 'Can add/edit/remove users', category: 'Admin' },
    { id: 'perm-009', name: 'Full System Access', description: 'Unrestricted system access', category: 'Admin' }
  ];

  // ==========================================
  // 3️⃣ ACTIVITY LOGS
  // ==========================================
  
  const activityLogs: ActivityLog[] = [
    {
      id: 'log-001',
      timestamp: '2026-03-02 09:12',
      user: 'John Smith',
      userId: 'USR-001',
      actionType: 'Task Completed',
      reference: 'Room 1205',
      department: 'Housekeeping',
      channel: 'Operations',
      status: 'Approved'
    },
    {
      id: 'log-002',
      timestamp: '2026-03-02 09:15',
      user: 'Sarah Lee',
      userId: 'USR-002',
      actionType: 'Report Viewed',
      reference: 'Housekeeping KPI',
      department: 'F&B',
      channel: 'Executive',
      status: 'N/A'
    },
    {
      id: 'log-003',
      timestamp: '2026-03-02 08:55',
      user: 'Michael Wilson',
      userId: 'USR-003',
      actionType: 'Login',
      reference: 'Session ID: 894723',
      department: 'Executive',
      channel: 'System',
      status: 'Success'
    },
    {
      id: 'log-004',
      timestamp: '2026-03-02 08:30',
      user: 'Maria Santos',
      userId: 'USR-004',
      actionType: 'Task Started',
      reference: 'Room 1508',
      department: 'Housekeeping',
      channel: 'Operations',
      status: 'In Progress'
    },
    {
      id: 'log-005',
      timestamp: '2026-03-02 08:15',
      user: 'David Kim',
      userId: 'USR-007',
      actionType: 'Message Sent',
      reference: 'Water leak alert',
      department: 'Engineering',
      channel: 'Operations',
      status: 'Delivered'
    },
    {
      id: 'log-006',
      timestamp: '2026-03-01 23:45',
      user: 'James Wilson',
      userId: 'USR-009',
      actionType: 'User Created',
      reference: 'New staff: Maria Santos',
      department: 'IT',
      channel: 'Admin',
      status: 'Completed'
    },
    {
      id: 'log-007',
      timestamp: '2026-03-01 22:30',
      user: 'Lisa Chen',
      userId: 'USR-008',
      actionType: 'Report Exported',
      reference: 'Q1 Sales Report',
      department: 'Sales',
      channel: 'Executive',
      status: 'Downloaded'
    }
  ];

  // ==========================================
  // 4️⃣ USER ANALYTICS
  // ==========================================
  
  const userAnalytics = {
    totalUsers: 687,
    activeUsers: 645,
    inactiveUsers: 32,
    suspendedUsers: 10,
    
    byDepartment: [
      { name: 'Housekeeping', active: 165, inactive: 8, suspended: 2, total: 175 },
      { name: 'F&B', active: 220, inactive: 12, suspended: 3, total: 235 },
      { name: 'Rooms', active: 85, inactive: 4, suspended: 1, total: 90 },
      { name: 'Engineering', active: 35, inactive: 2, suspended: 1, total: 38 },
      { name: 'Spa', active: 40, inactive: 2, suspended: 1, total: 43 },
      { name: 'Security', active: 30, inactive: 2, suspended: 0, total: 32 },
      { name: 'Sales', active: 22, inactive: 1, suspended: 1, total: 24 },
      { name: 'Finance', active: 18, inactive: 0, suspended: 0, total: 18 },
      { name: 'HR', active: 12, inactive: 0, suspended: 0, total: 12 },
      { name: 'Executive', active: 8, inactive: 0, suspended: 0, total: 8 },
      { name: 'IT', active: 10, inactive: 1, suspended: 1, total: 12 }
    ],
    
    loginsLast30Days: [1245, 1280, 1320, 1350, 1420, 1380, 1340, 1420, 1480, 1520, 1580, 1620, 1650, 1680, 1720, 1750, 1780, 1820, 1850, 1880, 1920, 1950, 1980, 2010, 2050, 2080, 2100, 2120, 2150, 2180],
    
    engagementScore: {
      housekeeping: 92,
      fAndB: 88,
      rooms: 94,
      engineering: 85,
      spa: 78,
      security: 96,
      sales: 82,
      executive: 98
    },
    
    taskCompletionRate: 87,
    avgLoginFrequency: '4.2 per day',
    mostActiveHour: '10:00 AM',
    twoFactorAdoption: 78
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Staff': return <UserCircle className="h-4 w-4 text-[#8E939D]" />;
      case 'Supervisor': return <Star className="h-4 w-4 text-blue-400" />;
      case 'Manager': return <Briefcase className="h-4 w-4 text-purple-400" />;
      case 'Director': return <Award className="h-4 w-4 text-amber-400" />;
      case 'GM': return <Crown className="h-4 w-4 text-emerald-400" />;
      case 'Admin': return <ShieldCheck className="h-4 w-4 text-red-400" />;
      default: return <UserCircle className="h-4 w-4 text-[#8E939D]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-[#8E939D]/10 text-[#8E939D] border-[#8E939D]/30 text-[8px] uppercase tracking-widest">Inactive</Badge>;
      case 'Suspended':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">Suspended</Badge>;
      case 'Approved':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[8px] uppercase">Approved</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[8px] uppercase">In Progress</Badge>;
      case 'Success':
      case 'Delivered':
      case 'Completed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[8px] uppercase">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-[#8E939D]">{status}</Badge>;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]';
      case 'Inactive': return 'bg-[#5C6270] shadow-[0_0_8px_rgba(92,98,112,0.5)]';
      case 'Suspended': return 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.9)]';
      default: return 'bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]';
    }
  };

  const getPermissionBadge = (enabled: boolean) => {
    return enabled ? 
      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : 
      <X className="h-4 w-4 text-slate-600" />;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* ── Page header — housekeeping style ── */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
          <Users className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
          USER MANAGEMENT
          <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span>
          <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">{userAnalytics.activeUsers} ACTIVE · {userAnalytics.totalUsers} TOTAL</span>
        </h1>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
          >
            <Download className="h-3 w-3 mr-2 text-[#00f2ff]" />
            EXPORT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
          >
            <UserPlus className="h-3 w-3 mr-2 text-[#00f2ff]" />
            ADD USER
          </Button>
        </div>
      </div>

      {/* ── KPI stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "TOTAL", val: userAnalytics.totalUsers, color: "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]", dot: "bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]" },
          { label: "ACTIVE", val: userAnalytics.activeUsers, color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" },
          { label: "INACTIVE", val: userAnalytics.inactiveUsers, color: "text-[#8E939D] drop-shadow-[0_0_8px_rgba(142,147,157,0.4)]", dot: "bg-[#8E939D] shadow-[0_0_8px_rgba(142,147,157,0.8)]" },
          { label: "SUSPENDED", val: userAnalytics.suspendedUsers, color: "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]", dot: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" },
          { label: "2FA ENABLED", val: `${userAnalytics.twoFactorAdoption}%`, color: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]", dot: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{kpi.label}</p>
                <div className="flex items-center justify-between">
                  <p className={cn("text-2xl font-bold tracking-tight", kpi.color)}>{kpi.val}</p>
                  <span className={cn("h-2 w-2 rounded-full animate-pulse", kpi.dot)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 p-1 gap-1">
            <TabsTrigger
              value="directory"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              USER DIRECTORY
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              ROLES & PERMS
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              ACTIVITY LOG
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              BULK ACTIONS
            </TabsTrigger>
          </TabsList>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* ==========================================
            1️⃣ USER DIRECTORY
        ========================================== */}
        <TabsContent value="directory" className="space-y-4 mt-0">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270] group-focus-within/search:text-[#00f2ff] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH USER OR EMAIL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-9 text-[10px] font-bold uppercase tracking-widest bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-lg text-[#00f2ff] placeholder:text-[#5C6270] focus:outline-none focus:border-[#00f2ff]/50 focus:bg-[#0a0c10] transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0a0c10] border border-[#00f2ff]/15 rounded-lg p-1">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[#0a0c10] border-none text-[#5C6270] focus:text-[#00f2ff] focus:outline-none cursor-pointer hover:text-[#00f2ff]"
              >
                <option value="all" className="bg-[#0a0c10] text-[#8E939D]">ALL ROLES</option>
                <option value="Staff" className="bg-[#0a0c10] text-[#8E939D]">STAFF</option>
                <option value="Supervisor" className="bg-[#0a0c10] text-[#8E939D]">SUPERVISOR</option>
                <option value="Manager" className="bg-[#0a0c10] text-[#8E939D]">MANAGER</option>
                <option value="Director" className="bg-[#0a0c10] text-[#8E939D]">DIRECTOR</option>
                <option value="GM" className="bg-[#0a0c10] text-[#8E939D]">GM</option>
                <option value="Admin" className="bg-[#0a0c10] text-[#8E939D]">ADMIN</option>
              </select>
              <div className="border-l border-[#00f2ff]/20" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-[#0a0c10] border-none text-[#5C6270] focus:text-[#00f2ff] focus:outline-none cursor-pointer hover:text-[#00f2ff]"
              >
                <option value="all" className="bg-[#0a0c10] text-[#8E939D]">ALL STATUS</option>
                <option value="Active" className="bg-[#0a0c10] text-[#8E939D]">ACTIVE</option>
                <option value="Inactive" className="bg-[#0a0c10] text-[#8E939D]">INACTIVE</option>
                <option value="Suspended" className="bg-[#0a0c10] text-[#8E939D]">SUSPENDED</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
            >
              <RefreshCw className="h-3 w-3 mr-2 text-[#00f2ff]" />
              RESET
            </Button>
          </div>

          {/* Users Table */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>USER DIRECTORY</span>
                <span className="text-[#5C6270] font-normal">
                  <span className="text-[#00f2ff]">{filteredUsers.length}</span> / {users.length} users
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#00f2ff]/5 border-b border-[#00f2ff]/10">
                    <tr>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">NAME</th>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">ROLE</th>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">DEPT</th>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">STATUS</th>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">LAST LOGIN</th>
                      <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#00f2ff]/10 hover:bg-[#00f2ff]/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-[#00f2ff]/10 flex items-center justify-center border border-[#00f2ff]/30">
                                <span className="text-[9px] font-bold text-[#00f2ff]">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className={cn("h-1.5 w-1.5 rounded-full absolute -bottom-0 -right-0 animate-pulse", getStatusDot(user.status))} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-[#00f2ff] drop-shadow-[0_0_3px_rgba(0,242,255,0.2)]">{user.name}</div>
                              <div className="text-[8px] text-[#5C6270]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">{user.role}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-[#8E939D]">{user.department}</td>
                        <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                        <td className="py-3 px-4 text-[9px] text-[#8E939D] font-mono">{user.lastLogin}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#00f2ff]/10 hover:text-[#00f2ff]">
                              <Edit className="h-3.5 w-3.5 text-[#5C6270]" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-amber-400/10 hover:text-amber-400">
                              <Key className="h-3.5 w-3.5 text-[#5C6270]" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-400/10 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5 text-[#5C6270]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-[#00f2ff]/10">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                  <span className="text-[#00f2ff]">{filteredUsers.length}</span> of <span className="text-[#00f2ff]">{users.length}</span> users
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-7 px-3">
                    Previous
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-7 px-3">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            2️⃣ ROLES & PERMISSIONS
        ========================================== */}
        <TabsContent value="roles" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role.name)}
                      <span>{role.name}</span>
                    </div>
                    <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[8px] uppercase tracking-widest shadow-[0_0_8px_rgba(0,242,255,0.2)]">{role.usersCount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 relative z-10">
                  <p className="text-[9px] text-[#8E939D] mb-4 leading-relaxed">{role.description}</p>
                  <div className="space-y-2">
                    {Object.entries(role.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover:bg-[#0a0c10] group-hover:border-[#00f2ff]/30 transition-colors">
                        <span className="text-[8px] text-[#5C6270] font-bold uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {value ? 
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : 
                          <X className="h-3.5 w-3.5 text-slate-600" />
                        }
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] transition-all">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] transition-all">
                      Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==========================================
            3️⃣ ACTIVITY LOGS
        ========================================== */}
        <TabsContent value="logs" className="space-y-4 mt-0">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>ACTIVITY LOG</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-7">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-7">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 relative z-10">
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/30 hover:shadow-[0_0_10px_rgba(0,242,255,0.1)] transition-all">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#00f2ff]/10 flex items-center justify-center border border-[#00f2ff]/30">
                          <span className="text-[9px] font-bold text-[#00f2ff]">
                            {log.user.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="h-1 w-1 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[9px] font-bold text-[#00f2ff]">{log.user}</span>
                          <span className="text-[8px] text-[#5C6270]">{log.userId}</span>
                          <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[7px] uppercase tracking-widest">{log.department}</Badge>
                        </div>
                        <p className="text-[9px] text-slate-300 mt-1.5">
                          <span className="text-[#00f2ff] font-bold">{log.actionType}</span> · {log.reference}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1 text-[8px] text-[#5C6270]">
                          <span className="font-mono">{log.timestamp}</span>
                          <span>•</span>
                          <span>{log.channel}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            4️⃣ BULK ACTIONS
        ========================================== */}
        <TabsContent value="bulk" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">IMPORT USERS</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 relative z-10">
                <p className="text-[9px] text-[#8E939D] mb-4">Upload CSV or Excel file with user data</p>
                <div className="border-2 border-dashed border-[#00f2ff]/20 hover:border-[#00f2ff]/40 rounded-lg p-6 text-center transition-colors">
                  <Upload className="h-8 w-8 text-[#5C6270] mx-auto mb-2" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Drag & drop or click</p>
                  <p className="text-[8px] text-[#5C6270] mt-1">Supports .csv, .xlsx, .xls</p>
                </div>
                <Button className="w-full mt-4 bg-[#0a0c10] border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 text-[#00f2ff] text-[9px] font-bold uppercase tracking-widest">
                  <Upload className="h-3 w-3 mr-2" />
                  Upload File
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.1)]">CHANGE STATUS</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 relative z-10">
                <p className="text-[9px] text-[#8E939D] mb-4">Bulk update status for selected users</p>
                <div className="space-y-2">
                  <select className="w-full px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-[#00f2ff]/5 border border-[#00f2ff]/15 text-[#8E939D] focus:border-[#00f2ff]/40 focus:outline-none">
                    <option>Select status...</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Suspended</option>
                  </select>
                  <Button className="w-full bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
                    <UserCheck className="h-3 w-3 mr-2" />
                    Activate Selected
                  </Button>
                  <Button className="w-full bg-orange-600/20 border border-orange-600/30 hover:bg-orange-600/40 text-orange-400 text-[9px] font-bold uppercase tracking-widest">
                    <UserMinus className="h-3 w-3 mr-2" />
                    Deactivate Selected
                  </Button>
                  <Button className="w-full bg-red-600/20 border border-red-600/30 hover:bg-red-600/40 text-red-400 text-[9px] font-bold uppercase tracking-widest">
                    <UserX className="h-3 w-3 mr-2" />
                    Suspend Selected
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
              <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.1)]">EXPORT DATA</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 relative z-10">
                <p className="text-[9px] text-[#8E939D] mb-4">Export user data in various formats</p>
                <div className="space-y-2">
                  <Button className="w-full bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
                    <FileSpreadsheet className="h-3 w-3 mr-2" />
                    Export CSV
                  </Button>
                  <Button className="w-full bg-blue-600/20 border border-blue-600/30 hover:bg-blue-600/40 text-blue-400 text-[9px] font-bold uppercase tracking-widest">
                    <FileText className="h-3 w-3 mr-2" />
                    Export PDF
                  </Button>
                  <Button className="w-full bg-purple-600/20 border border-purple-600/30 hover:bg-purple-600/40 text-purple-400 text-[9px] font-bold uppercase tracking-widest">
                    <Download className="h-3 w-3 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==========================================
            5️⃣ END TABS
        ========================================== */}
      </Tabs>
    </div>
  );
}