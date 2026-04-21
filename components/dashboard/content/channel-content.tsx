'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  // Main icons
  MessageSquare,
  MessageCircle,
  Bell,
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Flag,
  Star,
  Award,
  
  // Channel icons
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  ShieldAlert,
  
  // Task icons
  ClipboardList,
  ClipboardCheck,
  ClipboardX,
  CheckSquare,
  Square,
  ListChecks,
  
  // Priority icons
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Zap,
  
  // Action icons
  Send,
  Paperclip,
  Image,
  File,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  X,
  Edit,
  Trash2,
  
  // Status icons
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  
  // Department icons
  Hotel,
  BedDouble,
  Coffee,
  Wine,
  Wrench,
  Shield as SecurityIcon,
  Users as HR,
  TrendingUp
} from 'lucide-react';

// ==========================================
// INTERFACES
// ==========================================
interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  deadline: string;
  assignedBy: string;
  room?: string;
}

interface Message {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  department: string;
  sender: {
    name: string;
    role: string;
    avatar: string;
  };
  timestamp: string;
  status: string;
  assignedTo?: string[];
  deadline?: string;
  room?: string;
  attachments?: string[];
  readBy: number;
  totalStaff: number;
  comments: number;
  completedAt?: string;
}

interface ExecutiveMessage {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  department: string;
  sender: {
    name: string;
    role: string;
    avatar: string;
  };
  timestamp: string;
  status: string;
  tags?: string[];
  deadline?: string;
  responses?: Array<{ name: string; status: string }>;
  timeline?: Array<{ time: string; action: string }>;
  decisions?: string[];
  decision?: {
    summary: string;
    responsible: string;
    deadline: string;
    status: string;
  };
  acknowledgments?: Array<{ name: string; status: string; time?: string }>;
  comments: number;
}

interface Department {
  id: string;
  name: string;
  icon: any;
  unread: number;
  members: number;
}

export function ChannelContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('operations');
  const [selectedDept, setSelectedDept] = useState('housekeeping');
  const [messageInput, setMessageInput] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);

  // ==========================================
  // USER CONTEXT (Based on Role)
  // ==========================================
  
  const currentUser = {
    id: 'USR-001',
    name: 'Michael Wilson',
    role: 'GENERAL_MANAGER',
    department: 'Executive',
    avatar: 'MW',
    permissions: ['operations', 'executive', 'all-departments']
  };

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  
  const departments: Department[] = [
    { id: 'housekeeping', name: 'Housekeeping', icon: BedDouble, unread: 3, members: 45 },
    { id: 'engineering', name: 'Engineering', icon: Wrench, unread: 1, members: 28 },
    { id: 'front-office', name: 'Front Office', icon: Hotel, unread: 0, members: 32 },
    { id: 'f-and-b', name: 'F&B', icon: Coffee, unread: 2, members: 85 },
    { id: 'spa', name: 'Spa', icon: Wine, unread: 0, members: 18 },
    { id: 'security', name: 'Security', icon: SecurityIcon, unread: 1, members: 24 },
    { id: 'hr', name: 'HR', icon: HR, unread: 0, members: 12 }
  ];

  // ==========================================
  // OPERATIONS CHANNEL - MESSAGES
  // ==========================================
  
  const operationsMessages: Message[] = [
    {
      id: 'MSG-001',
      type: 'task',
      priority: 'high',
      title: 'Clean VIP Suite - Room 1508',
      message: 'Sheikh Mohammed Al-Rashid checking in at 3PM. Full turndown service with extra amenities.',
      department: 'housekeeping',
      sender: {
        name: 'Sarah Johnson',
        role: 'Housekeeping Manager',
        avatar: 'SJ'
      },
      timestamp: '09:45 AM',
      status: 'urgent',
      assignedTo: ['Maria Santos', 'Elena Petrova'],
      deadline: '2:30 PM',
      room: '1508',
      attachments: ['VIP_Checklist.pdf'],
      readBy: 12,
      totalStaff: 18,
      comments: 3
    },
    {
      id: 'MSG-002',
      type: 'announcement',
      priority: 'medium',
      title: 'Staff Meeting Today',
      message: 'Mandatory staff meeting at 4PM in the banquet hall. Attendance required.',
      department: 'all',
      sender: {
        name: 'Michael Wilson',
        role: 'General Manager',
        avatar: 'MW'
      },
      timestamp: '08:30 AM',
      status: 'active',
      readBy: 156,
      totalStaff: 245,
      attachments: ['Agenda.pdf'],
      comments: 2
    },
    {
      id: 'MSG-003',
      type: 'alert',
      priority: 'critical',
      title: 'Water Leak - Room 1205',
      message: 'Guest reported water leak from ceiling. Engineering team respond immediately.',
      department: 'engineering',
      sender: {
        name: 'Front Desk',
        role: 'Front Office',
        avatar: 'FD'
      },
      timestamp: '10:15 AM',
      status: 'active',
      assignedTo: ['Mike Roberts'],
      room: '1205',
      readBy: 3,
      totalStaff: 28,
      comments: 2
    },
    {
      id: 'MSG-004',
      type: 'task',
      priority: 'medium',
      title: 'Restock Minibars - Floor 8',
      message: 'All minibars on floor 8 need restocking before 12PM.',
      department: 'housekeeping',
      sender: {
        name: 'Sarah Johnson',
        role: 'Housekeeping Manager',
        avatar: 'SJ'
      },
      timestamp: '08:45 AM',
      status: 'in-progress',
      assignedTo: ['David Kim', 'Lisa Chen'],
      deadline: '12:00 PM',
      readBy: 5,
      totalStaff: 18,
      comments: 1
    },
    {
      id: 'MSG-005',
      type: 'maintenance',
      priority: 'low',
      title: 'AC Not Cooling - Room 723',
      message: 'Guest complained AC not working properly. Check and repair.',
      department: 'engineering',
      sender: {
        name: 'Front Desk',
        role: 'Front Office',
        avatar: 'FD'
      },
      timestamp: 'Yesterday 11:20 PM',
      status: 'completed',
      assignedTo: ['John Davis'],
      room: '723',
      completedAt: '09:30 AM',
      readBy: 28,
      totalStaff: 28,
      attachments: ['photo_723.jpg'],
      comments: 0
    }
  ];

  // ==========================================
  // EXECUTIVE CHANNEL - STRATEGIC DISCUSSIONS
  // ==========================================
  
  const executiveMessages: ExecutiveMessage[] = [
    {
      id: 'EXC-001',
      type: 'decision',
      priority: 'high',
      title: 'Q2 Pricing Strategy',
      message: 'Proposal to increase corporate rates by 8% effective April 1. Need approval from all HODs.',
      department: 'executive',
      sender: {
        name: 'Michael Wilson',
        role: 'General Manager',
        avatar: 'MW'
      },
      timestamp: '09:15 AM',
      status: 'decision-needed',
      tags: ['Revenue', 'Pricing', 'Q2'],
      deadline: 'Mar 15',
      responses: [
        { name: 'Finance', status: 'approved' },
        { name: 'Sales', status: 'approved' },
        { name: 'Revenue', status: 'pending' }
      ],
      comments: 8
    },
    {
      id: 'EXC-002',
      type: 'crisis',
      priority: 'critical',
      title: '⚡ POWER OUTAGE - EAST WING',
      message: 'Partial power outage in east wing. Engineering is investigating. All managers acknowledge.',
      department: 'executive',
      sender: {
        name: 'Chief Engineer',
        role: 'Engineering Director',
        avatar: 'CE'
      },
      timestamp: '10:30 AM',
      status: 'crisis-active',
      acknowledgments: [
        { name: 'GM', status: 'acknowledged', time: '10:32' },
        { name: 'F&B Director', status: 'acknowledged', time: '10:33' },
        { name: 'Front Office', status: 'acknowledged', time: '10:31' },
        { name: 'Housekeeping', status: 'pending' }
      ],
      timeline: [
        { time: '10:30', action: 'Incident reported' },
        { time: '10:32', action: 'Engineering dispatched' },
        { time: '10:35', action: 'Backup generator activated' }
      ],
      comments: 4
    },
    {
      id: 'EXC-003',
      type: 'discussion',
      priority: 'medium',
      title: 'VIP Arrival Protocol Review',
      message: 'Sheikh Al-Rashid arriving Friday. Review security and service protocol.',
      department: 'executive',
      sender: {
        name: 'Guest Relations',
        role: 'Director',
        avatar: 'GR'
      },
      timestamp: 'Yesterday 4:15 PM',
      status: 'in-progress',
      tags: ['VIP', 'Security', 'Service'],
      decisions: [
        'Private elevator access approved',
        'Security team assigned',
        'Rolls Royce confirmed'
      ],
      comments: 12
    },
    {
      id: 'EXC-004',
      type: 'decision',
      priority: 'high',
      title: 'Staff Overtime Budget Approval',
      message: 'Requesting approval for additional overtime budget during spring break.',
      department: 'executive',
      sender: {
        name: 'HR Director',
        role: 'Human Resources',
        avatar: 'HR'
      },
      timestamp: 'Mar 1, 2026',
      status: 'decision-logged',
      decision: {
        summary: 'Overtime budget approved up to $45K for March-April',
        responsible: 'Finance',
        deadline: 'Mar 15',
        status: 'in-progress'
      },
      comments: 3
    }
  ];

  // ==========================================
  // TASK ASSIGNMENT
  // ==========================================
  
  const myTasks: Task[] = [
    {
      id: 'TASK-001',
      title: 'Clean VIP Suite 1508',
      priority: 'high',
      status: 'pending',
      deadline: '2:30 PM',
      assignedBy: 'Sarah Johnson',
      room: '1508'
    },
    {
      id: 'TASK-002',
      title: 'Restock Floor 8 Minibars',
      priority: 'medium',
      status: 'in-progress',
      deadline: '12:00 PM',
      assignedBy: 'Sarah Johnson'
    },
    {
      id: 'TASK-003',
      title: 'Inspect Pool Area',
      priority: 'low',
      status: 'completed',
      deadline: 'Yesterday',
      assignedBy: 'Security Manager'
    }
  ];

  // ==========================================
  // SHIFT HANDOVER
  // ==========================================
  
  const shiftReports = [
    {
      shift: 'Morning',
      supervisor: 'Sarah Johnson',
      openIssues: 3,
      unfinishedTasks: 5,
      specialNotes: 'VIP in 1508, extra attention needed',
      handedOver: true
    }
  ];

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Bell className="h-4 w-4 text-blue-400" />;
      case 'task': return <ClipboardList className="h-4 w-4 text-emerald-400" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-orange-400" />;
      case 'decision': return <CheckCircle2 className="h-4 w-4 text-purple-400" />;
      case 'crisis': return <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />;
      case 'discussion': return <MessageSquare className="h-4 w-4 text-amber-400" />;
      default: return <MessageCircle className="h-4 w-4 text-[#8E939D]" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse text-[#8E939D]">CRITICAL</Badge>;
      case 'high': return <Badge className="bg-orange-600 hover:bg-orange-700 text-[#8E939D]">HIGH</Badge>;
      case 'medium': return <Badge className="bg-amber-600 hover:bg-amber-700 text-[#8E939D]">MEDIUM</Badge>;
      case 'low': return <Badge className="border border-slate-600 text-[#8E939D]">LOW</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent': return <Badge className="bg-red-600/20 text-red-400 border border-red-600/30">Urgent</Badge>;
      case 'active': return <Badge className="bg-emerald-600/20 text-emerald-400">Active</Badge>;
      case 'in-progress': return <Badge className="bg-blue-600/20 text-blue-400">In Progress</Badge>;
      case 'completed': return <Badge className="bg-slate-600/20 text-[#8E939D]">Completed</Badge>;
      case 'decision-needed': return <Badge className="bg-purple-600/20 text-purple-400">Decision Needed</Badge>;
      case 'decision-logged': return <Badge className="bg-emerald-600/20 text-emerald-400">Decision Logged</Badge>;
      case 'crisis-active': return <Badge className="bg-red-600 text-[#8E939D] animate-pulse">CRISIS ACTIVE</Badge>;
      default: return null;
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Square className="h-5 w-5 text-[#8E939D]" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-400" />;
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
            CMD CENTER <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> CHANNEL COMMUNICATION
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] mt-2 group-hover:text-[#00f2ff]/70 transition-colors">
            {currentUser.role === 'GENERAL_MANAGER' ? 'EXECUTIVE / ALL DEPARTMENTS' : `${currentUser.department.toUpperCase()} CHANNEL`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-[#0a0c10] border border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50 hover:shadow-[0_0_15px_rgba(248,113,113,0.3)] text-red-400 h-10 px-4 flex items-center text-[10px] font-bold uppercase tracking-widest transition-all">
            <BellRing className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]" />
            8 UNREAD
          </Badge>
          <Button className="bg-[#0a0c10] border border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 hover:border-[#0ea5e9]/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] text-[#0ea5e9] h-10 text-[10px] font-bold uppercase tracking-widest transition-all">
            <Search className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]" />
            SEARCH MESSAGES
          </Button>
        </div>
      </div>

      {/* Main Tabs - Two Completely Separate Channels */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#00f2ff]/5 border border-[#00f2ff]/15">
          <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Operations Channel
            <Badge className="ml-2 bg-blue-600/20 text-blue-400">Staff</Badge>
          </TabsTrigger>
          {currentUser.permissions.includes('executive') && (
            <TabsTrigger value="executive" className="data-[state=active]:bg-slate-700">
              <Shield className="h-4 w-4 mr-2" />
              Executive Channel
              <Badge className="ml-2 bg-purple-600/20 text-purple-400">Managers Only</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==========================================
            OPERATIONS CHANNEL (Staff + Managers)
        ========================================== */}
        <TabsContent value="operations" className="space-y-4">
          {/* Department Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {departments.map((dept) => (
              <Button
                key={dept.id}
                className={
                  selectedDept === dept.id 
                    ? 'bg-blue-600 hover:bg-blue-700 text-[#8E939D]' 
                    : 'border border-[#00f2ff]/20 bg-[#00f2ff]/5 text-slate-300 hover:bg-slate-700'
                }
                onClick={() => setSelectedDept(dept.id)}
              >
                <dept.icon className="h-4 w-4 mr-2" />
                {dept.name}
                {dept.unread > 0 && (
                  <Badge className="ml-2 bg-red-600/20 text-red-400 border border-red-600/30">
                    {dept.unread}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* My Tasks Panel (For Staff View) */}
          {currentUser.role.includes('STAFF') && (
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />
                    MY TASKS
                  </span>
                  <Badge className="bg-amber-600/20 text-amber-400">
                    2 overdue
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-2">
                  {myTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                      <div className="flex items-center gap-3">
                        {getTaskStatusIcon(task.status)}
                        <div>
                          <p className={`text-sm font-medium ${
                            task.status === 'completed' ? 'text-[#5C6270] line-through' : 'text-[#8E939D]'
                          }`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-[#5C6270]">
                            Due: {task.deadline} • {task.assignedBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        {task.status === 'pending' && (
                          <Button className="h-7 bg-blue-600 hover:bg-blue-700 text-[#8E939D] px-3 py-1 text-xs">
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Message / Task Input (For Managers) */}
          {currentUser.role.includes('MANAGER') && (
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardContent className="p-4 relative z-10">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600/20 text-blue-400">
                      {currentUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Send announcement, assign task, or create alert..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="min-h-[80px] bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] placeholder:text-[#5C6270]"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <select className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded text-sm text-slate-300 p-1">
                          <option>Announcement</option>
                          <option>Task Assignment</option>
                          <option>Alert</option>
                          <option>Maintenance Request</option>
                        </select>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]">
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages Feed */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>DEPARTMENT FEED</span>
                <div className="flex items-center gap-2">
                  <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                  <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                    <Clock className="h-4 w-4 mr-1" />
                    Unread
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {operationsMessages
                  .filter(msg => msg.department === selectedDept || msg.department === 'all')
                  .map((msg) => (
                    <div key={msg.id} className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:bg-[#0a0c10] transition-all group">
                      {/* Message Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            msg.type === 'alert' ? 'bg-red-500/10' :
                            msg.type === 'task' ? 'bg-emerald-500/10' :
                            msg.type === 'announcement' ? 'bg-blue-500/10' :
                            'bg-slate-500/10'
                          }`}>
                            {getMessageTypeIcon(msg.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{msg.title}</span>
                              {getPriorityBadge(msg.priority)}
                              {getStatusBadge(msg.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#5C6270] mt-1">
                              <span>{msg.sender.name} • {msg.sender.role}</span>
                              <span>•</span>
                              <span>{msg.timestamp}</span>
                              {msg.room && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-400">Room {msg.room}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="border border-slate-600 text-xs">
                            {msg.readBy}/{msg.totalStaff} read
                          </Badge>
                          <Button className="h-7 w-7 p-0 bg-transparent hover:bg-[#00f2ff]/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Message Content */}
                      <p className="text-sm text-slate-300 mb-3 ml-12">{msg.message}</p>

                      {/* Task Details (if task) */}
                      {msg.type === 'task' && msg.assignedTo && (
                        <div className="ml-12 mb-3 p-2 rounded bg-slate-700/30 border border-slate-600/30">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8E939D]">Assigned to: {msg.assignedTo.join(', ')}</span>
                            <span className="text-amber-400">Deadline: {msg.deadline}</span>
                          </div>
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="ml-12 flex items-center gap-2">
                          {msg.attachments.map((att, idx) => (
                            <Badge key={idx} className="border border-slate-600 text-xs cursor-pointer hover:bg-slate-700">
                              <File className="h-3 w-3 mr-1" />
                              {att}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Comments/Responses */}
                      {msg.comments > 0 && (
                        <div className="ml-12 mt-2 text-xs text-[#5C6270]">
                          {msg.comments} comments • <Button className="h-auto p-0 text-xs text-blue-400 bg-transparent hover:underline">Reply</Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Shift Handover (End of Shift) */}
          {currentUser.role.includes('SUPERVISOR') && (
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-amber-500/30">
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.1)] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
                  END OF SHIFT REPORT REQUIRED
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm text-slate-300 mb-3">Morning shift ends in 1 hour. Submit handover report.</p>
                <Button className="bg-amber-600 hover:bg-amber-700 text-[#8E939D]">
                  Complete Shift Handover
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==========================================
            EXECUTIVE CHANNEL (Managers Only)
        ========================================== */}
        {currentUser.permissions.includes('executive') && (
          <TabsContent value="executive" className="space-y-4">
            {/* Crisis Mode Banner */}
            {executiveMessages.find(m => m.status === 'crisis-active') && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center gap-3 animate-pulse">
                <ShieldAlert className="h-6 w-6 text-red-400" />
                <div className="flex-1">
                  <p className="font-medium text-red-400">CRISIS ACTIVE: Power Outage - East Wing</p>
                  <p className="text-sm text-red-400/70">All managers must acknowledge. 3/4 responded.</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-[#8E939D] px-3 py-1.5 text-sm">
                  Acknowledge Now
                </Button>
              </div>
            )}

            {/* Executive Message Input */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-purple-500/30">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-600/20 text-purple-400">
                      {currentUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Start strategic discussion, request decision, or report crisis..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="min-h-[80px] bg-[#00f2ff]/5 border-purple-500/30 text-[#8E939D] placeholder:text-[#5C6270] focus:border-purple-500/50"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button className="text-[#8E939D] hover:text-slate-300 bg-transparent hover:bg-[#00f2ff]/10">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <select className="bg-[#00f2ff]/10 border border-purple-500/30 rounded text-sm text-slate-300 p-1">
                          <option>Discussion</option>
                          <option>Decision Request</option>
                          <option>Crisis Alert</option>
                          <option>Announcement</option>
                        </select>
                        <Badge className="bg-purple-600/20 text-purple-400 ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Managers Only
                        </Badge>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-[#8E939D]">
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Messages */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-[#8E939D] text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Executive Discussions
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600/20 text-purple-400">Strategy</Badge>
                    <Badge className="bg-red-600/20 text-red-400">Crisis</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {executiveMessages.map((msg) => (
                    <div key={msg.id} className="p-4 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15">
                      {/* Message Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            msg.type === 'crisis' ? 'bg-red-500/10 animate-pulse' :
                            msg.type === 'decision' ? 'bg-purple-500/10' :
                            'bg-amber-500/10'
                          }`}>
                            {getMessageTypeIcon(msg.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold tracking-wide text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">{msg.title}</span>
                              {getPriorityBadge(msg.priority)}
                              {getStatusBadge(msg.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#5C6270] mt-1">
                              <span>{msg.sender.name} • {msg.sender.role}</span>
                              <span>•</span>
                              <span>{msg.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message Content */}
                      <p className="text-sm text-slate-300 mb-3 ml-12">{msg.message}</p>

                      {/* Tags */}
                      {msg.tags && msg.tags.length > 0 && (
                        <div className="ml-12 flex items-center gap-2 mb-3">
                          {msg.tags.map((tag, idx) => (
                            <Badge key={idx} className="border border-slate-600 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Decision Tracking */}
                      {msg.type === 'decision' && msg.responses && (
                        <div className="ml-12 mb-3 p-3 rounded bg-purple-950/20 border border-purple-500/30">
                          <p className="text-xs font-medium text-purple-400 mb-2">Decision Tracking</p>
                          <div className="grid grid-cols-3 gap-2">
                            {msg.responses.map((resp, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-[#8E939D]">{resp.name}:</span>{' '}
                                <span className={resp.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}>
                                  {resp.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Crisis Timeline */}
                      {msg.type === 'crisis' && msg.timeline && (
                        <div className="ml-12 mb-3 p-3 rounded bg-red-950/20 border border-red-500/30">
                          <p className="text-xs font-medium text-red-400 mb-2">Crisis Timeline</p>
                          <div className="space-y-1">
                            {msg.timeline.map((event, idx) => (
                              <div key={idx} className="text-xs flex items-center gap-2">
                                <span className="text-[#5C6270]">{event.time}</span>
                                <span className="text-slate-300">{event.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Decision Log */}
                      {msg.decision && (
                        <div className="ml-12 mb-3 p-3 rounded bg-emerald-950/20 border border-emerald-500/30">
                          <p className="text-xs font-medium text-emerald-400 mb-2">✓ Decision Logged</p>
                          <p className="text-xs text-slate-300">{msg.decision.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-[#5C6270]">Responsible: {msg.decision.responsible}</span>
                            <span className="text-[#5C6270]">Deadline: {msg.decision.deadline}</span>
                            <Badge className="bg-blue-600/20 text-blue-400">{msg.decision.status}</Badge>
                          </div>
                        </div>
                      )}

                      {/* Comments Count */}
                      {msg.comments > 0 && (
                        <div className="ml-12 text-xs text-[#5C6270]">
                          {msg.comments} comments • <Button className="h-auto p-0 text-xs text-purple-400 bg-transparent hover:underline">Join Discussion</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strategic Threads */}
            <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group/card hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-[#8E939D]">Strategic Discussion Threads</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button className="border border-[#00f2ff]/20 bg-[#00f2ff]/5 text-slate-300 h-auto py-3 hover:bg-slate-700">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm">Revenue</div>
                      <div className="text-xs text-[#5C6270]">3 new</div>
                    </div>
                  </Button>
                  <Button className="border border-[#00f2ff]/20 bg-[#00f2ff]/5 text-slate-300 h-auto py-3 hover:bg-slate-700">
                    <Users className="h-4 w-4 mr-2 text-emerald-400" />
                    <div className="text-left">
                      <div className="text-sm">HR</div>
                      <div className="text-xs text-[#5C6270]">1 pending</div>
                    </div>
                  </Button>
                  <Button className="border border-[#00f2ff]/20 bg-[#00f2ff]/5 text-slate-300 h-auto py-3 hover:bg-slate-700">
                    <Hotel className="h-4 w-4 mr-2 text-amber-400" />
                    <div className="text-left">
                      <div className="text-sm">Operations</div>
                      <div className="text-xs text-[#5C6270]">2 decisions</div>
                    </div>
                  </Button>
                  <Button className="border border-[#00f2ff]/20 text-slate-300 h-auto py-3 border-red-500/30 bg-red-950/20 hover:bg-red-900/30">
                    <ShieldAlert className="h-4 w-4 mr-2 text-red-400" />
                    <div className="text-left">
                      <div className="text-sm text-red-400">Crisis</div>
                      <div className="text-xs text-red-400/70">Active</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}