import { useEffect, useState } from 'react';
import { useDesktopNotifications } from './use-desktop-notifications';

interface UseRealtimeOptions {
  userId: string;
  enabled?: boolean;
  onChannelMessage?: () => void;
  onNotification?: () => void;
  onTaskUpdate?: () => void;
  onRoomStatusChange?: (payload: Record<string, unknown>) => void;
  enableDesktopNotifications?: boolean;
}

export function useRealtime({ 
  userId, 
  enabled = true, 
  onChannelMessage,
  onNotification,
  onTaskUpdate,
  onRoomStatusChange,
  enableDesktopNotifications = false
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { showNotification, isSupported, permission } = useDesktopNotifications();

  useEffect(() => {
    if (!userId || !enabled) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`/api/sse?userId=${userId}`);

        eventSource.onopen = () => {
          console.log('SSE connected');
          setIsConnected(true);
          setError(null);
          retryCount = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'channel_message') {
              if (enableDesktopNotifications && data.payload) {
                showNotification({
                  title: `New ${data.payload.type || 'message'} from ${data.payload.senderName || 'Channel'}`,
                  body: data.payload.message || data.payload.content || 'New message',
                  tag: 'channel-message',
                  onClick: () => {
                    window.location.href = '/channel';
                  }
                });
              }
              if (onChannelMessage) onChannelMessage();
              
            } else if (data.type === 'notification') {
              if (enableDesktopNotifications && data.payload) {
                showNotification({
                  title: data.payload.title || 'New Notification',
                  body: data.payload.message || data.payload.body || '',
                  tag: 'notification',
                  onClick: () => {
                    window.focus();
                  }
                });
              }
              if (onNotification) onNotification();
              
            } else if (data.type === 'task_update') {
              if (enableDesktopNotifications && data.payload) {
                showNotification({
                  title: 'Task Update',
                  body: data.payload.message || 'Your task has been updated',
                  tag: 'task-update',
                  onClick: () => {
                    window.location.href = '/tasks';
                  }
                });
              }
              if (onTaskUpdate) onTaskUpdate();

            } else if (data.type === 'room_status') {
              // Real-time room status change from housekeeping or any department
              if (onRoomStatusChange) onRoomStatusChange(data.payload);
            }
            
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              eventSource?.close();
              connectSSE();
            }, 3000 * retryCount);
          } else {
            setError(new Error('Failed to connect to realtime service'));
          }
        };

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to connect'));
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId, enabled, onChannelMessage, onNotification, onTaskUpdate, onRoomStatusChange, enableDesktopNotifications, showNotification]);

  return {
    isConnected,
    error,
    notificationSupported: isSupported,
    notificationPermission: permission
  };
}
