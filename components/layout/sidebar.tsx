"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore, useChannelStore } from "@/store"
import { Server, Stethoscope } from "lucide-react";

import { 
  normalizeRole, 
  isGeneralManager,
  UserRole,
  ROLE_LABELS 
} from "@/lib/roles"
import {
  LayoutDashboard, Building2,
  Settings, ChevronLeft, ChevronRight,
  Users, BarChart3,
  MessageSquare,
  ConciergeBell, Sparkles,
  UtensilsCrossed, Calendar, Bell, ChefHat,
  Flower2, Dumbbell, HeartPulse,
  Wrench, Shield, Monitor,
  DollarSign, UserCheck, TrendingUp,
  Crown, BedDouble, Hotel,
} from "lucide-react"

import { 
  // ... other icons
  Utensils,
  // ... other icons
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
  gmOnly?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, permissions } = useAuthStore()
  const { unread } = useChannelStore()

  const normalizedRole = user?.role ? normalizeRole(user.role) : null
  const isGM = normalizedRole ? isGeneralManager(normalizedRole) : false

  const getRoleBadgeDisplay = () => {
    if (!normalizedRole) return "User"
    const emojiMap: Record<UserRole, string> = {
      GENERAL_MANAGER: "👑",
      HOUSEKEEPING_MANAGER: "✨",
      ENGINEERING_MANAGER: "🔧",
      FB_MANAGER: "🍽️",
      GUEST_SERVICES_MANAGER: "🛎️",
      SECURITY_MANAGER: "🛡️",
    }
    const emoji = emojiMap[normalizedRole] || "👤"
    const label = ROLE_LABELS[normalizedRole] || normalizedRole
    return `${emoji} ${label}`
  }

  const isActive = (href: string) => {
    const [path, query] = href.split("?")
    
    if (path !== pathname && !pathname.startsWith(path + "/")) return false
    
    if (query) {
      const searchParamsObj = new URLSearchParams(query)
      let isMatch = true
      searchParamsObj.forEach((value, key) => {
        if (searchParams.get(key) !== value) isMatch = false
      })
      return isMatch
    } else {
      // For links without queries (e.g. "/dashboard"), it's only active if no query params exist (or at least no 'view' param)
      return !searchParams.has('view') && (pathname === path || pathname.startsWith(path + "/"))
    }
  }

  const mainItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "GM Overview", href: "/dashboard?view=gm-overview", icon: Crown  },
  ]

  const getSections = (): NavSection[] => [
    {
      label: "ROOMS DIVISION",
      items: [
        { name: "Front Desk", href: "/dashboard?view=front-desk", icon: Hotel },
        { name: "VIP Guests", href: "/dashboard?view=vip", icon: Crown },
        { name: "Housekeeping", href: "/dashboard?view=housekeeping", icon: Sparkles }
      ],
    },
    {
      label: "FOOD & BEVERAGE",
      items: [
        { name: "Restaurants & Bars", href: "/dashboard?view=restaurants", icon: Utensils },
        { name: "Banquet & Events", href: "/dashboard?view=banquet", icon: Calendar },
        { name: "Room Service", href: "/dashboard?view=room-service", icon: Bell },

        
      ],
    },
    {
      label: "WELLNESS & RECREATION",
      items: [
        { name: "Spa", href: "/dashboard?view=spa", icon: Sparkles },
       { name: "Gym & Recreation", href: "/dashboard?view=gym", icon: Dumbbell },
        { name: "Clinic", href: "/dashboard?view=clinic", icon: Stethoscope },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { name: "Engineering & Facilities", href: "/dashboard?view=engineering",icon: Wrench, },
        { name: "Security", href: "/dashboard?view=security", icon: Shield },
        { name: "IT Department", href: "/dashboard?view=it", icon: Server }
      ],
    },
    {
      label: "BUSINESS",
      items: [
        {  name: "Finance", href: "/dashboard?view=finance", icon: DollarSign},
        { name: "Human Resources", href: "/dashboard?view=hr", icon: Users },
        { name: "Sales & Marketing", href: "/dashboard?view=sales", icon: TrendingUp  },
      ],
    },
    {
      label: "COMMUNICATION",
      items: [
        { name: "Channel", href: "/dashboard?view=channel", icon: MessageSquare  },
      ],
    },
    {
      label: "ADMINISTRATION",
      items: [
        { name: "Hotel Settings", href: "/dashboard?view=hotel-settings", icon: Building2 },
        {  name: "Reports", href: "/dashboard?view=reports", icon: BarChart3 },
        ...(permissions?.manageUsers
          ? [{ name: "Users", href: "/dashboard?view=users", icon: Users  }]
          : []),
      ],
    },
  ]

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    const Icon = item.icon

    if (item.gmOnly && !isGM) return null

    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 text-[15px] font-medium transition-all duration-300 overflow-hidden",
          collapsed ? "justify-center rounded-full w-12 h-12 mx-auto" : "rounded-xl",
          active
            ? "bg-[#00f2ff]/10 text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.15)] border border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            : "text-[#8E939D] border border-transparent hover:bg-[#00f2ff]/5 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)]"
        )}
      >
        {!active && <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
        
        <Icon className={cn(
          "flex-shrink-0 transition-colors duration-300 relative z-10",
          collapsed ? "h-5 w-5" : "h-4 w-4",
          active ? "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-[#8E939D] group-hover:text-[#00f2ff] group-hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]"
        )} />

        {!collapsed && (
          <>
            <span className="flex-1 truncate tracking-wider font-bold relative z-10 group-hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.15)]">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.8)] text-[#0a0c10] text-[11px] flex items-center justify-center font-bold relative z-10">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {active && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)] animate-pulse relative z-10" />
            )}
          </>
        )}
        {collapsed && active && (
           <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)] animate-pulse z-10" />
        )}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-[#00f2ff]/15 bg-[#0a0c10] transition-all duration-300 flex-shrink-0 h-full font-sans",
        collapsed ? "w-[88px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-[#00f2ff]/10 px-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] group-hover:border-[#00f2ff]/50 transition-all flex-shrink-0">
            <span className="text-xl font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">X</span>
          </div>
          {!collapsed && (
            <span className="text-2xl font-bold tracking-[0.15em] text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">XYLO</span>
          )}
        </Link>
      </div>



      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 min-h-0 custom-scrollbar">
        {/* Main nav */}
        <nav className="space-y-1.5 px-3 mb-4">
          {mainItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Sections */}
        {getSections().map((section) => (
          <div key={section.label} className="mt-6 px-3">
            {!collapsed && (
              <h3 className="px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] mb-3">
                {section.label}
              </h3>
            )}
            {collapsed && <div className="border-t border-[#00f2ff]/20 mb-3 mx-2" />}
            <nav className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0c10] to-transparent pointer-events-none" />

      {/* Collapse button */}
      <button
        className="absolute -right-3.5 top-24 h-7 w-7 rounded-full border border-[#00f2ff]/30 bg-[#0a0c10] text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.15)] hover:text-[#8E939D] hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] flex items-center justify-center z-10 transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.15)] hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  )
  
}
