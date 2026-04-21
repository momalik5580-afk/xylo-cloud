import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/channel — fetch recent messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deptCode = searchParams.get("dept") // optional filter
    const limit = parseInt(searchParams.get("limit") || "50")

    const messages = await prisma.channel_messages.findMany({
      where: deptCode
        ? {
            OR: [
              { target_dept: deptCode },
              { target_dept: null },       // broadcasts
              { sender_dept: deptCode },
            ],
          }
        : {},
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        users: {  // Relation name correctly matches the schema
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Channel GET error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/channel — send a message/request/alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      senderId,
      senderName,
      senderDept,
      senderRole,
      targetDept,
      type,
      content,
    } = body

    if (!senderId || !content || !type) {
      return NextResponse.json(
        { error: "senderId, content, and type are required" },
        { status: 400 }
      )
    }

    const message = await prisma.channel_messages.create({
      data: {
        sender_id: senderId,
        sender_name: senderName,
        sender_dept: senderDept,
        sender_role: senderRole,
        target_dept: targetDept || null,
        type: type,
        content: content,
        status: "pending",
      },
    })

    // Create notifications for target dept users
    if (targetDept) {
      const targetUsers = await prisma.users.findMany({
        where: { 
          // FIXED: Syntax error removed & correct Prisma relation name used for a user's department
          departments_users_department_idTodepartments: { 
            code: targetDept 
          }, 
          is_active: true 
        },
        select: { id: true },
      })
      
      if (targetUsers.length > 0) {
        await prisma.notifications.createMany({
          data: targetUsers.map((u) => ({
            user_id: u.id,
            title: type === "urgent" ? "🚨 Urgent Alert" : `New ${type} from ${senderDept}`,
            message: content,
            type: type === "urgent" ? "WARNING" : "INFO",
            read: false,
          })),
        })
      }
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Channel POST error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

// PATCH /api/channel — update message status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    
    const message = await prisma.channel_messages.update({
      where: { id },
      data: { 
        status,
        updated_at: new Date()
      },
    })
    
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Channel PATCH error:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}