import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET notifications for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unread") === "true"

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      )
    }

    // FIXED: notifications instead of notification (plural)
    // FIXED: user_id instead of userId
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { created_at: "desc" }, // FIXED: snake_case
      take: 50,
    })

    // Transform snake_case to camelCase for frontend
    const formattedNotifications = notifications.map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      link: n.link,
      metadata: n.metadata,
      readAt: n.read_at,
      createdAt: n.created_at,
      hotelId: n.hotel_id
    }))

    const unreadCount = await prisma.notifications.count({
      where: {
        user_id: userId,
        read: false,
      },
    })

    return NextResponse.json({ 
      notifications: formattedNotifications, 
      unreadCount 
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PATCH mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, markAllRead, userId } = body

    if (markAllRead && userId) {
      // FIXED: notifications instead of notification
      await prisma.notifications.updateMany({
        where: { 
          user_id: userId,  // FIXED: snake_case
          read: false 
        },
        data: { 
          read: true,
          read_at: new Date()  // ✅ Only read_at, no updated_at
        },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      // FIXED: notifications instead of notification
      const notification = await prisma.notifications.update({
        where: { id },
        data: { 
          read: true,
          read_at: new Date()  // ✅ Only read_at, no updated_at
        },
      })

      // Transform for response
      return NextResponse.json({ 
        notification: {
          id: notification.id,
          userId: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          readAt: notification.read_at,
          createdAt: notification.created_at
        }
      })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

// POST create notification (for internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, link, hotelId } = body

    // FIXED: notifications instead of notification
    // FIXED: snake_case field names
    const notification = await prisma.notifications.create({
      data: {
        user_id: userId,
        title,
        message,
        type: type || "INFO",
        read: false,
        link: link || null,
        hotel_id: hotelId || null,
        created_at: new Date()
        // ✅ No updated_at
      },
    })

    // Transform for response
    return NextResponse.json({ 
      notification: {
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        link: notification.link,
        createdAt: notification.created_at
      }
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}