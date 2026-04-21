import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || "anonymous"

  return NextResponse.json({
    status: "WebSocket endpoint",
    message: "Use /api/sse for real-time updates",
    userId,
    sseEndpoint: `/api/sse?userId=${userId}`,
  })
}