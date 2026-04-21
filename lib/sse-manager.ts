// src/lib/sse-manager.ts

export type SSEEventType =
  | 'notification'
  | 'channel_message'
  | 'room_status'
  | 'task_update'
  | 'vip_alert'
  | 'table_status'       // restaurant table occupied/available/cleaning
  | 'reservation'        // new/updated restaurant reservation
  | 'ping'
  | 'connected'

export interface SSEClient {
  clientId:   string   // unique per connection (userId + tab suffix)
  userId:     string   // the actual user
  hotelId:    string   // which hotel — used to scope broadcasts
  controller: ReadableStreamDefaultController
  connectedAt: string
}

// Key = clientId (unique per tab), not userId
// This means the same user can have multiple tabs open simultaneously
export const clients = new Map<string, SSEClient>()

// ── Broadcast helpers ──────────────────────────────────────────────────────────

export interface SSEEvent {
  type:    SSEEventType
  payload: Record<string, unknown>
}

/**
 * Broadcast to all clients, with optional filtering:
 * - hotelId:      only send to clients in this hotel (default: all hotels)
 * - targetUserId: only send to a specific user (all their tabs)
 */
export function broadcastEvent(
  event:         SSEEvent,
  options: {
    hotelId?:      string
    targetUserId?: string
  } = {}
) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  const encoded = new TextEncoder().encode(data)

  clients.forEach((client, clientId) => {
    // Filter by hotel
    if (options.hotelId && client.hotelId !== options.hotelId) return
    // Filter by user
    if (options.targetUserId && client.userId !== options.targetUserId) return

    try {
      client.controller.enqueue(encoded)
    } catch {
      // Controller is closed — clean up dead connection
      clients.delete(clientId)
    }
  })
}

// Convenience: broadcast to everyone in a hotel
export function broadcastToHotel(hotelId: string, event: SSEEvent) {
  broadcastEvent(event, { hotelId })
}

// Convenience: broadcast to a specific user (all their tabs)
export function broadcastToUser(userId: string, event: SSEEvent) {
  broadcastEvent(event, { targetUserId: userId })
}

export function getActiveConnections(hotelId?: string): number {
  if (!hotelId) return clients.size
  let count = 0
  clients.forEach(c => { if (c.hotelId === hotelId) count++ })
  return count
}

export function removeClient(clientId: string) {
  clients.delete(clientId)
}
