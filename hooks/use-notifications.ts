// src/hooks/use-notifications.ts
import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - replace with actual API call
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'New VIP Guest Arrival',
            message: 'Sheikh Mohammed Al-Rashid has checked into the Presidential Suite',
            type: 'INFO',
            read: false,
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
            link: '/dashboard?view=vip-guests'
          },
          {
            id: '2',
            title: 'Urgent Maintenance Required',
            message: 'AC unit in Room 1823 is not cooling - Critical priority',
            type: 'WARNING',
            read: false,
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
            link: '/dashboard?view=engineering'
          },
          {
            id: '3',
            title: 'Security Alert',
            message: 'Unauthorized access attempt at Service Entrance',
            type: 'ERROR',
            read: true,
            createdAt: new Date(Date.now() - 45 * 60000).toISOString(), // 45 mins ago
            link: '/dashboard?view=security'
          },
          {
            id: '4',
            title: 'Task Completed',
            message: 'Room 502 leak has been fixed by Engineering',
            type: 'SUCCESS',
            read: true,
            createdAt: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
            link: '/dashboard?view=engineering'
          },
          {
            id: '5',
            title: 'New Restaurant Booking',
            message: 'Table for 6 booked at Azure Restaurant for 8 PM',
            type: 'INFO',
            read: false,
            createdAt: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
            link: '/dashboard?view=f&b'
          }
        ];
        
        setNotifications(mockNotifications);
        setError(null);
        setIsLoading(false);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      
    } catch (err) {
      // Revert on error
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/read-all`, { method: 'POST' });
      
    } catch (err) {
      // Revert on error
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: false }))
      );
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}

// Optional: Add a hook for real-time notifications
export function useRealtimeNotifications(userId: string) {
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    
    // This would connect to your SSE or WebSocket endpoint
    // For now, just a mock interval
    const interval = setInterval(() => {
      // Simulate a new notification every 30 seconds (for demo)
      const shouldAddNotification = Math.random() > 0.7;
      
      if (shouldAddNotification) {
        const types: Array<'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'> = ['INFO', 'WARNING', 'SUCCESS'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newNotif: Notification = {
          id: `realtime-${Date.now()}`,
          title: `New ${type} Alert`,
          message: `This is a simulated ${type.toLowerCase()} notification`,
          type,
          read: false,
          createdAt: new Date().toISOString(),
        };
        
        setRealtimeNotifications(prev => [newNotif, ...prev].slice(0, 5));
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId]);
  
  return { realtimeNotifications };
}