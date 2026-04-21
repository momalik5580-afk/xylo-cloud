// src/components/settings/notification-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications'
import { Bell, BellOff } from 'lucide-react'

export function NotificationSettings() {
  const { isSupported, permission, requestPermission } = useDesktopNotifications()
  const [enabled, setEnabled] = useState(permission === 'granted')

  useEffect(() => {
    setEnabled(permission === 'granted')
  }, [permission])

  const toggleNotifications = async () => {
    if (permission === 'granted') {
      // Can't programmatically disable browser notifications
      // User must do it through browser settings
      alert('To disable notifications, please use your browser settings')
    } else {
      const newPermission = await requestPermission()
      setEnabled(newPermission === 'granted')
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-[#8E939D]0">
        Desktop notifications are not supported in this browser
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="h-5 w-5 text-emerald-400" />
        ) : (
          <BellOff className="h-5 w-5 text-[#8E939D]0" />
        )}
        <div>
          <p className="text-sm font-medium text-[#8E939D]">
            Desktop Notifications
          </p>
          <p className="text-xs text-[#8E939D]0">
            {enabled 
              ? 'You will receive notifications for new messages' 
              : 'Enable to get notifications when tab is in background'}
          </p>
        </div>
      </div>
      <button
        onClick={toggleNotifications}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          enabled 
            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
            : 'bg-blue-600 text-[#8E939D] hover:bg-blue-700'
        }`}
      >
        {enabled ? 'Enabled' : 'Enable'}
      </button>
    </div>
  )
}