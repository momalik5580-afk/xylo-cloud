"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store"
import { generateAvatarFallback } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import {
  Search,
  HelpCircle,
  LogOut,
  Settings,
  User,
  ChevronDown,
} from "lucide-react"

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    logout()
    router.push("/login")
  }

  // Get user ID from auth store
  const userId = user?.id || ""

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#00f2ff]/20 bg-[#0a0c10]/80 backdrop-blur-xl px-6 shadow-[0_0_15px_rgba(0,242,255,0.03)] hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group overflow-hidden">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {/* Search Bar */}
      <div className="flex flex-1 items-center gap-4 relative z-10">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E939D]0" />
          <Input
            type="search"
            placeholder="Search tasks, Guest Profiles, Inventory..."
            className="w-full pl-10 bg-[#0a0c10]/50 border-[#00f2ff]/20 text-[#8E939D] placeholder:text-[#5C6270] focus:bg-[#00f2ff]/10 focus:border-[#00f2ff]/40 focus:shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.05)] hover:border-[#00f2ff]/30"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Notifications */}
        <NotificationDropdown userId={userId} />

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/30 border border-transparent transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.25)]"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 h-10 px-3 rounded-xl hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/30 border border-transparent hover:text-[#00f2ff] transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.25)]"
            >
              <Avatar className="h-8 w-8 border border-[#00f2ff]/30 drop-shadow-[0_0_8px_rgba(0,242,255,0.1)]">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-600 text-[#8E939D] text-xs">
                 {user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[#8E939D] drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[#8E939D]0 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0a0c10] border-[#00f2ff]/20 text-[#8E939D] shadow-[0_0_15px_rgba(0,242,255,0.15)]">
            <DropdownMenuLabel className="text-[#8E939D] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#00f2ff]/10" />
            
            {/* Profile - NOW WITH NAVIGATION */}
            <DropdownMenuItem 
              onClick={() => router.push("/profile")}
              className="text-slate-300 focus:text-[#00f2ff] focus:bg-[#00f2ff]/10 hover:text-[#00f2ff] hover:bg-[#00f2ff]/5 cursor-pointer transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            {/* Settings - NOW WITH NAVIGATION */}
            <DropdownMenuItem 
              onClick={() => router.push("/settings")}
              className="text-slate-300 focus:text-[#00f2ff] focus:bg-[#00f2ff]/10 hover:text-[#00f2ff] hover:bg-[#00f2ff]/5 cursor-pointer transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-[#00f2ff]/10" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all drop-shadow-[0_0_5px_rgba(239,68,68,0.15)]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}