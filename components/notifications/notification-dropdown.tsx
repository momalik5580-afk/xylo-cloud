"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "./notification-list"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationDropdownProps {
  userId: string
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  
  // ✅ FIXED: Pass userId directly, not as an options object
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isLoading  // Hook returns isLoading
  } = useNotifications(userId)  // ← Just pass the string directly

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-[#8E939D] hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-red-500"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 bg-slate-900 border-slate-800 text-[#8E939D] p-0"
      >
        <NotificationList
          notifications={notifications}
          loading={isLoading}  // ✅ Map isLoading to loading prop
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          unreadCount={unreadCount}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}