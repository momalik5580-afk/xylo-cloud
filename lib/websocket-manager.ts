export const wsClients = new Map<string, {
  userId: string
  ws: WebSocket
  connectedAt: string
}>()

export function broadcastWSEvent(
  event: Record<string, unknown>,
  targetUserId?: string
) {
  const data = JSON.stringify(event)

  if (targetUserId) {
    const client = wsClients.get(targetUserId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data)
      } catch (error) {
        console.error(`Error sending to ${targetUserId}:`, error)
        wsClients.delete(targetUserId)
      }
    }
  } else {
    wsClients.forEach((client, id) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data)
        } catch (error) {
          console.error(`Error broadcasting to ${id}:`, error)
          wsClients.delete(id)
        }
      } else {
        wsClients.delete(id)
      }
    })
  }
}

export function getActiveConnections() {
  return {
    count: wsClients.size,
    users: Array.from(wsClients.values()).map(c => ({
      userId: c.userId,
      connectedAt: c.connectedAt
    }))
  }
}