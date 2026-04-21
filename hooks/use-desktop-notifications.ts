// src/hooks/use-desktop-notifications.ts
import { useEffect, useRef, useCallback } from 'react'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

export function useDesktopNotifications() {
  const permissionRef = useRef<NotificationPermission>('default')

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          permissionRef.current = permission
        })
      }
    }
  }, [])

  const showNotification = useCallback(({ title, body, icon = '/logo.png', tag, onClick }: NotificationOptions) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications')
      return
    }

    // Check if we have permission
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        tag, // Same tag = replaces existing notification
        silent: false,
      })

      if (onClick) {
        notification.onclick = () => {
          window.focus()
          onClick()
        }
      }

      return notification
    } else if (Notification.permission !== 'denied') {
      // Request permission if not denied
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification({ title, body, icon, tag, onClick })
        }
      })
    }
  }, [])

  const isSupported = typeof window !== 'undefined' && 'Notification' in window
  const permission = typeof window !== 'undefined' ? Notification?.permission : 'default'

  return {
    showNotification,
    isSupported,
    permission,
    requestPermission: () => {
      if ('Notification' in window && Notification.permission === 'default') {
        return Notification.requestPermission()
      }
      return Promise.resolve(Notification?.permission)
    }
  }
}