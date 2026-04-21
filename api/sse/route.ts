// src/app/api/sse/route.ts
import { NextRequest } from 'next/server'
import { clients, broadcastEvent, getActiveConnections, removeClient } from '@/lib/sse-manager'
import { verifyToken } from '@/lib/jwt'

// Heartbeat every 25s to keep the connection alive through proxies/load balancers
function startHeartbeat(
  controller: ReadableStreamDefaultController,
  clientId:   string
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try {
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'ping', payload: { ts: Date.now() } })}\n\n`
        )
      )
    } catch {
      // Controller closed — stop heartbeat and remove client
      clearInterval
      removeClient(clientId)
    }
  }, 25000)
}

// GET /api/sse?userId=xxx
// Establishes a persistent SSE connection for a logged-in user.
// Supports multiple tabs: each connection gets a unique clientId.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Read hotel_id from JWT token for hotel-scoped broadcasting
  let userId  = searchParams.get('userId') || 'anonymous'
  let hotelId = 'unknown'

  const token = request.cookies.get('xylo-token')?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (token) {
    try {
      const payload = verifyToken(token)
      userId  = payload.userId  || userId
      hotelId = payload.hotel_id || hotelId
    } catch {
      // Token invalid — still allow connection but with no hotel scoping
    }
  }

  // Unique clientId per tab — prevents multi-tab overwrite
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  let heartbeatInterval: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      clients.set(clientId, {
        clientId,
        userId,
        hotelId,
        controller,
        connectedAt: new Date().toISOString(),
      })

      // Send connected confirmation
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({
            type: 'connected',
            payload: {
              clientId,
              userId,
              hotelId,
              connectedAt:       new Date().toISOString(),
              activeConnections: getActiveConnections(hotelId),
            },
          })}\n\n`
        )
      )

      heartbeatInterval = startHeartbeat(controller, clientId)
    },

    cancel() {
      // Client disconnected — clean up
      clearInterval(heartbeatInterval)
      removeClient(clientId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache, no-transform',
      'Connection':       'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// POST /api/sse
// Internal endpoint to manually push events (useful for testing or server-to-server)
// Body: { type, payload, hotelId?, targetUserId? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, payload, hotelId, targetUserId } = body

    if (!type || !payload) {
      return Response.json({ error: 'type and payload are required' }, { status: 400 })
    }

    broadcastEvent({ type, payload }, { hotelId, targetUserId })

    return Response.json({
      success:           true,
      activeConnections: getActiveConnections(hotelId),
    })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
